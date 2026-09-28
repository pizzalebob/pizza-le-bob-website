const key='public-content';
export async function onRequestPut({request,env}){
  if(!await verifyAccess(request,env)) return new Response('Sign-in required',{status:401});
  let data;try{data=await request.json()}catch{return new Response('Invalid JSON',{status:400})}
  if(!Array.isArray(data.events)||data.events.length>40||typeof data.special!=='object')return new Response('Invalid content',{status:400});
  const events=[];
  for(const item of data.events){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||!/^\d{2}:\d{2}$/.test(item.time)||typeof item.venue!=='string'||item.venue.length>120)return new Response('Invalid event',{status:400});
    events.push({date:item.date,time:item.time,venue:item.venue});
  }
  const special={};for(const field of ['name','description','price']){const value=data.special[field]||'';if(typeof value!=='string'||value.length>300)return new Response('Invalid special',{status:400});special[field]=value}
  await env.CONTENT.put(key,JSON.stringify({mode:'manual',events,special}));
  return Response.json({ok:true});
}

function decodeBase64Url(value){
  const base64=value.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length/4)*4,'=')),c=>c.charCodeAt(0));
}
async function verifyAccess(request,env){
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.OWNER_EMAIL)return false;
  try{
    const [head,body,signature,...rest]=token.split('.');
    if(rest.length||!head||!body||!signature)return false;
    const header=JSON.parse(new TextDecoder().decode(decodeBase64Url(head)));
    const payload=JSON.parse(new TextDecoder().decode(decodeBase64Url(body)));
    const issuer='https://'+env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,'').replace(/\/$/,'');
    const now=Math.floor(Date.now()/1000);
    if(header.alg!=='RS256'||!header.kid||payload.iss!==issuer||
       !Array.isArray(payload.aud)||!payload.aud.includes(env.ACCESS_AUD)||
       payload.email?.toLowerCase()!==env.OWNER_EMAIL.toLowerCase()||
       !Number.isFinite(payload.exp)||payload.exp<=now||
       (payload.nbf&&payload.nbf>now))return false;
    const response=await fetch(issuer+'/cdn-cgi/access/certs');
    if(!response.ok)return false;
    const keys=(await response.json()).keys||[];
    const jwk=keys.find(key=>key.kid===header.kid);
    if(!jwk)return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodeBase64Url(signature),new TextEncoder().encode(head+'.'+body));
  }catch{return false}
}
