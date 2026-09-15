import assert from 'node:assert/strict';
import {compile,step,encode,template,validateDraft} from './dist/engine.mjs';
for(const a of[0,1])for(const b of[0,1]){const ns=template();ns[0].value=a;ns[1].value=b;const ir=compile(ns);assert.deepEqual(step(ir,[],[a,b]).outputs,[1-(a&b)]);assert.equal(encode(ir),'0x4143445600010002000100000000000110000000020000000300000004');}
const mem=compile(template('memory'));assert.deepEqual(step(mem,[0],[1]),{signals:[0,1,1,0],outputs:[0],nextState:[1]});assert.deepEqual(step(mem,[1],[0]).outputs,[1]);
const bad=template();bad[2].ins=['n3','n2'];assert.throws(()=>compile(bad),/Döngü/);
const missing=template();missing[2].ins[0]=null;assert.throws(()=>compile(missing),/bağla/);
assert.throws(()=>validateDraft({version:1,nodes:[{id:'<script>',type:'input'}]}),/düğüm/);
assert.equal(validateDraft({version:1,nodes:template()}).length,4);
assert.throws(()=>step(mem,[2],[0]),/Bit/);
console.log('PASS: NAND truth table, ACDV golden encoding, memory transition, cycle/missing-wire rejection, draft validation, strict bits.');
