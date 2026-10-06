export class DraftHistory {
 constructor(limit=50){this.limit=limit;this.past=[];this.future=[];}
 checkpoint(nodes){const value=JSON.stringify(nodes);if(this.past.at(-1)!==value)this.past.push(value);if(this.past.length>this.limit)this.past.shift();this.future=[];}
 undo(nodes){if(!this.past.length)return null;this.future.push(JSON.stringify(nodes));return JSON.parse(this.past.pop());}
 redo(nodes){if(!this.future.length)return null;this.past.push(JSON.stringify(nodes));return JSON.parse(this.future.pop());}
 get canUndo(){return this.past.length>0;}
 get canRedo(){return this.future.length>0;}
}
