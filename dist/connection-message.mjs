import {localizedMessage} from './locale-text.mjs';
export function createConnectionMessage({origin,account,nonce,issuedAt}){
 if(!/^0x[0-9a-fA-F]{40}$/.test(account)||!/^https?:\/\//.test(origin)||!/^[0-9a-f]{32}$/.test(nonce))throw Error('Invalid connection details');
 return localizedMessage(['FillOut wallet connection','Website: '+origin,'Wallet: '+account,'','I confirm that I want to connect this wallet to FillOut.','This message does not authorize transactions, token transfers or token approvals.','Signing this message does not incur a network fee.','This signature acknowledges this browser connection only. It does not grant access to a server account.','','Nonce: '+nonce,'Issued at: '+issuedAt].join('\n'));
}
export async function confirmConnection(provider,account,isCurrent){
 const {verifyMessage,hexlify,toUtf8Bytes}=await import('./ethers.mjs');
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 const created=Date.now();const message=createConnectionMessage({origin:location.origin,account,nonce,issuedAt:new Date(created).toISOString()});
 if(!isCurrent())throw Error('Connection cancelled');
 const signature=await provider.request({method:'personal_sign',params:[hexlify(toUtf8Bytes(message)),account]});
 if(!isCurrent()||Date.now()-created>300000)throw Error('Connection expired. Please try again.');
 if(typeof signature!=='string'||verifyMessage(message,signature).toLowerCase()!==account.toLowerCase())throw Error('Signature does not match the selected wallet.');
 const current=await provider.request({method:'eth_accounts'});
 if(!isCurrent()||!Array.isArray(current)||current[0]?.toLowerCase()!==account.toLowerCase())throw Error('Wallet account changed. Please connect again.');
}
