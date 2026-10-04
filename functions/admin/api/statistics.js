import {verifyAccess} from './content.js';
import {PAGES,PREFIX,weekStart} from '../../../lib/visitor-statistics.js';
const headers={'Cache-Control':'private, no-store','Vary':'Cf-Access-Jwt-Assertion','X-Content-Type-Options':'nosniff'};
export async function onRequestGet({request,env}) {
  if(!await verifyAccess(request,env))return new Response('Sign-in required',{status:401,headers});
  if(!env.CONTENT)return Response.json({error:'Analytics storage unavailable'},{status:503,headers});
  const cursor=new URL(request.url).searchParams.get('cursor');
  if(cursor && cursor.length>2048)return Response.json({error:'Invalid cursor'},{status:400,headers});
  try {
    const result=await env.CONTENT.list({prefix:PREFIX,limit:1000,...(cursor?{cursor}:{})});
    const events=result.keys.map(key=>key.metadata).filter(e=>e && Object.hasOwn(PAGES,e.p) && /^[0-9a-f]{64}$/.test(e.u) && /^\d{4}-\d{2}-\d{2}$/.test(e.w) && Number.isFinite(Date.parse(e.t)));
    return Response.json({events,nextCursor:result.list_complete?null:result.cursor,pages:PAGES,currentWeek:weekStart(),updatedAt:new Date().toISOString()},{headers});
  }catch{return Response.json({error:'Statistics could not be loaded. Please retry.'},{status:503,headers});}
}
