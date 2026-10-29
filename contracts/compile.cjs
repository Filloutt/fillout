const fs=require('node:fs'),path=require('node:path');
const deps=require('./dependencies.cjs');
const solc=deps('solc');
const sources=Object.fromEntries(fs.readdirSync(__dirname).filter(f=>f.endsWith('.sol')).map(f=>[f,{content:fs.readFileSync(path.join(__dirname,f),'utf8')}]));
const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','metadata']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input),{import:name=>{try{return{contents:fs.readFileSync(deps.resolve(name),'utf8')}}catch(e){return{error:e.message}}}}));
for(const e of output.errors||[])console.error(e.formattedMessage);
if(output.errors?.some(e=>e.severity==='error'))process.exit(1);
fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
for(const file of Object.keys(sources))for(const[name,a]of Object.entries(output.contracts[file])){
 const bytes=a.evm.deployedBytecode.object.length/2;if(bytes>24576)throw Error(name+' exceeds EIP170');
 fs.writeFileSync(path.join(__dirname,'artifacts',name+'.json'),JSON.stringify({contractName:name,sourceName:file,compiler:solc.version(),...a},null,2));
 console.log(name+': '+bytes+' runtime bytes');
}
fs.writeFileSync(path.join(__dirname,'standard-input.json'),JSON.stringify({...input,sources:{...sources,...Object.fromEntries(Object.entries(output.sources).filter(([n])=>!sources[n]).map(([n])=>[n,{content:fs.readFileSync(deps.resolve(n),'utf8')}]))}},null,2));
