// A page covers a bounded range of historical IDs, including inactive listings.
export async function readListingPage({read,to,tokenId,before=null,pageSize=40}) {
  if(!Number.isInteger(pageSize)||pageSize<1||pageSize>40)throw Error('Invalid page size');
  const block=await read('eth_blockNumber',[]);
  const count=BigInt(await read('eth_call',[{to,data:'0xaaccf1ec'},block]));
  const end=before===null?count:BigInt(before)<count?BigInt(before):count;
  if(end<0n)throw Error('Invalid cursor');
  const start=end>BigInt(pageSize)?end-BigInt(pageSize):0n;
  const rows=[];
  for(let top=end;top>start;){
    const ids=[];for(let i=0;i<5&&top>start;i++)ids.push(--top);
    const batch=await Promise.all(ids.map(async listingId=>{
      const data=await read('eth_call',[{to,data:'0xde74e57b'+listingId.toString(16).padStart(64,'0')},block]);
      if(!/^0x(?:[0-9a-fA-F]{64}){5}$/.test(data))throw Error('Invalid listing response');
      const w=data.slice(2).match(/.{64}/g);
      if(BigInt('0x'+w[1])!==BigInt(tokenId)||BigInt('0x'+w[2])===0n||BigInt('0x'+w[4])===0n)return null;
      return {listingId:String(listingId),seller:'0x'+w[0].slice(-40),amount:String(BigInt('0x'+w[2])),priceWei:String(BigInt('0x'+w[3]))};
    }));
    rows.push(...batch.filter(Boolean));
  }
  return {rows,start:String(start),end:String(end),hasOlder:start>0n};
}
