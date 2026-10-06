import assert from 'node:assert/strict';
import {compile,template} from './dist/engine.mjs';
import {analyze,runCycles} from './dist/simulation.mjs';
const ir=compile(template('memory'));const r=runCycles(ir,[0],[1],2);
assert.deepEqual(r.rows.map(x=>x.outputs),[[0],[1]]);assert.deepEqual(r.state,[1]);assert.equal(analyze(compile(template())).depth,1);
const toggle=compile([{id:'n1',type:'mem',ins:['n2']},{id:'n2',type:'nand',ins:['n1','n1']},{id:'n3',type:'output',ins:['n1']}]);
assert.deepEqual(runCycles(toggle,[0],[],4).rows.map(x=>x.outputs[0]),[0,1,0,1]);assert.throws(()=>runCycles(ir,[0],[1],65));
console.log('PASS: synchronous memory trace, feedback oscillator, depth and run limits');
