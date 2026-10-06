export function createRefreshGate({interval=30000,maxBackoff=300000,now=Date.now}={}) {
  let active=null;
  const states=new Map();
  return async function run(key,task,{background=false}={}) {
    if(active){if(background)return;await active;return run(key,task,{background});}
    const previous=states.get(key)||{next:0,failures:0};
    if(background&&now()<previous.next)return;
    active=Promise.resolve().then(task).then(result=>{
      const failures=result===false?previous.failures+1:0;
      states.set(key,{failures,next:now()+Math.min(maxBackoff,interval*2**Math.min(failures,8))});
      return result;
    }).catch(()=>{
      const failures=previous.failures+1;
      states.set(key,{failures,next:now()+Math.min(maxBackoff,interval*2**Math.min(failures,8))});
      return false;
    });
    try{return await active;}finally{active=null;}
  };
}
