import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {get} from 'node:http';
import {fileURLToPath} from 'node:url';
const child=spawn(process.execPath,[fileURLToPath(new URL('./scripts/serve.mjs',import.meta.url))],{cwd:fileURLToPath(new URL('./scripts/',import.meta.url)),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
const ready=new Promise((resolve,reject)=>{
  let output='';child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match)resolve(match[0]);});
  child.on('error',reject);child.on('exit',code=>reject(Error('Server exited: '+code)));
});
try{
  const base=await Promise.race([ready,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Preview start timeout')),10000);timer.unref();})]);
  const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/<title>FillOut/);
  const head=await fetch(base+'/app.mjs',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('x-content-type-options'),'nosniff');
  assert.equal((await fetch(base+'/missing.mjs')).status,404);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  // Keep the path literal: fetch normalizes traversal segments before sending.
  for(const [url,status] of [['/%ZZ',400],['/..%2fpackage.json',403],['/..%5cpackage.json',process.platform==='win32'?403:404]]){
    const response=await new Promise((resolve,reject)=>{get(base+url,res=>{res.resume();resolve(res);}).on('error',reject);});assert.equal(response.statusCode,status,url);
  }
  console.log('PASS: local preview serves from any directory; HEAD, invalid paths, missing files and unsupported methods.');
}finally{const exited=once(child,'exit');child.kill();await exited;}
