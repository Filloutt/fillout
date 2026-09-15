export let language=localStorage.getItem('fillout-language')==='zh'?'zh':'en';
export const t=(en,zh)=>language==='zh'?zh:en;
export function setLanguage(value){language=value==='zh'?'zh':'en';localStorage.setItem('fillout-language',language);document.documentElement.lang=language==='zh'?'zh-CN':'en';}
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const word=n=>BigInt(n).toString(16).padStart(64,'0');
export const hex=n=>'0x'+BigInt(n).toString(16);
export const fmt=n=>{const s=BigInt(n).toString().padStart(19,'0');return s.slice(0,-18)+'.'+s.slice(-18).replace(/0+$/,'').padEnd(1,'0');};
export const buyData=(id,amount,fee)=>'0x40993b26'+word(id)+word(amount)+word(fee);
