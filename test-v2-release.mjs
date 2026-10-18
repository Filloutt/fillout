import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const config=read('dist/config.json'),manifest=read('dist/contract-manifest.json'),snapshot=read('dist/security-onchain.json');
assert.equal(config.chainId,4663);assert.equal(config.release,'v2-20261018');
assert.equal(manifest.unitMintPriceWei,'50000000000000');
assert.equal(config.tokenomics.mintPaymentRouting,'immediate-to-treasury');
assert.equal(config.tokenomics.unitMintPriceEth,'0.00005');
assert.equal(snapshot.contracts.length,8);
for(const [i,name] of ['OpenBook','FillOut'].entries()){
 const c=i?{...config,...config.fillout}:config,m=manifest.collections[i];
 assert.equal(m.name,name);
 for(const role of ['parts','desk','circuits','market']){
  const evidence=snapshot.contracts.find(r=>r.collection===name&&r.role===role);
  assert.equal(c[role+'Address'],evidence.address);assert.equal(m[role],evidence.address);
 }
 const parts=snapshot.contracts.find(r=>r.collection===name&&r.role==='parts');
 const desk=snapshot.contracts.find(r=>r.collection===name&&r.role==='desk');
 assert.equal(parts.values['owner()'].toLowerCase(),c.deskAddress.toLowerCase());
 assert.equal(desk.values['parts()'].toLowerCase(),c.partsAddress.toLowerCase());
 assert.equal(desk.values['treasury()'].toLowerCase(),config.treasuryAddress.toLowerCase());
 assert.equal(desk.values['unitPrice()'],'50000000000000');
}
const forbidden=['0xcAEacd999E09524A47CC790cc2AA65148DA2C484','0x700d8b2c19225CA05E3B0a7840ccEBfa0CC2D1E0','0x71893bc051D74c521D6E9F3464cc6c155294e735','0x1295c70dAE7B792368dbaC5a95D22B1eBD37086d','0xd57Ad2d8AD81606Bd529D483EAfd50CdaA912ddE','0x1cc873CC2b86536aEdE951e54D2aDA6154018d95','0x9CD6694A2247243FABA441B1c434D0443318395e','0x3541B64787F90930b2664551cb572a1717fB965B','0.0002 ETH'];
for(const name of fs.readdirSync('dist').filter(n=>/\.(mjs|json|html)$/.test(n))){const text=fs.readFileSync('dist/'+name,'utf8').toLowerCase();for(const old of forbidden)assert(!text.includes(old.toLowerCase()),name+' contains superseded data');}
console.log('PASS V2 release: all active contracts agree with deployment evidence; price, treasury, mint authority and old-data removal verified.');
