const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.env.HARDHAT_CONFIG=path.join(__dirname,'hardhat.config.cjs');
const deps=require('./dependencies.cjs'),E=deps('ethers'),hre=deps('hardhat');
async function main(){
 const provider=new E.BrowserProvider(hre.network.provider);provider.pollingInterval=10;
 const [creator,liquidity,team,buyer,other]=await Promise.all(Array.from({length:5},(_,i)=>provider.getSigner(i)));
 const addresses=await Promise.all([creator,liquidity,team,buyer,other].map(s=>s.getAddress()));let checks=0;
 const equal=(a,b,label)=>{assert.equal(a,b,label);checks++};const rejects=async(fn,label)=>{await assert.rejects(fn,label);checks++};
 const source='pragma solidity 0.8.27; interface Token{function transfer(address,uint256) external returns(bool);} contract Sink{} contract Factory{mapping(address=>mapping(address=>address)) public getPair;function add(address a,address b,address pair) external{getPair[a][b]=pair;getPair[b][a]=pair;}} contract Pair{address public token0;address public token1;address public factory;constructor(address a,address b,address f){token0=a;token1=b;factory=f;}function send(address t,address to,uint256 value) external{require(Token(t).transfer(to,value));}}';
 const compiled=JSON.parse(deps('solc').compile(JSON.stringify({language:'Solidity',sources:{'Test.sol':{content:source}},settings:{evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
 async function actor(name,args=[]){const a=compiled.contracts['Test.sol'][name],c=await new E.ContractFactory(a.abi,a.evm.bytecode.object,creator).deploy(...args);await c.waitForDeployment();return c;}
 async function send(tx){return(await tx).wait();}
 const sink=await actor('Sink'),factory=await actor('Factory'),fakeFactory=await actor('Factory');
 const artifact=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts/VRAM.json'))),token=await new E.ContractFactory(artifact.abi,artifact.evm.bytecode.object,creator).deploy(addresses[1],sink.target,addresses[0],addresses[2]);await token.waitForDeployment();
 equal(await token.totalSupply(),E.parseEther('1000000000'),'fixed supply');equal(await token.TRADING_FEE_BPS(),200n,'fixed fee');equal(await token.feeRecipient(),addresses[2],'team fee destination');
 const pair=await actor('Pair',[token.target,addresses[4],factory.target]),pair2=await actor('Pair',[addresses[3],token.target,factory.target]);
 await send(factory.add(token.target,addresses[4],pair.target));await send(factory.add(addresses[3],token.target,pair2.target));
 await rejects(()=>token.registerPool(pair.target),'must select a factory first');
 await rejects(()=>token.connect(buyer).bindDexFactory(factory.target),'creator-only factory setup');
 await rejects(()=>token.bindDexFactory(addresses[3]),'factory cannot be an EOA');
 await send(token.bindDexFactory(factory.target));await rejects(()=>token.bindDexFactory(fakeFactory.target),'factory is immutable after setup');
 // Initial liquidity funding before registration is untaxed.
 await send(token.connect(liquidity).transfer(pair.target,E.parseEther('10000')));equal(await token.balanceOf(pair.target),E.parseEther('10000'),'full initial liquidity transfer');equal(await token.balanceOf(addresses[2]),0n,'no fee before pool registration');
 await send(token.connect(buyer).registerPool(pair.target));await send(token.registerPool(pair2.target));
 equal(await token.tradingPools(pair.target),true,'actual pair registered permissionlessly');await rejects(()=>token.registerPool(addresses[3]),'wallet cannot be marked taxable');await rejects(()=>token.registerPool(pair.target),'no duplicate pool');
 const forged=await actor('Pair',[token.target,addresses[4],fakeFactory.target]);await rejects(()=>token.registerPool(forged.target),'wrong factory rejected');
 const absent=await actor('Pair',[token.target,addresses[3],factory.target]);await rejects(()=>token.registerPool(absent.target),'unrecognized pair rejected');
 const wrongAsset=await actor('Pair',[addresses[3],addresses[4],factory.target]);await rejects(()=>token.registerPool(wrongAsset.target),'non-VRAM pair rejected');
 await send(pair.send(token.target,addresses[3],E.parseEther('100')));equal(await token.balanceOf(addresses[3]),E.parseEther('98'),'buy receives 98 percent');equal(await token.balanceOf(addresses[2]),E.parseEther('2'),'buy fee 2 percent to team');
 let fees=await token.balanceOf(addresses[2]);await send(token.connect(buyer).transfer(pair.target,E.parseEther('50')));equal(await token.balanceOf(addresses[2])-fees,E.parseEther('1'),'sell fee 2 percent');equal(await token.balanceOf(addresses[3]),E.parseEther('48'),'gross amount debited on sell');
 fees=await token.balanceOf(addresses[2]);await send(token.connect(buyer).transfer(addresses[4],E.parseEther('10')));equal(await token.balanceOf(addresses[4]),E.parseEther('10'),'wallet transfer is untaxed');equal(await token.balanceOf(addresses[2]),fees,'wallet transfer pays no fee');
 await send(token.connect(buyer).approve(addresses[4],E.parseEther('10')));await send(token.connect(other).transferFrom(addresses[3],pair.target,E.parseEther('10')));equal(await token.allowance(addresses[3],addresses[4]),0n,'allowance consumes gross amount');equal(await token.balanceOf(addresses[2])-fees,E.parseEther('0.2'),'router-style transferFrom fee');
 await rejects(()=>token.connect(other).transferFrom(addresses[3],pair.target,1),'no allowance bypass');
 fees=await token.balanceOf(addresses[2]);await send(pair.send(token.target,pair2.target,E.parseEther('100')));equal(await token.balanceOf(pair2.target),E.parseEther('98'),'pool-to-pool transfer charges once');equal(await token.balanceOf(addresses[2])-fees,E.parseEther('2'),'no double tax for two pools');
 fees=await token.balanceOf(addresses[2]);await send(token.connect(liquidity).transfer(pair.target,49));equal(await token.balanceOf(addresses[2]),fees,'sub-50-wei rounding');
 const supply=await token.totalSupply();await rejects(()=>token.connect(buyer).transfer(pair.target,E.parseEther('1000000')),'insufficient balance reverts atomically');equal(await token.balanceOf(addresses[2]),fees,'failed transfer pays no fee');equal(await token.totalSupply(),supply,'fees never increase supply');
 const methods=artifact.abi.filter(x=>x.type==='function').map(x=>x.name);equal(methods.includes('setFee'),false,'no rate change method');equal(methods.includes('mint'),false,'no public mint method');
 const report={checks,passed:true,network:'local Hardhat only',productionTransactionsSent:0,feeBps:200,feeAsset:'VRAM',normalWalletTransfersTaxed:false,limitations:['Tax applies to registered pool transfers, including later liquidity additions/removals.','Pool selection and fee-on-transfer-compatible routing still require actual DEX setup.']};
 fs.writeFileSync(path.join(__dirname,'vram-fee-test-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await provider.destroy();
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
