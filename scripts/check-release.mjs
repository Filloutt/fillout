import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compile,step,encode,template} from '../dist/engine.mjs';
const files=[];for(const dir of ['dist','server','scripts'])for(const name of fs.readdirSync(dir))if(/\.(mjs|js)$/.test(name)&&fs.statSync(path.join(dir,name)).isFile())files.push(path.join(dir,name));
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});assert.equal(r.status,0,'Syntax: '+file);}
const spec=JSON.parse(fs.readFileSync('docs/release-spec.json'));
assert.deepEqual(spec,JSON.parse(fs.readFileSync('dist/release-spec.json')));
const f=spec.fillout;assert.equal(f.publicMintAllocation+f.teamAllocation,150000);assert.equal(f.quoteCap+f.settleCap,150000);assert.equal(f.publicQuote+f.teamQuote,f.quoteCap);assert.equal(f.publicSettle+f.teamSettle,f.settleCap);assert.equal(f.unitPriceWei,'50000000000000');assert.equal(spec.productionContracts,null);
for(const name of ['contracts','onchain.json','verified-comparison.json','dist/config.json','archive'])assert.equal(fs.existsSync(name),false,'Obsolete artifact: '+name);
for(const file of files.filter(x=>!x.endsWith("ethers.mjs")))assert.equal(/0x[0-9a-fA-F]{40}\b/.test(fs.readFileSync(file,'utf8')),false,'Deployment address in '+file);
const html=fs.readFileSync('dist/index.html','utf8');for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=match[1].split('?')[0];if(!/^(https?:|\/)/.test(ref))assert(fs.existsSync('dist/'+ref),'Missing asset '+ref);}
const ir=compile(template());for(const [a,b,q]of [[0,0,1],[0,1,1],[1,0,1],[1,1,0]])assert.equal(step(ir,[],[a,b]).outputs[0],q);assert.equal((encode(ir).length-2)/2,29);
const memory=compile(template('memory'));assert.deepEqual(step(memory,[0],[1]),{signals:[0,1,1,0],outputs:[0],nextState:[1]});
assert.equal(fs.readFileSync('docs/CNAME','utf8').trim(),'fillout.work');assert(fs.readFileSync('docs/index.html','utf8').includes('https://app.fillout.work/'));
for(const file of ['tests/manual-review.mjs','tests/locales.mjs']){const r=spawnSync(process.execPath,[file],{stdio:'inherit'});assert.equal(r.status,0,file);}
console.log(`Release checks passed: ${files.length} modules; supply, no deployment addresses, assets, NAND, state, redirect, review and locales.`);
