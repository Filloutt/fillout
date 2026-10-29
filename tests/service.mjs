import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import * as E from '../server/vendor/ethers.mjs';
import {createAgentService,canonicalIdentity,normalizeIntent,unitWeiFromUsd,identityRegistry} from '../server/agent-service.mjs';
import {protocol,tiers} from '../dist/agent-protocol.mjs';
import {deployedContracts} from '../server/deployed-contracts.mjs';
let checks=0;function equal(a,b,label){assert.equal(a,b,label);checks++;}function throws(f){assert.throws(f);checks++;}
const signing=E.Wallet.createRandom(),wallet=E.Wallet.createRandom(),other=E.Wallet.createRandom();
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0003_agent_authorizations.sql','utf8'));
function statement(sql,args=[]){return{bind(...a){return statement(sql,a)},async first(){return db.prepare(sql).get(...args)||null},async run(){return{meta:{changes:Number(db.prepare(sql).run(...args).changes)}}}};}
const DB={prepare:q=>statement(q)};let time=Date.now(),mode='open',owner=wallet.address,changedCode=false,stalePrice=false,badChain=false;
const fixtureCode='0x60006000',fixtureHash=E.keccak256(fixtureCode),fixtureRegistry=identityRegistry.codeHash;
const deployed={...deployedContracts,runtimeCodeHashes:Object.fromEntries(Object.keys(deployedContracts.runtimeCodeHashes).map(k=>[k,fixtureHash]))};
const p={...protocol,tiers,recipients:{...protocol.recipients,creator:signing.address}};
const ABIS=JSON.parse(fs.readFileSync('dist/contract-abis.json','utf8'));
const interfaces=Object.fromEntries(Object.entries(ABIS).map(([k,v])=>[k,new E.Interface(v)]));
const registry=new E.Interface(['function ownerOf(uint256) view returns(address)','function tokenURI(uint256) view returns(string)']);
async function rpc(chain,method,params){
 if(method==='eth_chainId')return E.toQuantity(badChain?1:chain);
 if(method==='eth_getCode')return changedCode?'0x00':chain===56?options.registryCode:fixtureCode;
 if(method!=='eth_call')throw Error('Unexpected RPC '+method);
 const target=params[0].to,isRegistry=target.toLowerCase()===identityRegistry.address.toLowerCase();
 const name=isRegistry?'registry':Object.entries(deployed.addresses).find(([,v])=>v.toLowerCase()===target.toLowerCase())?.[0];
 const iface=isRegistry?registry:interfaces[name],tx=iface.parseTransaction({data:params[0].data});let output;
 switch(tx.name){
 case 'ownerOf':output=[isRegistry?owner:wallet.address];break;
 case 'openedAt':output=[mode==='unscheduled'?0:Math.floor(time/1000)-1000];break;
 case 'closesAt':output=[mode==='closed'?Math.floor(time/1000)-100:Math.floor(time/1000)+1000];break;
 case 'quoteIssued':output=[1000];break;case 'settleIssued':output=[250];break;case 'freeClaims':output=[0];break;
 case 'claimedAgent':case 'claimedWallet':output=[false];break;
 case 'balanceOf':output=[name==='VRAM'?E.parseEther('100'):30];break;
 case 'issued':case 'teamEpicIssued':case 'teamRareIssued':case 'totalIssued':output=[0];break;
 case 'isApprovedForAll':output=[false];break;
 case 'nextListing':output=[1];break;
 case 'listings':output=[other.address,false,0,10,100000,Math.floor(time/1000)+1000];break;
 case 'credit':output=[123];break;
 default:throw Error('Unhandled fixture '+tx.name);
 }
 return iface.encodeFunctionResult(tx.name,output);
}
// Tests inject a registry code fixture; the production factory keeps its fixed real code hash.
const registryCode=fs.readFileSync('tests/registry-runtime.hex','utf8').trim();
const options={protocol:p,deployed,signer:signing,rpc,registryCode,now:()=>time,quote:async()=>({price:'3000.00',source:'fixture',observedAt:time-(stalePrice?120000:0)})};
equal(E.keccak256(registryCode),fixtureRegistry,'captured registry runtime matches the pinned live code');
const api=createAgentService(options),env={DB,FILLOUT_AGENT_SERVICE_ENABLED:'true'};
async function request(path,body,customEnv=env){const r=await api(new Request('https://app.fillout.work/api/agent/'+path,{method:body?'POST':'GET',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}),customEnv);return{status:r.status,body:await r.json()};}
async function challenge(intent={action:'free'}){return request('challenge',{wallet:wallet.address,agentId:'alice.ai',intent});}
async function authorize(c,who=wallet){const sig=await who.signTypedData(c.body.typedData.domain,c.body.typedData.types,c.body.typedData.message);return request('authorize',{challenge:c.body.challenge,signature:sig});}
equal(canonicalIdentity('alice.ai').tokenId,E.id('alice'),'ID uses handle, not suffix');throws(()=>canonicalIdentity('Alice.ai'));throws(()=>canonicalIdentity('xx.ai'));throws(()=>canonicalIdentity('alice.eth'));
equal(unitWeiFromUsd('3000'),100000000000000n,'30 cents in native ETH');throws(()=>unitWeiFromUsd('0'));throws(()=>unitWeiFromUsd('NaN'));throws(()=>unitWeiFromUsd('3000.000000001'));
throws(()=>normalizeIntent({action:'paid',quote:1.5}));throws(()=>normalizeIntent({action:'paid',quote:79001}));throws(()=>normalizeIntent({action:'paid',quote:0}));throws(()=>normalizeIntent({action:'list',asset:'usdt',amount:1,unitWei:1,listingDeadline:123}));throws(()=>normalizeIntent({action:'fill',amount:1,listingId:'1e4'}));
equal((await request('challenge',{wallet:wallet.address,agentId:'alice.ai',intent:{action:'free'}},{})).status,503,'no DB means no authorization');
let c=await challenge();equal(c.status,200,'challenge issued');let a=await authorize(c);equal(a.status,200,'wallet ownership checked');equal(a.body.transaction.to,deployed.addresses.FillOutParts,'free target');equal(a.body.transaction.value,'0','free ETH value');equal(a.body.transactionsSent,0,'no broadcast');equal(interfaces.FillOutParts.parseTransaction({data:a.body.transaction.inputData}).name,'claimFree','real ABI');
equal((await authorize(c)).status,409,'challenge replay blocked');
c=await challenge();equal((await authorize(c,other)).status,403,'wrong wallet signature');
owner=other.address;equal((await challenge()).status,403,'claimed name alone cannot qualify');owner=wallet.address;
c=await challenge();time+=181000;equal((await authorize(c)).status,409,'expired challenge');
db.exec('DELETE FROM agent_challenges');
c=await challenge({action:'paid',quote:4,settle:1});a=await authorize(c);equal(a.status,200,'paid ticket');equal(a.body.transaction.value,'500000000000000','only native ETH payment');equal(a.body.price.unitWei,'100000000000000','exact signed unit');const buy=interfaces.FillOutParts.parseTransaction({data:a.body.transaction.inputData});equal(buy.name,'buy','paid ABI');equal(buy.args[0],4n,'Quote independent quantity');equal(buy.args[1],1n,'Settle independent quantity');
const types={AgentPermit:[{name:'consumer',type:'address'},{name:'account',type:'address'},{name:'agentId',type:'bytes32'},{name:'action',type:'bytes32'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]};
const priceTypes={Price:[{name:'account',type:'address'},{name:'quote',type:'uint256'},{name:'settle',type:'uint256'},{name:'unitWei',type:'uint256'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]};
const pd={name:'FillOut ETH Price',version:'1',chainId:4663,verifyingContract:deployed.addresses.FillOutParts};
const pv={account:wallet.address,quote:4,settle:1,unitWei:a.body.price.unitWei,nonce:a.body.price.nonce,deadline:a.body.price.deadline};
equal(E.verifyTypedData(pd,priceTypes,pv,a.body.price.signature),signing.address,'price signer verified');
const digest=E.TypedDataEncoder.hash(pd,priceTypes,pv),action=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['string','uint256','uint256','bytes32'],['BUY',4,1,digest]));
equal(E.verifyTypedData({name:'FillOut Agent Gate',version:'1',chainId:4663,verifyingContract:deployed.addresses.AgentGate},types,{consumer:deployed.addresses.FillOutParts,account:wallet.address,agentId:E.id('alice'),action,nonce:a.body.permit.nonce,deadline:a.body.permit.deadline},a.body.permit.signature),signing.address,'permit binds the signed ETH quote digest');
stalePrice=true;c=await challenge({action:'paid',quote:1});equal((await authorize(c)).status,503,'stale prices never signed');stalePrice=false;
mode='unscheduled';c=await challenge();equal((await authorize(c)).status,409,'mint not scheduled');mode='open';c=await challenge({action:'assemble',tier:'rare'});equal((await authorize(c)).status,409,'no assembly during mint');
mode='closed';c=await challenge({action:'assemble',tier:'rare'});a=await authorize(c);equal(a.status,200,'assembly after close');equal(a.body.approval.to,deployed.addresses.FillOutParts,'explicit burn approval exposed');equal(interfaces.FillOutCircuits.parseTransaction({data:a.body.transaction.inputData}).name,'assemble','assembly ABI');
db.exec('DELETE FROM agent_challenges');
c=await challenge({action:'list',asset:'settle',amount:3,unitWei:10000,listingDeadline:Math.floor(time/1000)+500});a=await authorize(c);equal(a.status,200,'Settle listing');const listing=interfaces.FillOutMarket.parseTransaction({data:a.body.transaction.inputData});equal(listing.args[1],1n,'Settle token ID');equal(listing.args[2],3n,'partial quantity');
c=await challenge({action:'list',asset:'circuit',tokenId:1,amount:1,unitWei:10000,listingDeadline:Math.floor(time/1000)+500});a=await authorize(c);equal(a.status,200,'Circuit NFT listing');equal(interfaces.FillOutMarket.parseTransaction({data:a.body.transaction.inputData}).args[0],true,'Circuit asset category');
c=await challenge({action:'fill',listingId:1,amount:2});a=await authorize(c);equal(a.status,200,'market fill');equal(a.body.transaction.value,'200000','market exact native ETH');
const inventory=await request('inventory?wallet='+wallet.address);equal(inventory.status,200,'real inventory RPC adapter');equal(inventory.body.Quote,'30','Quote read');equal(inventory.body.settledMiningCredit,'123','credit read');
const market=await request('market?asset=quote');equal(market.body.listings.length,1,'Quote listing discovery');equal((await request('market?asset=settle')).body.listings.length,0,'asset categories separate');
changedCode=true;equal((await challenge()).status,503,'changed code fails closed');changedCode=false;badChain=true;equal((await challenge()).status,503,'wrong network fails closed');badChain=false;
const noKey=createAgentService({...options,signer:null});const nr=await noKey(new Request('https://app.fillout.work/api/agent/authorize',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env);equal(nr.status,503,'no signer configuration never opens authorization');
fs.writeFileSync('agent-service-test-report.json',JSON.stringify({checks,passed:true,signatures:'ephemeral test identities only',productionSignerConfigured:false,transactionsSent:0},null,2)+'\n');console.log('Agent service: '+checks+' checks passed; no production signature or transaction sent.');
