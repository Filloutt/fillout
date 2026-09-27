import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./dist/app.mjs',import.meta.url),'utf8');
const owner='0x'+'12'.repeat(20);
const boxes=Object.fromEntries(['#hold-openbook','#hold-fillout','#circuit-holdings'].map(k=>[k,{innerHTML:'',isConnected:true}]));
const configs={openbook:{partsAddress:'parts-a',circuitsAddress:'circuits-a',explorerUrl:'https://example.invalid'},fillout:{partsAddress:'parts-b',circuitsAddress:'circuits-b',explorerUrl:'https://example.invalid'}};
const requests=[];
async function call(address,data){requests.push({address,data});if(address.startsWith('parts-')){assert.ok(data.startsWith('0x00fdd58e'));return '0x02';}if(data==='0x61b8ce8c')return '0x01';if(data==='0x6352211e'+'0'.repeat(64))return '0x'+owner.slice(2).padStart(64,'0');throw Error('Unexpected circuit read: '+data);}
const context=vm.createContext({account:owner,app:{innerHTML:''},$:key=>boxes[key],intro:()=>'',t:s=>s,names:['Quote','Settle'],projectName:k=>k,projectConfigs:configs,config:configs.openbook,call,rpc:async(method,[request])=>{assert.equal(method,'eth_call');return call(request.to,request.data)},word:n=>BigInt(n).toString(16).padStart(64,'0')});
const lines=source.split('\n');
vm.runInContext(lines.find(x=>x.startsWith('async function loadCircuitHoldings()'))+'\n'+lines.find(x=>x.startsWith('function holdings()')),context);
vm.runInContext('holdings()',context);
for(let i=0;i<10;i++)await new Promise(setImmediate);
for(const project of ['openbook','fillout']){assert.match(boxes['#hold-'+project].innerHTML,/#0/);assert.match(boxes['#hold-'+project].innerHTML,/Quote/);}
await vm.runInContext('loadCircuitHoldings()',context);
assert.match(boxes['#circuit-holdings'].innerHTML,/ID 0/);
assert.equal(requests.filter(x=>x.data==='0x61b8ce8c').length,3);
console.log('PASS: both collection holdings and circuit reader load token 0 through nextId().');
