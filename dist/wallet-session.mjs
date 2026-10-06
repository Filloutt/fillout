// Local wallet consent, not authentication. Restoration always checks the wallet.
export function createWalletSession({getProvider,ensureNetwork,origin,onChange,cryptoSource=globalThis.crypto,storage}) {
  const key='fillout-wallet-connection-v2';
  try{storage??=globalThis.localStorage;}catch{}
  let account=null,pending=null,restoring=null,revision=0,disconnected=false;
  try{disconnected=storage?.getItem(key)==='disconnected';}catch{}
  const valid=a=>/^0x[0-9a-f]{40}$/i.test(a||'');
  const remember=value=>{try{storage?.setItem(key,value);}catch{}};
  function change(value){if(value?.toLowerCase()===account?.toLowerCase())return;account=value;onChange(value);}
  function disconnect(){revision++;disconnected=true;remember('disconnected');change(null);}
  function unavailable(){revision++;change(null);}
  function restore(){
    if(disconnected||pending)return Promise.resolve(account);
    if(restoring)return restoring;
    const attempt=revision;
    restoring=(async()=>{
      try{
        const accounts=await getProvider().request({method:'eth_accounts'});
        if(attempt===revision&&!disconnected)change(valid(accounts[0])?accounts[0]:null);
      }catch{/* Retry a locked, late-injected or offline wallet on focus. */}
      return account;
    })().finally(()=>{restoring=null;});
    return restoring;
  }
  function connect(){
    if(account)return Promise.resolve(account);
    if(pending)return pending;
    const attempt=++revision;
    pending=(async()=>{
      const provider=getProvider();
      const accounts=await provider.request({method:'eth_requestAccounts'});
      const candidate=accounts[0];
      if(!valid(candidate))throw Error('No wallet account selected.');
      await ensureNetwork();
      if(attempt!==revision)throw Error('Connection cancelled.');
      const nonce=Array.from(cryptoSource.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
      const message=['FillOut wallet connection',`Website: ${origin}`,`Wallet: ${candidate}`,'','I confirm that I want to connect this wallet to FillOut.','This message does not authorize transactions, token transfers or token approvals.','Signing this message does not incur a network fee.','This is a local connection acknowledgement, not a server login.',`Nonce: ${nonce}`,`Issued at: ${new Date().toISOString()}`].join('\n');
      const encoded='0x'+Array.from(new TextEncoder().encode(message),b=>b.toString(16).padStart(2,'0')).join('');
      const signature=await provider.request({method:'personal_sign',params:[encoded,candidate]});
      if(typeof signature!=='string'||!/^0x[0-9a-f]+$/i.test(signature))throw Error('Wallet did not return a signature.');
      const current=await provider.request({method:'eth_accounts'});
      if(attempt!==revision||current[0]?.toLowerCase()!==candidate.toLowerCase())throw Error('Wallet account changed. Please connect again.');
      disconnected=false;remember('connected');change(candidate);return candidate;
    })().finally(()=>{pending=null;});
    return pending;
  }
  function accountsChanged(accounts){
    if(pending||disconnected)return;
    revision++;change(valid(accounts[0])?accounts[0]:null);
  }
  return {connect,disconnect,restore,unavailable,accountsChanged};
}
