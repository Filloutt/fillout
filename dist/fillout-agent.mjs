#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const base='https://app.fillout.work';
export function prepareIntent(args,protocol,status){
 const get=(flag,fallback)=>{const i=args.indexOf(flag);if(i<0)return fallback;const value=args[i+1];if(!value||value.startsWith('--'))throw Error('Missing '+flag);return value;};
 const action=get('--action','free'),result={protocol:'FillOut Agent Genesis',chainId:4663,action,componentMintOnly:action!=='assemble'};
 if(protocol.network?.chainId!==4663)throw Error('Unexpected chain');
 if(action==='free')Object.assign(result,{quote:4,settle:1,componentClass:'standard',oncePerAgentId:true,freeClaimCap:4998,transferable:true});
 else if(action==='paid'){const quote=Number(get('--quote','0')),settle=Number(get('--settle','0'));if(!Number.isSafeInteger(quote)||!Number.isSafeInteger(settle)||quote<0||settle<0||quote>(protocol.publicParts?.Quote??80000)||settle>(protocol.publicParts?.Settle??20000)||quote+settle===0)throw Error('Invalid component quantities');Object.assign(result,{quote,settle,componentClass:'standard'});}
 else if(action==='assemble'){const tier=get('--tier','common'),recipe=protocol.tiers?.find(t=>t.id===tier);if(!recipe)throw Error('Invalid rarity');Object.assign(result,{tier,quote:recipe.quote,settle:recipe.settle,componentClass:'standard',requiresComponentMintClosed:true,burnRequired:true,acceptsFreeAndPurchasedParts:true});}
 else throw Error('Unknown action');
 result.contracts=protocol.launch?.productionContracts||null;
 const phaseReady=action==='assemble'?status.state?.mintClosed===true:status.state?.mintOpen===true;
 result.execution=status.signingServiceReady===true&&phaseReady&&result.contracts?'requires-identity-proof':'blocked';
 result.reason=result.execution==='blocked'?'The signing service or this operation’s contract phase is not ready. Do not send a transaction.':'Request a wallet-bound ownership challenge, preview its EIP-712 proof through official baw tooling, then submit the signed proof to authorize. This helper never signs or broadcasts.';
 if(result.execution!=='blocked')result.nextCommand='node fillout-agent.mjs challenge --action '+action+(action==='paid'?' --quote '+result.quote+' --settle '+result.settle:action==='assemble'?' --tier '+result.tier:'');
 return result;
}
export async function bawRead(command){
 const allowed={status:['wallet','status','--json'],chains:['wallet','chains','--json'],address:['wallet','address','--json'],identity:['wallet','agent-id','--json']};const args=allowed[command];if(!args)throw Error('Unsupported wallet read');
 let output;try{const win=process.platform==='win32';output=await promisify(execFile)(win?'powershell.exe':'baw',win?['-NoProfile','-NonInteractive','-Command','& baw '+args.join(' ')]:args,{timeout:20000,maxBuffer:1048576,windowsHide:true});}catch(e){if(e.code==='ENOENT')throw Error('Binance Agentic Wallet CLI unavailable. Install the official baw CLI.');throw Error('Wallet read failed: '+command+'. Check the official baw CLI and authenticated wallet session.');}
 let result;try{result=JSON.parse(output.stdout);}catch{throw Error('Wallet returned invalid JSON: '+command);}if(result.success!==true)throw Error('Wallet service rejected read: '+command);return result.data;
}
export async function inspectAgentWallet(read=bawRead){
 const state=await read('status');if(state?.status!=='CONNECTED')throw Error('Wallet not connected. Sign in with the official Binance Agentic Wallet flow.');
 const chains=await read('chains');if(!Array.isArray(chains)||!chains.some(c=>String(c.binanceChainId)==='4663'))throw Error('This wallet does not currently support Robinhood Chain 4663.');
 const data=await read('address'),entries=Array.isArray(data)?data:data?.addresses;const recipient=entries?.find(a=>String(a.binanceChainId)==='4663')?.address;if(!/^0x[0-9a-fA-F]{40}$/.test(recipient||''))throw Error('No valid Robinhood recipient address was returned.');
 const identity=await read('identity');if(identity?.claimed!==true||typeof identity.agentId!=='string'||!/^[a-z0-9][a-z0-9.-]{0,250}\.ai$/i.test(identity.agentId))throw Error('No claimed Agent ID was returned. An unavailable service must not be treated as an unclaimed ID.');
 return {chainId:4663,recipient,agentId:identity.agentId,localPrecheckPassed:true,authorizationGranted:false,transactionsSent:0,note:'Local authenticated wallet pre-check only. Server-verifiable identity proof and contract authorization are still required.'};
}
export async function main(args){
 const get=(flag,fallback)=>{const i=args.indexOf(flag);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing '+flag);return args[i+1];};
 const command=args[0]||'status';if(command==='wallet-check'){console.log(JSON.stringify(await inspectAgentWallet(),null,2));return;}if(!['status','prepare','market','inventory','challenge','authorize'].includes(command))throw Error('Use: status | wallet-check | market | inventory | prepare | challenge | authorize');
 const root=new URL(get('--base-url',base));if(root.username||root.password||(root.protocol!=='https:'&&!(root.protocol==='http:'&&['127.0.0.1','localhost'].includes(root.hostname))))throw Error('HTTPS or localhost base URL required');
 const read=async(path,body)=>{const response=await fetch(new URL(path,root),{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000),redirect:'error'});const data=await response.json();if(!response.ok)throw Error(data.error||'Protocol unavailable: HTTP '+response.status);return data;};
 if(command==='authorize'){const challenge=get('--challenge'),signature=get('--signature');if(!challenge||!signature)throw Error('Provide --challenge and the EIP-712 ownership --signature');const authorization=await read('/api/agent/authorize',{challenge,signature});console.log(JSON.stringify({...authorization,next:'Preview each approval and contract transaction with official baw tooling. Show risks and wait for explicit user confirmation before execute.'},null,2));return;}
 if(command==='challenge'){
  const checked=await inspectAgentWallet();const action=get('--action','free');let intent={action};
  if(action==='paid')Object.assign(intent,{quote:get('--quote','0'),settle:get('--settle','0')});
  if(action==='assemble')intent.tier=get('--tier','common');
  if(action==='list')Object.assign(intent,{asset:get('--asset','quote'),tokenId:get('--token-id'),amount:get('--amount','1'),unitWei:get('--unit-wei'),listingDeadline:get('--deadline')});
  if(action==='fill')Object.assign(intent,{listingId:get('--listing-id'),amount:get('--amount','1')});
  const response=await read('/api/agent/challenge',{wallet:checked.recipient,agentId:checked.agentId,intent});
  const message=JSON.stringify({method:'eth_signTypedData_v4',params:[checked.recipient,JSON.stringify(response.typedData)]});
  console.log(JSON.stringify({...response,bawPreview:{command:'baw',args:['sign-message','preview','--binanceChainId','4663','--signType','EIP712','--message',message,'--json']},next:'Show preview risks. After explicit user confirmation, execute its requestId, obtain the signature result, then call authorize with this challenge and signature. No transaction has been sent.'},null,2));return;
 }
 const [protocol,status]=await Promise.all([read('/api/protocol'),read('/api/agent/status')]);let result;
 if(command==='prepare')result=prepareIntent(args.slice(1),protocol,status);
 else if(command==='market'){const asset=get('--asset','quote');if(!['quote','settle','circuit'].includes(asset))throw Error('Invalid market asset');result=await read('/api/agent/market?asset='+asset+'&after='+encodeURIComponent(get('--after','0')));}
 else if(command==='inventory'){const wallet=get('--wallet')||(await inspectAgentWallet()).recipient;if(!/^0x[0-9a-fA-F]{40}$/.test(wallet))throw Error('Invalid wallet');result=await read('/api/agent/inventory?wallet='+wallet);}
 else result={protocol:'FillOut Agent Genesis',chainId:protocol.network?.chainId,live:status.live===true,contracts:protocol.launch?.productionContracts||null,mintLive:status.signingServiceReady===true&&status.state?.mintOpen===true,assemblyLive:status.signingServiceReady===true&&status.state?.mintClosed===true,agentVerificationLive:status.signingServiceReady===true,state:status.state,transactionsSent:0};
 console.log(JSON.stringify(result,null,2));if(command==='prepare'&&result.execution==='blocked')process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(e=>{console.error(JSON.stringify({error:e.message,transactionsSent:0}));process.exitCode=1;});
