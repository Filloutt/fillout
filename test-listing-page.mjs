import assert from 'node:assert/strict';
import {readListingPage} from './dist/listing-page.mjs';
const word=n=>BigInt(n).toString(16).padStart(64,'0');
let calls=0,active=0,peak=0;const ids=[];
async function read(method,params){calls++;if(method==='eth_blockNumber')return '0xabc';assert.equal(params[1],'0xabc');if(params[0].data==='0xaaccf1ec')return '0x'+word(1000000);const id=BigInt('0x'+params[0].data.slice(10));ids.push(id);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));active--;return '0x'+[1,0,2,3,id%2n].map(word).join('');}
const first=await readListingPage({read,to:'0x1',tokenId:0});assert.equal(calls,42);assert.equal(peak,5);assert.equal(first.start,'999960');assert.equal(first.rows.length,20);assert.equal(first.rows[0].listingId,'999999');
ids.length=0;const second=await readListingPage({read,to:'0x1',tokenId:0,before:first.start});assert.equal(ids[0],999959n);assert.equal(second.start,'999920');
const empty=await readListingPage({read:async m=>m==='eth_blockNumber'?'0x1':'0x0',to:'0x1',tokenId:0});assert.equal(empty.hasOlder,false);assert.deepEqual(empty.rows,[]);
await assert.rejects(readListingPage({read,to:'0x1',tokenId:0,before:-1}));
await assert.rejects(readListingPage({read:async m=>m==='eth_blockNumber'?'0x1':'0x1',to:'0x1',tokenId:0}));
console.log('PASS: million-listing bounded page, concurrency limit, stable block, descending cursor, empty and malformed responses.');
