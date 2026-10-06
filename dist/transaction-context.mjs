// Recheck immediately before requesting a transaction after asynchronous reads.
export async function assertTransactionContext(provider,sender,chainId){
  const accounts=await provider.request({method:'eth_accounts'});
  if(accounts[0]?.toLowerCase()!==sender?.toLowerCase())throw Error('Wallet account changed. Please retry.');
  if(BigInt(await provider.request({method:'eth_chainId'}))!==BigInt(chainId))throw Error('Wallet network changed. Please retry.');
}
