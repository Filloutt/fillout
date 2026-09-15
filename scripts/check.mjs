import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
for(const file of readdirSync('dist').filter(x=>x.endsWith('.mjs'))){
  const result=spawnSync(process.execPath,['--check',`dist/${file}`],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
