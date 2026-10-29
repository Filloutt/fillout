const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.env.HARDHAT_CONFIG=path.join(__dirname,'hardhat-service.config.cjs');
const deps=require('./dependencies.cjs'),E=deps('ethers'),hre=deps('hardhat');
async function main(){
 const {DatabaseSync}=require('node:sqlite');
 const {createAgentService}=await import('../server/agent-service.mjs');
 const {protocol,tiers}=await import('../dist/agent-protocol.mjs');
 const provider=new E.BrowserProvider(hre.network.provider);provider.pollingInterval=10;
 const [creator,alice,bob,team,lp,platform]=await Promise.all(Array.from({length:6},(_,i)=>provider.getSigner(i)));
 const addresses=await Promise.all([creator,alice,bob,team,lp,platform].map(s=>s.getAddress()));
 async function deploy(name,args){const artifact=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts',name+'.json')));const c=await new E.ContractFactory(artifact.abi,artifact.evm.bytecode.object,creator).deploy(...args);await c.waitForDeployment();return c;}
 async function send(tx){return(await tx).wait();}
 const gate=await deploy('AgentGate',[addresses[0]]),parts=await deploy('FillOutParts',[gate.target,addresses[0],addresses[3],addresses[4],addresses[5],addresses[0],'']);
 const circuits=await deploy('FillOutCircuits',[parts.target,'']),token=await deploy('VRAM',[addresses[4],circuits.target]),market=await deploy('FillOutMarket',[parts.target,circuits.target,addresses[3]]);
 await send(parts.bindAssembler(circuits.target));await send(circuits.bindRewardToken(token.target));
 const latest=async()=>Number((await hre.network.provider.send('eth_getBlockByNumber',['latest',false])).timestamp);
 let timestamp=await latest()+3;await send(parts.start(timestamp));await hre.network.provider.send('evm_setNextBlockTimestamp',[timestamp]);await hre.network.provider.send('evm_mine');
 const ca={AgentGate:gate.target,FillOutParts:parts.target,FillOutCircuits:circuits.target,VRAM:token.target,FillOutMarket:market.target};
 const hashes={};for(const[name,address]of Object.entries(ca))hashes[name]=E.keccak256(await provider.getCode(address));
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(__dirname,'../drizzle/0003_agent_authorizations.sql'),'utf8'));
 function stmt(sql,args=[]){return{bind(...a){return stmt(sql,a)},async first(){return db.prepare(sql).get(...args)||null},async run(){return{meta:{changes:Number(db.prepare(sql).run(...args).changes)}}}};}
 const DB={prepare:sql=>stmt(sql)},registry=new E.Interface(['function ownerOf(uint256) view returns(address)']);
 const registryCode=fs.readFileSync(path.join(__dirname,'../tests/registry-runtime.hex'),'utf8').trim();
 const api=createAgentService({protocol:{...protocol,tiers,recipients:{...protocol.recipients,creator:addresses[0]},team:{...protocol.team,recipient:addresses[3]}},deployed:{addresses:ca,runtimeCodeHashes:hashes},now:()=>timestamp*1000,signer:{address:addresses[0],signTypedData:(...args)=>creator.signTypedData(...args)},quote:async()=>({price:'3000',source:'fixture',observedAt:timestamp*1000}),rpc:async(chain,method,params)=>{
  if(chain===4663)return hre.network.provider.send(method,params);
  if(method==='eth_chainId')return'0x38';if(method==='eth_getCode')return registryCode;
  if(method==='eth_call'){const call=registry.parseTransaction({data:params[0].data}),id=E.toBeHex(call.args[0],32);return registry.encodeFunctionResult('ownerOf',[id===E.id('alice')?addresses[1]:addresses[2]]);}throw Error('Unexpected fixture call');
 }});
 const env={DB,FILLOUT_AGENT_SERVICE_ENABLED:'true'};let checks=0;
 async function endpoint(path,body){const r=await api(new Request('https://app.fillout.work/api/agent/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),env);const value=await r.json();assert.equal(r.status,200,JSON.stringify(value));checks++;return value;}
 async function auth(signer,name,intent){timestamp=await latest();const wallet=await signer.getAddress(),c=await endpoint('challenge',{wallet,agentId:name+'.ai',intent});const signature=await signer.signTypedData(c.typedData.domain,c.typedData.types,c.typedData.message);return endpoint('authorize',{challenge:c.challenge,signature});}
 async function execute(signer,authorization){if(authorization.approval)await send(signer.sendTransaction({to:authorization.approval.to,data:authorization.approval.inputData,value:0}));await send(signer.sendTransaction({to:authorization.transaction.to,data:authorization.transaction.inputData,value:BigInt(authorization.transaction.value)}));checks++;}
 let a=await auth(alice,'alice',{action:'free'});await execute(alice,a);assert.equal(await parts.balanceOf(addresses[1],0),4n);checks++;
 a=await auth(alice,'alice',{action:'paid',quote:5,settle:2});await execute(alice,a);assert.equal(await parts.balanceOf(addresses[1],1),3n);checks++;
 a=await auth(alice,'alice',{action:'list',asset:'quote',amount:1,unitWei:10000,listingDeadline:(await latest())+500});await execute(alice,a);
 a=await auth(bob,'bobby',{action:'fill',listingId:1,amount:1});await execute(bob,a);assert.equal(await parts.balanceOf(addresses[2],0),1n);checks++;
 timestamp=Number(await parts.closesAt());await hre.network.provider.send('evm_setNextBlockTimestamp',[timestamp]);await hre.network.provider.send('evm_mine');
 a=await auth(alice,'alice',{action:'assemble',tier:'rare'});await execute(alice,a);assert.equal(await circuits.ownerOf(1),addresses[1]);assert.equal(await parts.balanceOf(addresses[1],0),0n);checks+=2;
 a=await auth(alice,'alice',{action:'list',asset:'circuit',tokenId:1,amount:1,unitWei:10000,listingDeadline:(await latest())+500});await execute(alice,a);
 a=await auth(bob,'bobby',{action:'fill',listingId:2,amount:1});await execute(bob,a);assert.equal(await circuits.ownerOf(1),addresses[2]);checks++;
 const report={checks,passed:true,environment:'in-process Hardhat simulation with chainId 4663; not mainnet',identitySource:'captured registry code, mocked registry ownership',priceSource:'fixture',productionTransactionsSent:0,flows:['free component mint','paid independent Quote/Settle','Quote listing and ETH purchase','atomic Rare burn/assembly','Circuit NFT listing and ETH purchase']};
 fs.writeFileSync(path.join(__dirname,'service-onchain-test-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await provider.destroy();
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
