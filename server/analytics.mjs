import {makeQuestHandler} from './quests.mjs';
let ADMIN_EMAIL=''; // Set once by createHandler; deployments must supply their owner email.
const NO_CACHE={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...NO_CACHE,'Content-Type':'application/json; charset=utf-8'}});
export function isAdmin(request){return !!ADMIN_EMAIL&&!!request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===ADMIN_EMAIL;}
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
export function validRoute(value){return typeof value==='string'&&/^(projects|eligibility|studio|market|wallet|airdrop|data|whitepaper|guide|foundry|(?:openbook|fillout|mint)-[01]|market-(?:openbook|fillout)(?:-[01])?)$/.test(value);}
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
function db(env){if(!env.DB)throw Error('Analytics database unavailable');return env.DB;}
async function collect(request,env,ctx){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const origin=new URL(request.url).origin;
  if(request.headers.get('Origin')!==origin||['cross-site','same-site'].includes(request.headers.get('Sec-Fetch-Site')))return json({error:'Forbidden'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON required'},415);
  if(isAdmin(request)||/bot|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(request.headers.get('User-Agent')||''))return new Response(null,{status:204,headers:NO_CACHE});
  if(Number(request.headers.get('Content-Length'))>1024)return json({error:'Too large'},413);
  // Read a bounded body even when Content-Length is missing.
  const reader=request.body?.getReader();if(!reader)return json({error:'Missing body'},400);
  let size=0,chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return json({error:'Too large'},413);}chunks.push(value);}
  let event;try{const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}event=JSON.parse(new TextDecoder().decode(data));}catch{return json({error:'Invalid JSON'},400);}
  if(!uuid(event.id)||!uuid(event.visitor)||!validRoute(event.route))return json({error:'Invalid event'},400);
  const store=db(env),now=Date.now(),visitor=await hash(event.visitor);
  const recent=await store.prepare('SELECT COUNT(*) AS count FROM analytics_events WHERE visitor = ? AND created_at >= ?').bind(visitor,now-60000).first();
  if(recent.count>=120)return json({error:'Rate limited'},429);
  await store.batch([
    store.prepare('INSERT OR IGNORE INTO analytics_meta (id, started_at) VALUES (1, ?)').bind(now),
    store.prepare('INSERT OR IGNORE INTO analytics_events (id, visitor, route, created_at) VALUES (?, ?, ?, ?)').bind(event.id,visitor,event.route,now),
  ]);
  // Bound each cleanup; migration files alone create the schema.
  if(Math.random()<0.01)ctx.waitUntil(store.prepare('DELETE FROM analytics_events WHERE id IN (SELECT id FROM analytics_events WHERE created_at < ? ORDER BY created_at LIMIT 500)').bind(now-90*86400000).run().catch(()=>console.error('Analytics retention cleanup failed')));
  return new Response(null,{status:204,headers:NO_CACHE});
}
async function report(request,env){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  if(!isAdmin(request))return json({error:request.headers.get('oai-authenticated-user-id')?'Forbidden':'Sign in required'},request.headers.get('oai-authenticated-user-id')?403:401);
  const days=Number(new URL(request.url).searchParams.get('days')||7);
  if(![1,7,30].includes(days))return json({error:'Invalid period'},400);
  const end=Date.now(),start=new Date(end).setUTCHours(0,0,0,0)-(days-1)*86400000,store=db(env);
  const [totals,daily,pages,meta]=await Promise.all([
    store.prepare('SELECT COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors FROM analytics_events WHERE created_at >= ? AND created_at <= ?').bind(start,end).first(),
    store.prepare("SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS day, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors FROM analytics_events WHERE created_at >= ? AND created_at <= ? GROUP BY day ORDER BY day").bind(start,end).all(),
    store.prepare('SELECT route, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors FROM analytics_events WHERE created_at >= ? AND created_at <= ? GROUP BY route ORDER BY pageviews DESC LIMIT 30').bind(start,end).all(),
    store.prepare('SELECT started_at FROM analytics_meta WHERE id = 1').first(),
  ]);
  return json({days,start,end,trackingSince:meta?.started_at||null,totals,daily:daily.results,pages:pages.results});
}
const signIn='/signin-with-chatgpt?return_to=%2Fadmin';
const accessPage=(forbidden=false)=>`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FillOut · Yönetici girişi</title><link rel="stylesheet" href="/admin.css"><main class="login"><a href="/">FillOut</a><h1>${forbidden?'Bu hesap yetkili değil':'Yönetici paneli'}</h1><p>${forbidden?'İstatistikleri yalnızca site sahibinin hesabı görebilir.':'Ziyaretçi istatistiklerini görmek için site sahibi olan ChatGPT hesabıyla giriş yap.'}</p><a class="button" target="_top" href="${forbidden?'/signout-with-chatgpt?return_to=%2Fadmin':signIn}">${forbidden?'Hesap değiştir':'ChatGPT ile giriş yap'}</a></main></html>`;
export function createHandler({assets,adminHtml,adminEmail}){
  ADMIN_EMAIL=String(adminEmail||'').toLowerCase();
  const handleQuests=makeQuestHandler({isAdmin});
  return {async fetch(request,env,ctx){
    const url=new URL(request.url),path=url.pathname;
    try{
      const questResponse=await handleQuests(request,env);if(questResponse)return questResponse;
      if(path==='/api/analytics/event')return await collect(request,env,ctx);
      if(path==='/api/admin/analytics')return await report(request,env);
      if(path==='/admin'||path==='/admin/'){
        const allowed=isAdmin(request),signed=!!request.headers.get('oai-authenticated-user-id');
        return new Response(allowed?adminHtml:accessPage(signed),{status:allowed||!signed?200:403,headers:{...NO_CACHE,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self' https://chatgpt.com https://chatgpt.site"}});
      }
      if(path.startsWith('/api/')||path.startsWith('/server/')||path.startsWith('/.'))return json({error:'Not found'},404);
      if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
      const asset=assets[path==='/'?'/index.html':path];if(!asset)return new Response('Not found',{status:404});
      return new Response(request.method==='HEAD'?null:asset.encoding==='base64'?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
    }catch{console.error('Analytics request failed',path);return json({error:'Statistics temporarily unavailable. Please retry.'},503);}
  }};
}
