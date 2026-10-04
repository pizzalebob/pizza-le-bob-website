import {PAGES,PREFIX,weekStart,hashVisitor} from '../../lib/visitor-statistics.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={'Cache-Control':'no-store'};
// A bounded per-isolate burst guard; no network identifiers are written to storage.
const bursts=new Map();
function burstAllowed(request){
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return true;
  const now=Date.now(),entry=bursts.get(ip);
  if(entry && now-entry.start<60000){entry.count++;return entry.count<=30;}
  if(bursts.size>=5000)bursts.clear();
  bursts.set(ip,{start:now,count:1});return true;
}
async function smallJson(request){
  const reader=request.body?.getReader();if(!reader)throw Error();
  const chunks=[];let size=0;
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw Error();}chunks.push(value);}}
  finally {reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function onRequestPost({request,env}) {
  const url=new URL(request.url);
  if(request.headers.get('Origin')!==url.origin || request.headers.get('Sec-Fetch-Site')==='cross-site')return new Response('Forbidden',{status:403,headers});
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return new Response('Invalid content type',{status:415,headers});
  if(/bot|crawler|spider|headless/i.test(request.headers.get('User-Agent')||'') || request.cf?.botManagement?.score<30)return new Response(null,{status:204,headers});
  if(!burstAllowed(request))return new Response('Too many visits',{status:429,headers});
  let data;
  try {data=await smallJson(request);}catch{return new Response('Invalid request',{status:400,headers});}
  if(!data || !Object.hasOwn(PAGES,data.page) || !uuid.test(data.visitor||'') || !uuid.test(data.event||'') || data.consent!==true)return new Response('Invalid visit',{status:400,headers});
  if(!env.CONTENT)return new Response('Analytics storage unavailable',{status:503,headers});
  try {
    const now=new Date(), visitor=await hashVisitor(data.visitor);
    // One immutable key per navigation: concurrent visitors never overwrite a shared counter.
    // Event UUID makes network retries idempotent. Metadata avoids one KV read per view.
    const test=data.test===true;
    await env.CONTENT.put((test?'visitor-statistics-test:v1:':PREFIX)+data.event,'',{metadata:{p:data.page,u:visitor,w:weekStart(now),t:now.toISOString()},...(test?{expirationTtl:300}:{})});
    return new Response(null,{status:204,headers});
  }catch{return new Response('Analytics temporarily unavailable',{status:503,headers});}
}
