// Conservative graph reachability: includes every state dependency feeding an output,
// including feedback through memory. This is not Boolean dead-code minimization.
export function partsOutsideOutputs(nodes){
 const byId=new Map(nodes.map(node=>[node.id,node])),reachable=new Set();
 function visit(id){if(reachable.has(id))return;reachable.add(id);for(const source of byId.get(id)?.ins||[])if(source)visit(source);}
 nodes.filter(node=>node.type==='output').forEach(node=>visit(node.id));
 return nodes.filter(node=>(node.type==='nand'||node.type==='mem')&&!reachable.has(node.id));
}
