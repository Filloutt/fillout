import assert from 'node:assert/strict';
import {DraftHistory} from './dist/history.mjs';
const h=new DraftHistory(2),a=[{id:'n1',x:1}],b=[{id:'n1',x:2}],c=[{id:'n1',x:3}];
assert.equal(h.undo(a),null);h.checkpoint(a);a[0].x=99;assert.deepEqual(h.undo(b),[{id:'n1',x:1}]);assert.deepEqual(h.redo([{id:'n1',x:1}]),b);
h.checkpoint(b);assert.deepEqual(h.undo(c),b);h.checkpoint(b);assert.equal(h.canRedo,false);
const bounded=new DraftHistory(2);bounded.checkpoint([1]);bounded.checkpoint([2]);bounded.checkpoint([3]);assert.deepEqual(bounded.undo([4]),[3]);assert.deepEqual(bounded.undo([3]),[2]);assert.equal(bounded.undo([2]),null);
console.log('PASS: undo/redo round-trip, snapshot isolation, branch invalidation and history limit.');
