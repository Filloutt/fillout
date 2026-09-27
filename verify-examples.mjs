import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compile,validateDraft,step,encode} from './dist/engine.mjs';

const specs={nand:[1,0,[[0,0],[0,1],[1,0],[1,1]],[1,1,1,0]],not:[1,0,[[0],[1]],[1,0]],xor:[4,0,[[0,0],[0,1],[1,0],[1,1]],[0,1,1,0]],memory:[0,1,[[1],[0],[0]],[0,1,0]]};
for(const [name,[quotes,settles,inputs,expected]] of Object.entries(specs)){
  const draft=JSON.parse(readFileSync(new URL('./example-'+name+'.json',import.meta.url),'utf8'));
  const ir=compile(validateDraft(draft));
  assert.equal(ir.ops.length,quotes,name+' Quote count');
  assert.equal(ir.localStateCount,settles,name+' Settle count');
  let state=Array(settles).fill(0);
  inputs.forEach((bits,i)=>{
    const result=step(ir,state,bits);
    assert.deepEqual(result.outputs,[expected[i]],name+' case '+i);
    if(settles)assert.deepEqual(result.nextState,bits,name+' next memory');
    state=result.nextState;
  });
  const hex=encode(ir);
  assert.ok(hex.startsWith('0x414344560001'),name+' ACDV/1 header');
  assert.equal((hex.length-2)/2,16+quotes*9+(settles+1)*4,name+' encoding size');
  console.log(name+': draft, part counts, behavior and encoding OK');
}
