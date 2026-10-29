import {createAgentService} from './agent-service.mjs';
import {protocol,tiers} from '../dist/agent-protocol.mjs';
const agent=createAgentService();
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/protocol'&&request.method==='GET')return Response.json({...protocol,tiers},{headers:{'Cache-Control':'no-store'}});
 if(url.pathname.startsWith('/api/agent/')){const response=await agent(request,env);if(response)return response;}
 return new Response('Not found',{status:404});
}};
