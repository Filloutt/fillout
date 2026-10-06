import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
for(const file of readdirSync('dist').filter(x=>/\.(mjs|html)$/.test(x))){
 const path=resolve('dist',file),source=readFileSync(path,'utf8');
 const refs=[...source.matchAll(/(?:from\s*|import\s*\(|(?:src|href)=)["']([^"']+)["']/g)].map(m=>m[1]);
 for(const ref of refs){if(/^(?:https?:|data:|#)/.test(ref)||ref.includes('${'))continue;const clean=ref.split(/[?#]/)[0];if(!clean)continue;
 assert.ok(existsSync(clean.startsWith('/')?resolve('dist','.'+clean):resolve(dirname(path),clean)),file+' references missing asset '+ref);
 }
}
console.log('PASS: local module and HTML asset references resolve.');
