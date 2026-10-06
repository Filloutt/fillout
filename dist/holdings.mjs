const word=n=>BigInt(n).toString(16).padStart(64,'0');
const address=a=>{if(!/^0x[0-9a-f]{40}$/i.test(a))throw Error('Invalid address');return a.slice(2).toLowerCase().padStart(64,'0');};
const uint=value=>{if(!/^0x[0-9a-f]{64}$/i.test(value))throw Error('Invalid balance response');return BigInt(value);};
export async function readParts({call,partsAddress,owner}) {
  const ownerWord=address(owner);
  const values=await Promise.allSettled([0,1].map(id=>call(partsAddress,'0x00fdd58e'+ownerWord+word(id)).then(uint)));
  return values.map(r=>r.status==='fulfilled'?{amount:r.value}:{error:true});
}
export async function readCircuitPage({call,circuitsAddress,owner,before=null}) {
  const ownerWord=address(owner);
  const owned=uint(await call(circuitsAddress,'0x70a08231'+ownerWord));
  if(!owned)return {owned,ids:[],start:0n,end:0n,hasOlder:false};
  // nextId(), verified on both live circuit contracts; nextListingId() belongs to markets.
  const count=uint(await call(circuitsAddress,'0x61b8ce8c'));
  const end=before===null?count:BigInt(before)<count?BigInt(before):count;
  const start=end>40n?end-40n:0n,ids=[];
  for(let top=end;top>start;){
    const batch=[];for(let i=0;i<5&&top>start;i++)batch.push(--top);
    const rows=await Promise.all(batch.map(async id=>{
      const result=await call(circuitsAddress,'0x6352211e'+word(id));
      if(!/^0x[0-9a-f]{64}$/i.test(result))throw Error('Invalid owner response');
      return result.slice(-40).toLowerCase()===owner.slice(2).toLowerCase()?id:null;
    }));
    ids.push(...rows.filter(id=>id!==null));
  }
  return {owned,ids,start,end,hasOlder:start>0n};
}
export function listingValues(quantity,price,available){
  if(!/^[1-9]\d*$/.test(quantity))throw Error('Enter a whole quantity greater than zero.');
  const amount=BigInt(quantity);
  if(typeof available!=='bigint')throw Error('Refresh your wallet balance before listing.');
  if(amount>available)throw Error('Quantity exceeds the parts available in your wallet.');
  if(!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(price))throw Error('Enter an ETH price with up to 18 decimal places.');
  const [whole,fraction='']=price.split('.');
  const priceWei=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
  if(priceWei<=0n||priceWei>=(1n<<256n)||amount>=(1n<<256n))throw Error('Enter a valid price and quantity.');
  return {amount,price:priceWei};
}
