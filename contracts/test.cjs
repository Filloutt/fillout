const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const deps=require('./dependencies.cjs');
process.env.HARDHAT_CONFIG=path.join(__dirname,'hardhat.config.cjs');
const hre=deps('hardhat'),E=deps('ethers');
const coder=E.AbiCoder.defaultAbiCoder();let checks=0;
function equal(a,b,label){assert.equal(a,b,label);checks++;}
async function rejects(f,label){await assert.rejects(f,label);checks++;}
async function main(){
 const provider=new E.BrowserProvider(hre.network.provider);provider.pollingInterval=10;
 const signers=await Promise.all(Array.from({length:8},(_,i)=>provider.getSigner(i)));
 const[owner,alice,bob,team,liquidity,platform,fee]=signers;
 const addr=await Promise.all(signers.map(s=>s.getAddress()));
 const verifier=E.Wallet.createRandom(),priceSigner=E.Wallet.createRandom();
 async function deploy(name,args){const a=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts',name+'.json')));const c=await new E.ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(...args);await c.waitForDeployment();return c;}
 const actorSource='pragma solidity 0.8.27; contract CallbackProbe {address target; bytes payload; bool public blocked; function execute(address t,bytes calldata p) external {target=t;payload=p;(bool ok,)=t.call(p);require(ok,"outer call");} function onERC1155Received(address,address,uint256,uint256,bytes calldata) external returns(bytes4){(bool ok,bytes memory result)=target.call(payload);blocked=!ok && result.length>=4 && bytes4(result)==bytes4(keccak256("ReentrancyGuardReentrantCall()"));return 0xf23a6e61;}} contract RejectETH {receive() external payable{revert("reject ETH");}}';
 const actorOutput=JSON.parse(deps('solc').compile(JSON.stringify({language:'Solidity',sources:{'Probe.sol':{content:actorSource}},settings:{evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
 async function actor(name){const a=actorOutput.contracts['Probe.sol'][name];const c=await new E.ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy();await c.waitForDeployment();return c;}
 async function send(tx){return(await tx).wait();}
 async function now(){return Number((await hre.network.provider.send('eth_getBlockByNumber',['latest',false])).timestamp);}
 async function time(t){await hre.network.provider.send('evm_setNextBlockTimestamp',[t]);await hre.network.provider.send('evm_mine');}
 const gate=await deploy('AgentGate',[verifier.address]);
 const parts=await deploy('FillOutParts',[gate.target,addr[0],addr[3],addr[4],addr[5],priceSigner.address,'ipfs://parts/{id}.json']);
 const circuits=await deploy('FillOutCircuits',[parts.target,'ipfs://circuits/']);
 const token=await deploy('VRAM',[addr[4],circuits.target]);
 const market=await deploy('FillOutMarket',[parts.target,circuits.target,addr[3]]);
 const agentTypes={AgentPermit:[{name:'consumer',type:'address'},{name:'account',type:'address'},{name:'agentId',type:'bytes32'},{name:'action',type:'bytes32'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]};
 const agentDomain={name:'FillOut Agent Gate',version:'1',chainId:31337,verifyingContract:gate.target};
 const priceDomain={name:'FillOut ETH Price',version:'1',chainId:31337,verifyingContract:parts.target};
 const priceTypes={Price:[{name:'account',type:'address'},{name:'quote',type:'uint256'},{name:'settle',type:'uint256'},{name:'unitWei',type:'uint256'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]};
 let nonce=0;
 const id=s=>E.id(s);
 async function permit(consumer,account,action,identity='alice.ai',overrides={}){
   const v={consumer,account,agentId:id(identity),action,nonce:++nonce,deadline:await now()+250,...overrides};
   return{agentId:v.agentId,nonce:v.nonce,deadline:v.deadline,signature:await verifier.signTypedData(agentDomain,agentTypes,v)};
 }
 async function buy(signer,q,s,overrides={},target=parts){
   const account=await signer.getAddress();const v={account,quote:q,settle:s,unitWei:10000n,nonce:++nonce,deadline:await now()+250};
   const domain={...priceDomain,verifyingContract:target.target};
   const price={unitWei:v.unitWei,nonce:v.nonce,deadline:v.deadline,signature:await priceSigner.signTypedData(domain,priceTypes,v)};
   const digest=E.TypedDataEncoder.hash(domain,priceTypes,v);
   const p=await permit(target.target,account,E.keccak256(coder.encode(['string','uint256','uint256','bytes32'],['BUY',q,s,digest])));
   return target.connect(signer).buy(q,s,p,price,{value:BigInt(q+s)*v.unitWei,...overrides});
 }
 async function assemble(signer,tier){const account=await signer.getAddress();return circuits.connect(signer).assemble(tier,await permit(circuits.target,account,E.keccak256(coder.encode(['string','uint8'],['ASSEMBLE',tier])),account));}
 equal(await token.totalSupply(),E.parseEther('1000000000'),'fixed VRAM supply');
 equal(await token.balanceOf(addr[4]),E.parseEther('200000000'),'liquidity reserve');
 equal(await token.balanceOf(circuits.target),E.parseEther('800000000'),'mining funded');
 equal(await parts.balanceOf(addr[3],0),1000n,'team Quote');equal(await parts.balanceOf(addr[3],1),250n,'team Settle');
 await rejects(()=>parts.connect(alice).bindAssembler(circuits.target),'owner-only setup');
 await send(parts.bindAssembler(circuits.target));
 await rejects(()=>parts.start(now().then(x=>x+5)),'cannot open unfunded mining');
 await send(circuits.bindRewardToken(token.target));
 await rejects(()=>circuits.bindRewardToken(token.target),'one-time reward binding');
 await rejects(()=>parts.bindAssembler(market.target),'one-time assembler binding');
 const opening=await now()+10;await send(parts.start(opening));
 await rejects(()=>buy(alice,1,1),'no early mint');await time(opening);
 const free=await permit(parts.target,addr[1],id('FREE'));
 await rejects(()=>parts.connect(bob).claimFree(free),'wallet-bound permit');
 await send(parts.connect(alice).claimFree(free));
 equal(await parts.balanceOf(addr[1],0),4n,'free Quote');equal(await parts.balanceOf(addr[1],1),1n,'free Settle');
 await rejects(()=>parts.connect(alice).claimFree(free),'no repeat free claim');
 await rejects(async()=>parts.connect(bob).claimFree(await permit(parts.target,addr[2],id('FREE'))),'same ID cannot reclaim with another wallet');
 await rejects(async()=>parts.connect(alice).claimFree(await permit(parts.target,addr[1],id('FREE'),'new.ai')),'same wallet cannot reclaim with another ID');
 const probe=await actor('CallbackProbe');
 const probePermit=await permit(parts.target,probe.target,id('FREE'),'probe.ai');
 await send(probe.execute(parts.target,parts.interface.encodeFunctionData('claimFree',[probePermit])));
 equal(await probe.blocked(),true,'ERC1155 callback reentrancy blocked');
 equal(await parts.balanceOf(probe.target,0),4n,'callback cannot duplicate free parts');
 const beforeLP=BigInt(await hre.network.provider.send('eth_getBalance',[addr[4],'latest']));
 const beforePlatform=BigInt(await hre.network.provider.send('eth_getBalance',[addr[5],'latest']));
 await send(buy(alice,4,1));
 equal(BigInt(await hre.network.provider.send('eth_getBalance',[addr[4],'latest']))-beforeLP,40000n,'80 percent direct ETH');
 equal(BigInt(await hre.network.provider.send('eth_getBalance',[addr[5],'latest']))-beforePlatform,10000n,'20 percent direct ETH');
 await rejects(()=>buy(alice,1,0,{value:9999n}),'underpayment');
 await rejects(()=>buy(alice,1,0,{value:10001n}),'overpayment');
 await rejects(()=>buy(alice,79001,0),'quantity cap');
 await rejects(()=>buy(alice,79000,0),'aggregate supply cap');
 const invalidPermit={agentId:id('invalid'),nonce:123,deadline:await now()+200,signature:'0x'};
 await rejects(()=>parts.connect(alice).buy(1,0,invalidPermit,{unitWei:1,nonce:1,deadline:1,signature:'0x'},{value:1}),'expired price');
 await rejects(()=>parts.connect(alice).buy(1,0,invalidPermit,{unitWei:1,nonce:1,deadline:now().then(x=>x+1000),signature:'0x'},{value:1}),'excessively long price lifetime');
 await rejects(()=>parts.connect(alice).buy(1,0,invalidPermit,{unitWei:1,nonce:1,deadline:now().then(x=>x+200),signature:'0x'},{value:1}),'unsigned price');
 await rejects(async()=>parts.connect(bob).claimFree(await permit(parts.target,addr[2],id('FREE'),'bob.ai',{deadline:await now()+3600})),'overlong agent permit');
 await rejects(()=>assemble(alice,1),'no assembly during mint');
 await send(parts.connect(alice).safeTransferFrom(addr[1],addr[2],0,1,'0x'));
 equal(await parts.balanceOf(addr[2],0),1n,'free and paid parts transferable');
 async function list(signer,isNFT,tokenId,amount,price){const account=await signer.getAddress(),deadline=await now()+1000;const p=await permit(market.target,account,E.keccak256(coder.encode(['string','bool','uint256','uint256','uint256','uint256'],['LIST',isNFT,tokenId,amount,price,deadline])),account);await send(market.connect(signer).list(isNFT,tokenId,amount,price,deadline,p));return await market.nextListing();}
 async function fill(signer,listing,amount){const l=await market.listings(listing),account=await signer.getAddress();const p=await permit(market.target,account,E.keccak256(coder.encode(['string','uint256','uint256','uint256','address'],['FILL',listing,amount,l.unitWei,l.seller])),account);return market.connect(signer).buy(listing,amount,p,{value:BigInt(amount)*l.unitWei});}
 await send(parts.connect(bob).setApprovalForAll(market.target,true));
 let lid=await list(bob,false,0,1,10000);
 let teamBalance=BigInt(await hre.network.provider.send('eth_getBalance',[addr[3],'latest']));
 await send(fill(alice,lid,1));
 equal(BigInt(await hre.network.provider.send('eth_getBalance',[addr[3],'latest']))-teamBalance,100n,'1 percent market fee to team');
 equal(await parts.balanceOf(addr[1],0),8n,'Quote buyback');
 await send(parts.connect(alice).setApprovalForAll(market.target,true));
 lid=await list(alice,false,1,1,10000);await send(fill(bob,lid,1));
 equal(await parts.balanceOf(addr[2],1),1n,'Settle independently tradable');
 await send(parts.connect(bob).safeTransferFrom(addr[2],addr[1],1,1,'0x'));
 await rejects(()=>fill(bob,lid,1),'no double settlement');
 await send(buy(bob,Number(80000n-await parts.quoteIssued()),Number(20000n-await parts.settleIssued())));
 equal(await parts.quoteIssued(),80000n,'lifetime Quote cap');equal(await parts.settleIssued(),20000n,'lifetime Settle cap');
 equal(await parts.closed(),true,'sold out closes early');
 await rejects(()=>buy(alice,1,0),'no mint after sold out');
 await rejects(()=>assemble(alice,1),'burn requires explicit approval');
 equal(await parts.balanceOf(addr[1],0),8n,'failed assembly rolls back');
 await send(parts.connect(alice).setApprovalForAll(circuits.target,true));
 await send(assemble(alice,1));
 equal(await circuits.ownerOf(1),addr[1],'Rare minted');equal(await circuits.rarity(1),1n,'Rare tier');
 equal(await parts.balanceOf(addr[1],0),0n,'Quote burned');equal(await parts.balanceOf(addr[1],1),0n,'Settle burned');
 await send(parts.connect(team).setApprovalForAll(circuits.target,true));
 await rejects(()=>circuits.connect(bob).assembleTeamEpic(),'team reserve restricted');
 await send(circuits.connect(team).assembleTeamEpic());equal(await circuits.teamEpicIssued(),1n,'team reserve consumes cap');
 equal(await parts.balanceOf(addr[3],0),980n,'team parts burned');
 for(let i=1;i<50;i++)await send(circuits.connect(team).assembleTeamEpic());
 equal(await circuits.teamEpicIssued(),50n,'exactly 50 team Epic');equal(await parts.balanceOf(addr[3],0),0n,'all reserved Quote consumed');equal(await parts.balanceOf(addr[3],1),0n,'all reserved Settle consumed');
 await rejects(()=>circuits.connect(team).assembleTeamEpic(),'no 51st team Epic');
 await time(Number(await circuits.miningStartsAt())+3600);
 const pending=await circuits.pending(1);assert(pending>0n);checks++;
 await send(circuits.connect(alice).setApprovalForAll(market.target,true));
 lid=await list(alice,true,1,1,100000);await send(fill(bob,lid,1));
 equal(await circuits.ownerOf(1),addr[2],'Circuit NFT sold');
 const sellerCredit=await circuits.credit(addr[1]);assert(sellerCredit>=pending);checks++;
 await send(circuits.connect(alice).claim([]));equal(await token.balanceOf(addr[1]),sellerCredit,'past rewards stay with seller');
 await time(Number(await circuits.miningStartsAt())+7*86400);
 await send(circuits.connect(bob).claim([1]));assert(await token.balanceOf(addr[2])>0n);checks++;
 await rejects(()=>circuits.connect(bob).claim([1]),'no double claim');
 equal(await circuits.pending(1),0n,'settled rewards');
 const endIndex=await circuits.index(1);await time(await now()+86400);equal(await circuits.index(1),endIndex,'emissions end after seven days');
 await send(parts.connect(bob).setApprovalForAll(circuits.target,true));
 await send(assemble(bob,0));equal(await circuits.pending(await circuits.totalIssued()),0n,'late assembly has no retroactive rewards');
 equal(await parts.quoteIssued(),80000n,'burn never reopens supply');
 // Expired, wrong consumer, wrong chain, replay and tampered action permits.
 const action=id('PROBE');const expiry=await now()+100;
 const v={consumer:addr[1],account:addr[1],agentId:id('probe.ai'),action,nonce:++nonce,deadline:expiry};
 const sig=await verifier.signTypedData(agentDomain,agentTypes,v);
 await rejects(()=>gate.connect(bob).consume(addr[1],v.agentId,action,v.nonce,expiry,sig),'consumer bound');
 await rejects(()=>gate.connect(alice).consume(addr[1],v.agentId,id('OTHER'),v.nonce,expiry,sig),'action bound');
 const wrongChain=await verifier.signTypedData({...agentDomain,chainId:4663},agentTypes,v);
 await rejects(()=>gate.connect(alice).consume(addr[1],v.agentId,action,v.nonce,expiry,wrongChain),'chain bound');
 await send(gate.connect(alice).consume(addr[1],v.agentId,action,v.nonce,expiry,sig));
 await rejects(()=>gate.connect(alice).consume(addr[1],v.agentId,action,v.nonce,expiry,sig),'permit replay');
 await time(expiry+1);await rejects(()=>gate.connect(alice).consume(addr[1],v.agentId,action,v.nonce,expiry,sig),'expired');
 // A fresh deployment verifies the deadline path independently of sold-out.
 const rejectETH=await actor('RejectETH');
 const p2=await deploy('FillOutParts',[gate.target,addr[0],addr[3],rejectETH.target,addr[5],priceSigner.address,'']);
 const c2=await deploy('FillOutCircuits',[p2.target,'']);const t2=await deploy('VRAM',[addr[4],c2.target]);
 await send(p2.bindAssembler(c2.target));await send(c2.bindRewardToken(t2.target));
 const start2=await now()+5;await send(p2.start(start2));await time(start2);
 await rejects(()=>buy(alice,1,1,{},p2),'failed ETH payout reverts mint');equal(await p2.quoteIssued(),1000n,'payout failure rolls back supply');equal(await p2.balanceOf(addr[1],0),0n,'payout failure rolls back balance');
 await time(start2+604799);equal(await p2.closed(),false,'open before deadline');
 await time(start2+604800);equal(await p2.closed(),true,'closed exactly at 168 hours');
 equal(await p2.soldOutAt(),0n,'deadline without soldout');
 const decodeURI=u=>JSON.parse(Buffer.from(u.split(',')[1],'base64').toString());
 equal(decodeURI(await p2.uri(0)).name,'FillOut Quote','onchain Quote metadata');equal(decodeURI(await p2.uri(1)).name,'FillOut Settle','onchain Settle metadata');
 await rejects(()=>p2.uri(2),'no metadata for nonexistent part class');await rejects(()=>c2.tokenURI(1),'no metadata for nonexistent NFT');
 await send(p2.connect(team).setApprovalForAll(c2.target,true));await send(c2.connect(team).assembleTeamEpic());
 const meta=decodeURI(await c2.tokenURI(1));equal(meta.name,'FillOut Epic #1','onchain Epic metadata');assert(Buffer.from(meta.image.split(',')[1],'base64').toString().includes('<svg'));checks++;
 const report={time:new Date().toISOString(),checks,chainId:31337,network:'local hardhat only',deployedToProduction:false,contracts:['AgentGate','FillOutParts','FillOutCircuits','VRAM','FillOutMarket']};
 fs.writeFileSync(path.join(__dirname,'test-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
