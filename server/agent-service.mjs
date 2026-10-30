import * as E from './vendor/ethers.mjs';
import {protocol} from '../dist/agent-protocol.mjs';
import {deployedContracts} from './deployed-contracts.mjs';

export const identityRegistry=Object.freeze({chainId:56,address:'0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F',codeHash:'0xc4006e6e6ffaaf6996116617392beabe4f5f0a0795841322f91c2ceac34d6ace',rpc:'https://bsc-dataseed.bnbchain.org',name:'SPACE ID Agent ID',tokenIdRule:'keccak256(utf8(lowercase_handle_without_ai_suffix))'});
const rhRpc='https://rpc.mainnet.chain.robinhood.com';
const abi={
 registry:new E.Interface(['function ownerOf(uint256) view returns(address)','function tokenURI(uint256) view returns(string)']),
 parts:new E.Interface(['function openedAt() view returns(uint256)','function closesAt() view returns(uint256)','function quoteIssued() view returns(uint256)','function settleIssued() view returns(uint256)','function freeClaims() view returns(uint256)','function claimedAgent(bytes32) view returns(bool)','function claimedWallet(address) view returns(bool)','function balanceOf(address,uint256) view returns(uint256)','function isApprovedForAll(address,address) view returns(bool)','function setApprovalForAll(address,bool)','function claimFree((bytes32 agentId,uint256 nonce,uint256 deadline,bytes signature))','function buy(uint256,uint256,(bytes32 agentId,uint256 nonce,uint256 deadline,bytes signature),(uint256 unitWei,uint256 nonce,uint256 deadline,bytes signature))']),
 circuits:new E.Interface(['function ownerOf(uint256) view returns(address)','function issued(uint256) view returns(uint256)','function teamEpicIssued() view returns(uint256)','function teamRareIssued() view returns(uint256)','function balanceOf(address) view returns(uint256)','function totalIssued() view returns(uint256)','function rewardToken() view returns(address)','function credit(address) view returns(uint256)','function pending(uint256) view returns(uint256)','function assemble(uint8,(bytes32 agentId,uint256 nonce,uint256 deadline,bytes signature))','function claim(uint256[])','function setApprovalForAll(address,bool)','function isApprovedForAll(address,address) view returns(bool)','function getApproved(uint256) view returns(address)']),
 market:new E.Interface(['function nextListing() view returns(uint256)','function listings(uint256) view returns(address seller,bool circuit,uint256 tokenId,uint256 amount,uint256 unitWei,uint256 deadline)','function list(bool,uint256,uint256,uint256,uint256,(bytes32 agentId,uint256 nonce,uint256 deadline,bytes signature)) returns(uint256)','function buy(uint256,uint256,(bytes32 agentId,uint256 nonce,uint256 deadline,bytes signature))','function cancel(uint256)']),
 token:new E.Interface(['function balanceOf(address) view returns(uint256)']),
 gate:new E.Interface(['function verifier() view returns(address)'])
};
export const ownershipTypes={Ownership:[{name:'wallet',type:'address'},{name:'agentId',type:'bytes32'},{name:'challenge',type:'bytes32'},{name:'intentHash',type:'bytes32'},{name:'deadline',type:'uint256'}]};
const permitTypes={AgentPermit:[{name:'consumer',type:'address'},{name:'account',type:'address'},{name:'agentId',type:'bytes32'},{name:'action',type:'bytes32'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]};
const priceTypes={Price:[{name:'account',type:'address'},{name:'quote',type:'uint256'},{name:'settle',type:'uint256'},{name:'unitWei',type:'uint256'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]};
const coder=E.AbiCoder.defaultAbiCoder(),MAX=2n**256n-1n;
const lower=x=>String(x).toLowerCase();
const fault=(message,status=400)=>Object.assign(new Error(message),{status});
const result=(body,status=200)=>new Response(JSON.stringify(body,(_,v)=>typeof v==='bigint'?v.toString():v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function address(value){if(typeof value!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(value)||BigInt(value)===0n)throw fault('Invalid wallet');return E.getAddress(lower(value));}
function integer(value,label,{positive=false,max=MAX}={}){const s=String(value??'');if(!/^(0|[1-9][0-9]{0,77})$/.test(s))throw fault('Invalid '+label);const n=BigInt(s);if(n>max||(positive&&n===0n))throw fault('Invalid '+label);return n.toString();}
export function canonicalIdentity(name){if(typeof name!=='string'||!/^([a-z0-9]{3,15})\.ai$/.test(name))throw fault('Use a canonical lowercase Agent ID');const handle=name.slice(0,-3);return{name,handle,tokenId:E.id(handle),agentId:E.id(handle)};}
export function normalizeIntent(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw fault('Intent required');
 switch(value.action){
 case 'free':return{action:'free'};
 case 'paid':{const quote=integer(value.quote??0,'Quote',{max:77700n}),settle=integer(value.settle??0,'Settle',{max:19425n});if(BigInt(quote)+BigInt(settle)===0n)throw fault('Choose positive quantities');return{action:'paid',quote,settle};}
 case 'assemble':if(!['common','rare','epic'].includes(value.tier))throw fault('Invalid rarity');return{action:'assemble',tier:value.tier};
 case 'list':{if(!['quote','settle','circuit'].includes(value.asset))throw fault('Invalid asset');const tokenId=value.asset==='circuit'?integer(value.tokenId,'token ID',{positive:true,max:10000n}):value.asset==='quote'?'0':'1';const amount=integer(value.amount??1,'amount',{positive:true,max:value.asset==='circuit'?1n:80000n});return{action:'list',asset:value.asset,tokenId,amount,unitWei:integer(value.unitWei,'ETH unit price',{positive:true}),listingDeadline:integer(value.listingDeadline,'listing expiry',{positive:true,max:BigInt(Number.MAX_SAFE_INTEGER)})};}
 case 'fill':return{action:'fill',listingId:integer(value.listingId,'listing ID',{positive:true}),amount:integer(value.amount??1,'amount',{positive:true,max:80000n})};
 default:throw fault('Unsupported authorization action');
 }
}
export function unitWeiFromUsd(price){if(typeof price!=='string'||!/^\d{1,7}(\.\d{1,8})?$/.test(price))throw fault('Invalid ETH/USD quote',503);const [whole,fraction='']=price.split('.');const scaled=BigInt(whole)*100000000n+BigInt(fraction.padEnd(8,'0'));if(scaled<100n*100000000n||scaled>1000000n*100000000n)throw fault('ETH/USD quote outside accepted range',503);const numerator=30n*10n**18n*100000000n,denominator=100n*scaled;return(numerator+denominator-1n)/denominator;}
async function boundedJson(response,max=131072){if(!response.ok)throw fault('Upstream unavailable',503);const reader=response.body.getReader();let size=0,parts=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw fault('Upstream response too large',503);}parts.push(value);}const out=new Uint8Array(size);let pos=0;for(const p of parts){out.set(p,pos);pos+=p.length;}try{return JSON.parse(new TextDecoder().decode(out));}catch{throw fault('Upstream invalid JSON',503);}}
async function payload(request){if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw fault('JSON required',415);return boundedJson(new Response(request.body),16384);}
function hexNonce(){return E.hexlify(crypto.getRandomValues(new Uint8Array(32)));}

export function createAgentService(options={}){
 const p=options.protocol||protocol,deployed=options.deployed||deployedContracts,clock=options.now||(()=>Date.now()),fetcher=options.fetch||fetch;
 const ca=deployed.addresses||{};
 const configured=["AgentGate","FillOutParts","FillOutCircuits","VRAM","FillOutMarket"].every(k=>E.isAddress(ca[k]||""));
 const seconds=()=>Math.floor(clock()/1000);
 const ownershipDomain={name:'FillOut Agent Ownership',version:'1',chainId:4663,verifyingContract:ca.AgentGate};
 let statusPending=null,statusCached=null,statusCachedAt=0;const rpcQueues=new Map();const publicRpcCache=new Map();
 async function rpc(chain,method,params,env){if(options.rpc)return options.rpc(chain,method,params);const target=chain===56?(env.FILLOUT_IDENTITY_RPC_URL||identityRegistry.rpc):(env.FILLOUT_RPC_URL||rhRpc);if(!target.startsWith('https://'))throw fault('HTTPS RPC required',503);const cacheable=['eth_getCode','eth_chainId'].includes(method),cacheKey=target+method+JSON.stringify(params),cached=publicRpcCache.get(cacheKey);if(cacheable&&cached&&cached.expires>clock())return cached.value;const request=(rpcQueues.get(chain)||Promise.resolve()).then(async()=>{let response;for(let attempt=0;attempt<3;attempt++){response=await fetcher(target,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000),redirect:'manual'});if(![429,503].includes(response.status))break;await response.arrayBuffer();await new Promise(resolve=>setTimeout(resolve,300*(attempt+1)));}if(!response.ok)throw fault('RPC unavailable: '+chain+' '+method+' HTTP '+response.status,503);const parsed=await boundedJson(response);if(cacheable&&!parsed.error)publicRpcCache.set(cacheKey,{value:parsed.result,expires:clock()+30000});return parsed;});rpcQueues.set(chain,request.catch(()=>{}).then(()=>new Promise(resolve=>setTimeout(resolve,120))));const data=await request;if(data.error||!('result'in data))throw fault('Chain read unavailable',503);return data.result;}
 async function call(which,method,args,env){const names={parts:'FillOutParts',circuits:'FillOutCircuits',gate:'AgentGate',market:'FillOutMarket',token:'VRAM'};const target=which==='registry'?identityRegistry.address:ca[names[which]];const raw=await rpc(which==='registry'?56:4663,'eth_call',[{to:target,data:abi[which].encodeFunctionData(method,args)},'latest'],env);try{return abi[which].decodeFunctionResult(method,raw);}catch{throw fault('Contract response invalid',503);}}
 async function chains(env){const ids=await Promise.all([rpc(4663,'eth_chainId',[],env),rpc(56,'eth_chainId',[],env)]);if(BigInt(ids[0])!==4663n||BigInt(ids[1])!==56n)throw fault('Wrong RPC chain',503);}
 async function pinnedCode(env,identity=false){if(!identity&&!configured)throw fault("New deployment addresses await confirmation",503);const all=identity?[[identityRegistry.address,identityRegistry.codeHash,56]]:Object.entries(deployed.runtimeCodeHashes).map(([name,hash])=>[ca[name],hash,4663]);await Promise.all(all.map(async([addr,hash,chain])=>{const code=await rpc(chain,'eth_getCode',[addr,'latest'],env);if(E.keccak256(code)!==hash)throw fault('Contract code changed; authorization halted',503);}));}
 async function chainState(env){const [opening,close,q,s,free]=await Promise.all(['openedAt','closesAt','quoteIssued','settleIssued','freeClaims'].map(m=>call('parts',m,[],env).then(v=>v[0])));return{openedAt:Number(opening),closesAt:Number(close),quoteIssued:q.toString(),settleIssued:s.toString(),freeClaims:Number(free),mintOpen:opening>0n&&seconds()>=Number(opening)&&seconds()<Number(close),mintClosed:opening>0n&&seconds()>=Number(close)};}
 async function publicMintState(env){
 if(options.rpc){await pinnedCode(env);return chainState(env);}
 const methods=['openedAt','closesAt','quoteIssued','settleIssued','freeClaims'];
 const batch=[{jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]},{jsonrpc:'2.0',id:2,method:'eth_getCode',params:[ca.FillOutParts,'latest']},...methods.map((name,i)=>({jsonrpc:'2.0',id:i+3,method:'eth_call',params:[{to:ca.FillOutParts,data:abi.parts.encodeFunctionData(name,[])},'latest']}))];
 const response=await fetcher(env.FILLOUT_RPC_URL||rhRpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(batch),signal:AbortSignal.timeout(6000),redirect:'manual'});
 const data=await boundedJson(response);if(!Array.isArray(data)||data.length!==7)throw fault('Status batch unavailable',503);const byId=new Map(data.map(x=>[x.id,x]));
 if(batch.some(x=>!byId.has(x.id)||byId.get(x.id).error))throw fault('Status batch rejected',503);
 if(BigInt(byId.get(1).result)!==4663n||E.keccak256(byId.get(2).result)!==deployed.runtimeCodeHashes.FillOutParts)throw fault('Status chain or code mismatch',503);
 const values=methods.map((name,i)=>abi.parts.decodeFunctionResult(name,byId.get(i+3).result)[0]);const [opening,close,q,st,free]=values;
 return {openedAt:Number(opening),closesAt:Number(close),quoteIssued:q.toString(),settleIssued:st.toString(),freeClaims:Number(free),mintOpen:opening>0n&&seconds()>=Number(opening)&&seconds()<Number(close),mintClosed:opening>0n&&seconds()>=Number(close)};
 }
 async function signer(env){if(options.signer)return options.signer;const key=env.FILLOUT_SIGNER_PRIVATE_KEY;if(!key)return null;try{const wallet=new E.Wallet(key);if(lower(wallet.address)!==lower(p.recipients.creator))throw Error();return wallet;}catch{throw fault('Signing service configuration mismatch',503);}}
 async function ready(env){if(!configured||!env.DB)return false;const s=await signer(env);return !!s&&env.FILLOUT_AGENT_SERVICE_ENABLED==='true';}
 async function authoritativeOwner(identity,wallet,env){await pinnedCode(env,true);const [owner]=await call('registry','ownerOf',[BigInt(identity.tokenId)],env);if(lower(owner)!==lower(wallet))throw fault('Agent ID does not belong to this wallet',403);return owner;}
 async function quote(env){if(options.quote)return options.quote();const response=await fetcher('https://api.coinbase.com/v2/prices/ETH-USD/spot',{headers:{Accept:'application/json','Cache-Control':'no-cache'},signal:AbortSignal.timeout(8000),redirect:'manual'});const timestamp=Date.parse(response.headers.get('date')||'');const age=Number(response.headers.get('age')||0);if(!Number.isFinite(timestamp)||Math.abs(clock()-timestamp)>60000||!Number.isFinite(age)||age>30)throw fault('Stale ETH/USD source',503);const body=await boundedJson(response,4096);if(body.data?.base!=='ETH'||body.data?.currency!=='USD')throw fault('Wrong quote currency',503);return{price:body.data.amount,source:'Coinbase ETH/USD spot',observedAt:timestamp};}
 async function authorizeIntent(wallet,identity,intent,env,signing,nonce,deadline){
  const state=await chainState(env);let consumer,action,method,args,price=null,value=0n,approval=null;
  if(intent.action==='free'||intent.action==='paid'){
   if(!state.mintOpen)throw fault('Mint is not open',409);consumer=ca.FillOutParts;
   if(intent.action==='free'){
    const [idUsed,walletUsed]=await Promise.all([call('parts','claimedAgent',[identity.agentId],env),call('parts','claimedWallet',[wallet],env)]);
    if(idUsed[0]||walletUsed[0]||state.freeClaims>=4998)throw fault('Free claim already used or unavailable',409);
    if(BigInt(state.quoteIssued)+4n>80000n||BigInt(state.settleIssued)+1n>20000n)throw fault('Free inventory unavailable',409);
    action=E.id('FREE');method='claimFree';args=[];
   }else{
    if(BigInt(state.quoteIssued)+BigInt(intent.quote)>80000n||BigInt(state.settleIssued)+BigInt(intent.settle)>20000n)throw fault('Component supply exceeded',409);
    const observation=await quote(env);if(!Number.isFinite(observation.observedAt)||Math.abs(clock()-observation.observedAt)>60000)throw fault('Stale ETH/USD quote',503);
    const unit=unitWeiFromUsd(observation.price),pd={name:'FillOut ETH Price',version:'1',chainId:4663,verifyingContract:consumer};
    const pv={account:wallet,quote:intent.quote,settle:intent.settle,unitWei:unit.toString(),nonce,deadline};
    const signature=await signing.signTypedData(pd,priceTypes,pv);if(lower(E.verifyTypedData(pd,priceTypes,pv,signature))!==lower(p.recipients.creator))throw fault('Price signer mismatch',503);
    const digest=E.TypedDataEncoder.hash(pd,priceTypes,pv);action=E.keccak256(coder.encode(['string','uint256','uint256','bytes32'],['BUY',intent.quote,intent.settle,digest]));
    price={unitWei:unit.toString(),nonce,deadline,signature};value=(BigInt(intent.quote)+BigInt(intent.settle))*unit;method='buy';args=[intent.quote,intent.settle];
   }
  }else if(intent.action==='assemble'){
   if(!state.mintClosed)throw fault('Component mint must close before assembly',409);consumer=ca.FillOutCircuits;const tier=['common','rare','epic'].indexOf(intent.tier),recipe=p.tiers?.[tier]||[{quote:4,settle:1,count:4998},{quote:8,settle:2,count:3336},{quote:20,settle:5,count:1666}][tier];
   const [q,s,issued,teamIssued,teamRareIssued,approved]=await Promise.all([call('parts','balanceOf',[wallet,0],env),call('parts','balanceOf',[wallet,1],env),call('circuits','issued',[tier],env),call('circuits','teamEpicIssued',[],env),call('circuits','teamRareIssued',[],env),call('parts','isApprovedForAll',[wallet,consumer],env)]);
   if((tier===1&&issued[0]-teamRareIssued[0]>=3236n)||q[0]<BigInt(recipe.quote)||s[0]<BigInt(recipe.settle)||issued[0]>=BigInt(recipe.count)||(tier===2&&issued[0]-teamIssued[0]>=1591n))throw fault('Recipe or rarity unavailable',409);
   if(!approved[0])approval={chainId:4663,from:wallet,to:ca.FillOutParts,value:'0',inputData:abi.parts.encodeFunctionData('setApprovalForAll',[consumer,true]),scope:'Quote/Settle operator approval for the fixed Circuit burner; revoke when no longer needed'};
   action=E.keccak256(coder.encode(['string','uint8'],['ASSEMBLE',tier]));method='assemble';args=[tier];
  }else if(intent.action==='list'){
   consumer=ca.FillOutMarket;const nft=intent.asset==='circuit',expiry=Number(intent.listingDeadline);if(expiry<=seconds()||expiry>seconds()+30*86400)throw fault('Listing expiry must be within 30 days');
   if(nft){const [owner]=await call('circuits','ownerOf',[intent.tokenId],env);if(lower(owner)!==lower(wallet))throw fault('Not NFT owner',403);}else{const [balance]=await call('parts','balanceOf',[wallet,intent.tokenId],env);if(balance<BigInt(intent.amount))throw fault('Insufficient parts',409);}
   const [approved]=await call(nft?'circuits':'parts','isApprovedForAll',[wallet,consumer],env);
   if(!approved)approval={chainId:4663,from:wallet,to:nft?ca.FillOutCircuits:ca.FillOutParts,value:'0',inputData:abi[nft?'circuits':'parts'].encodeFunctionData('setApprovalForAll',[consumer,true]),scope:'Market operator approval; only reviewed contracts and separately approved orders should be used'};
   action=E.keccak256(coder.encode(['string','bool','uint256','uint256','uint256','uint256'],['LIST',nft,intent.tokenId,intent.amount,intent.unitWei,intent.listingDeadline]));method='list';args=[nft,intent.tokenId,intent.amount,intent.unitWei,intent.listingDeadline];
  }else{
   consumer=ca.FillOutMarket;const l=await call('market','listings',[intent.listingId],env);if(l[0]===E.ZeroAddress||lower(l[0])===lower(wallet)||l[3]<BigInt(intent.amount)||l[5]<BigInt(seconds()))throw fault('Listing unavailable',409);
   if(l[1]){const [owner]=await call('circuits','ownerOf',[l[2]],env);if(lower(owner)!==lower(l[0]))throw fault('Listing asset moved',409);}else{const [balance]=await call('parts','balanceOf',[l[0],l[2]],env);if(balance<BigInt(intent.amount))throw fault('Listing stock moved',409);}
   action=E.keccak256(coder.encode(['string','uint256','uint256','uint256','address'],['FILL',intent.listingId,intent.amount,l[4],l[0]]));method='buy';args=[intent.listingId,intent.amount];value=BigInt(intent.amount)*l[4];if(value>MAX)throw fault('Payment overflow');
  }
  const domain={name:'FillOut Agent Gate',version:'1',chainId:4663,verifyingContract:ca.AgentGate};
  const permit={consumer,account:wallet,agentId:identity.agentId,action,nonce,deadline};const signature=await signing.signTypedData(domain,permitTypes,permit);
  if(lower(E.verifyTypedData(domain,permitTypes,permit,signature))!==lower(p.recipients.creator))throw fault('Authorization signer mismatch',503);
  const ticket={agentId:identity.agentId,nonce,deadline,signature};args.push(ticket);if(price)args.push(price);
  const iface=intent.action==='free'||intent.action==='paid'?abi.parts:intent.action==='assemble'?abi.circuits:abi.market;
  return{chainId:4663,agentId:identity.name,action:intent.action,expiresAt:deadline,permit:ticket,price,approval,transaction:{from:wallet,to:consumer,value:value.toString(),inputData:iface.encodeFunctionData(method,args)},transactionsSent:0,requiresWalletPreviewAndConfirmation:true};
 }
 async function endpoint(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/agent/status'){
   if(request.method!=='GET')throw fault('Method not allowed',405);
   let state=null,error=null;if(configured){try{state=await publicMintState(env);}catch{error='Chain state temporarily unavailable';}}
   const operational=await ready(env);return result({live:operational&&!!state?.mintOpen,contractsDeployed:configured,contracts:ca,chainId:4663,network:4663,agentVerification:operational?'configured':'not_configured',signingServiceReady:operational,marketLive:operational,mint:!configured?'deployment_pending':state?.mintOpen?'open':state?.mintClosed?'closed':'not_started',state,error});
  }
  if(path==='/api/agent/inventory'){
   if(request.method!=='GET')throw fault('Method not allowed',405);const wallet=address(url.searchParams.get('wallet'));await pinnedCode(env);
   const [q,s,n,v,credit]=await Promise.all([call('parts','balanceOf',[wallet,0],env),call('parts','balanceOf',[wallet,1],env),call('circuits','balanceOf',[wallet],env),call('token','balanceOf',[wallet],env),call('circuits','credit',[wallet],env)]);
   return result({chainId:4663,wallet,Quote:q[0],Settle:s[0],circuits:n[0],VRAM:v[0],settledMiningCredit:credit[0],note:'Per-NFT uncheckpointed rewards are additional; use pending(tokenId).'});
  }
  if(path==='/api/agent/quote'){
   if(request.method!=='GET')throw fault('Method not allowed',405);const intent=normalizeIntent({action:'paid',quote:url.searchParams.get('quote')||0,settle:url.searchParams.get('settle')||0});
   const observation=await quote(env),unit=unitWeiFromUsd(observation.price);return result({chainId:4663,paymentCurrency:'ETH',quote:intent.quote,settle:intent.settle,unitWei:unit,totalWei:(BigInt(intent.quote)+BigInt(intent.settle))*unit,priceSource:observation.source,observedAt:observation.observedAt,executable:false,note:'Unsigned estimate. A wallet-bound authorization and current signed price are required for payment.'});
  }
  if(path==='/api/agent/market'){
   if(request.method!=='GET')throw fault('Method not allowed',405);const asset=url.searchParams.get('asset')||'quote';if(!['quote','settle','circuit'].includes(asset))throw fault('Invalid asset');const after=BigInt(integer(url.searchParams.get('after')||'0','cursor'));
   await pinnedCode(env);const [total]=await call('market','nextListing',[],env);const end=total<after+20n?total:after+20n;const listings=[];
   for(let id=after+1n;id<=end;id++){const l=await call('market','listings',[id],env);if(l[0]===E.ZeroAddress||l[5]<BigInt(seconds())||l[3]===0n||((asset==='circuit')!==l[1])||(!l[1]&&l[2]!==BigInt(asset==='quote'?0:1)))continue;listings.push({id,seller:l[0],asset,tokenId:l[2],amount:l[3],unitWei:l[4],deadline:l[5],requiresSettlementRecheck:true});}
   return result({chainId:4663,asset,feeBps:100,feeRecipient:p.team.recipient,listings,nextCursor:end.toString(),hasMore:end<total});
  }
  if(!['/api/agent/challenge','/api/agent/authorize'].includes(path))return null;
  if(request.method!=='POST')throw fault('Method not allowed',405);
  if(!await ready(env))throw fault('Agent signer, identity service or database not configured',503);
  const input=await payload(request);await chains(env);await pinnedCode(env);
  if(path.endsWith('/challenge')){
   const wallet=address(input.wallet),identity=canonicalIdentity(input.agentId),intent=normalizeIntent(input.intent);await authoritativeOwner(identity,wallet,env);
   const threshold=seconds()-60,recent=await env.DB.prepare('SELECT COUNT(*) AS count FROM agent_challenges WHERE wallet = ? AND created_at >= ?').bind(lower(wallet),threshold).first();if(recent.count>=10)throw fault('Too many challenges',429);
   const challenge=hexNonce(),deadline=seconds()+180,intentHash=E.keccak256(E.toUtf8Bytes(JSON.stringify(intent)));
   await env.DB.prepare('INSERT INTO agent_challenges (id, wallet, agent_name, intent_json, created_at, expires_at, used) VALUES (?, ?, ?, ?, ?, ?, 0)').bind(challenge,lower(wallet),identity.name,JSON.stringify(intent),seconds(),deadline).run();
   return result({challenge,expiresAt:deadline,intent,typedData:{domain:ownershipDomain,types:ownershipTypes,primaryType:'Ownership',message:{wallet,agentId:identity.agentId,challenge,intentHash,deadline}},transactionsSent:0,note:'Ownership proof only. This message is not an onchain allowance or transaction.'});
  }
  if(!/^0x[0-9a-fA-F]{64}$/.test(input.challenge||'')||!/^0x[0-9a-fA-F]{130}$/.test(input.signature||''))throw fault('Challenge and wallet signature required');
  const row=await env.DB.prepare('SELECT * FROM agent_challenges WHERE id = ?').bind(input.challenge).first();if(!row||row.used||row.expires_at<seconds())throw fault('Challenge expired or already used',409);
  const identity=canonicalIdentity(row.agent_name),intent=normalizeIntent(JSON.parse(row.intent_json)),wallet=address(row.wallet);
  const message={wallet,agentId:identity.agentId,challenge:row.id,intentHash:E.keccak256(E.toUtf8Bytes(JSON.stringify(intent))),deadline:row.expires_at};
  let recovered;try{recovered=E.verifyTypedData(ownershipDomain,ownershipTypes,message,input.signature);}catch{throw fault('Invalid ownership signature',403);}if(lower(recovered)!==lower(wallet))throw fault('Wallet proof mismatch',403);
  await authoritativeOwner(identity,wallet,env);const changed=await env.DB.prepare('UPDATE agent_challenges SET used = 1 WHERE id = ? AND used = 0 AND expires_at >= ?').bind(row.id,seconds()).run();if(changed.meta?.changes!==1)throw fault('Challenge already consumed',409);
  const signing=await signer(env),nonce=BigInt(row.id).toString(),deadline=seconds()+120;
  return result(await authorizeIntent(wallet,identity,intent,env,signing,nonce,deadline));
 }
 return async(request,env={})=>{try{if(request.method==='GET'&&new URL(request.url).pathname==='/api/agent/status'){if(statusCached&&clock()-statusCachedAt<5000)return statusCached.clone();if(!statusPending)statusPending=endpoint(request,env).then(async r=>{const body=await r.clone().json();if(!body.error){statusCached=r.clone();statusCachedAt=clock();}return r;}).finally(()=>{statusPending=null;});return (await statusPending).clone();}return await endpoint(request,env);}catch(e){return result({error:e.status?e.message:'Identity, price or chain verification unavailable',transactionsSent:0},e.status||503);}};
}
