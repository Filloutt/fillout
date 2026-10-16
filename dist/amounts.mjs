const MAX_UINT256=(1n<<256n)-1n;

// Parse decimal text directly: floating-point conversion can round token amounts.
export function parsePositiveUnits(value,decimals=18){
  const text=String(value).trim();
  if(!Number.isInteger(decimals)||decimals<0||decimals>18)throw Error('Invalid decimal precision');
  if(text.length>100||!/^\d+(?:\.\d+)?$/.test(text))throw Error('Enter a positive decimal amount');
  const [whole,fraction='']=text.split('.');
  if(fraction.length>decimals)throw Error('Too many decimal places');
  const units=BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.padEnd(decimals,'0')||'0');
  if(units<=0n||units>MAX_UINT256)throw Error('Amount is outside the supported range');
  return units;
}

export function parsePositiveQuantity(value){
  return parsePositiveUnits(value,0);
}
