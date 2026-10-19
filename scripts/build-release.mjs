import fs from 'node:fs';
if(!process.env.FILL_OUT_ADMIN_EMAIL)throw Error('Set FILL_OUT_ADMIN_EMAIL before building the authenticated backend.');
const assets={};
const types={'.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
for(const name of fs.readdirSync('dist')){if(!fs.statSync('dist/'+name).isFile())continue;const type=types[name.slice(name.lastIndexOf('.'))];if(!type)continue;const binary=/\.(png|ico|woff2)$/.test(name);assets['/'+name]={body:fs.readFileSync('dist/'+name,binary?'base64':'utf8'),type,...(binary?{encoding:'base64'}:{})};}
let runtime=fs.readFileSync('server/analytics.mjs','utf8').replace("import {makeQuestHandler} from './quests.mjs';",'');const quests=fs.readFileSync('server/quests.mjs','utf8').replace('export function makeQuestHandler','function makeQuestHandler');
// Isolate private helper names from the analytics runtime.
runtime="const makeQuestHandler=(()=>{\n"+quests+'\nreturn makeQuestHandler;})();\n'+runtime;
fs.mkdirSync('dist/server',{recursive:true});fs.writeFileSync('dist/server/index.js',runtime+'\nconst assets='+JSON.stringify(assets)+';\nconst adminHtml='+JSON.stringify(fs.readFileSync('server/admin.html','utf8'))+';\nexport default createHandler({assets,adminHtml,adminEmail:'+JSON.stringify(process.env.FILL_OUT_ADMIN_EMAIL)+'});\n');
fs.mkdirSync('dist/.openai',{recursive:true});fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built public release with server-side quest submissions.');
