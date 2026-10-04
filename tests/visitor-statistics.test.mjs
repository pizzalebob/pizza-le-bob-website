import test from 'node:test';
import assert from 'node:assert/strict';
import {weekStart,hashVisitor,PREFIX} from '../lib/visitor-statistics.js';
import {onRequestPost} from '../functions/api/visit.js';
import {onRequestGet} from '../functions/admin/api/statistics.js';
const origin='https://www.pizzalebob.co.uk';
const request = (data,extra={}) => new Request(origin+'/api/visit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(data)});
const event = () => ({page:'menu',visitor:crypto.randomUUID(),event:crypto.randomUUID(),consent:true});
test('UK Monday weeks handle Sunday night, BST, winter and year boundary',()=>{
 assert.equal(weekStart(new Date('2026-10-04T22:59:59Z')),'2026-09-28');
 assert.equal(weekStart(new Date('2026-10-04T23:00:00Z')),'2026-10-05');
 assert.equal(weekStart(new Date('2026-12-06T23:30:00Z')),'2026-11-30');
 assert.equal(weekStart(new Date('2027-01-01T12:00:00Z')),'2026-12-28');
});
test('anonymous visitor hashes are stable and do not contain the browser ID',async()=>{
 const id=crypto.randomUUID(),hash=await hashVisitor(id);assert.equal(hash.length,64);assert.equal(hash,await hashVisitor(id));assert.notEqual(hash,await hashVisitor(crypto.randomUUID()));assert.ok(!hash.includes(id));
});
test('collects independent immutable views without touching public content',async()=>{
 const writes=new Map(),env={CONTENT:{put:async(key,value,options)=>writes.set(key,options.metadata)}};
 const a=event(),b={...event(),visitor:a.visitor};
 const results=await Promise.all([a,b].map(data=>onRequestPost({request:request(data),env})));
 assert.deepEqual(results.map(r=>r.status),[204,204]);assert.equal(writes.size,2);
 for(const [key,e]of writes){assert.ok(key.startsWith(PREFIX));assert.equal(e.p,'menu');assert.equal(e.u,await hashVisitor(a.visitor));assert.ok(!JSON.stringify(e).includes(a.visitor));}
 assert.equal((await onRequestPost({request:request(a),env})).status,204);assert.equal(writes.size,2);
});
test('rejects cross-origin, missing consent, forged pages and oversized data',async()=>{
 let writes=0;const env={CONTENT:{put:async()=>writes++}};
 for(const [data,extra,code]of [[event(),{Origin:'https://other.example'},403],[{...event(),consent:false},{},400],[{...event(),page:'admin'},{},400],[{...event(),visitor:'invalid'},{},400],[{...event(),extra:'x'.repeat(2000)},{},400]])assert.equal((await onRequestPost({request:request(data,extra),env})).status,code);
 assert.equal(writes,0);
 assert.equal((await onRequestPost({request:request(event(),{'User-Agent':'ExampleCrawler bot'}),env})).status,204);assert.equal(writes,0);
});
test('fails safely when storage is absent or unavailable',async()=>{
 assert.equal((await onRequestPost({request:request(event()),env:{}})).status,503);
 assert.equal((await onRequestPost({request:request(event()),env:{CONTENT:{put:async()=>{throw Error('quota');}}}})).status,503);
});
test('private statistics fail closed without verified owner authentication',async()=>{
 let reads=0;const response=await onRequestGet({request:new Request(origin+'/admin/api/statistics'),env:{CONTENT:{list:async()=>reads++}}});assert.equal(response.status,401);assert.equal(reads,0);assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('verified signed owner may paginate; wrong owner, audience, expiry and signature denied',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='test-key';
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 const env={ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'test-audience',OWNER_EMAIL:'owner@example.com',CONTENT:{list:async(options)=>{assert.equal(options.prefix,PREFIX);assert.equal(options.cursor,'opaque-cursor');return {keys:[{metadata:{p:'menu',u:'a'.repeat(64),w:'2026-09-28',t:'2026-10-04T20:00:00Z'}}],list_complete:false,cursor:'next-cursor'};}}};
 const encode=s=>Buffer.from(s).toString('base64url');
 async function token(overrides={}){const head=encode(JSON.stringify({alg:'RS256',kid:'test-key'})),body=encode(JSON.stringify({iss:'https://test.cloudflareaccess.com',aud:['test-audience'],email:'owner@example.com',exp:Math.floor(Date.now()/1000)+600,...overrides}));const signature=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(head+'.'+body))).toString('base64url');return head+'.'+body+'.'+signature;}
 async function get(jwt){return onRequestGet({request:new Request(origin+'/admin/api/statistics?cursor=opaque-cursor',{headers:{'Cf-Access-Jwt-Assertion':jwt}}),env});}
 try{
  const response=await get(await token());assert.equal(response.status,200);const data=await response.json();assert.equal(data.nextCursor,'next-cursor');assert.equal(data.events.length,1);assert.equal(data.pages.menu,'Menu');
  for(const change of [{email:'someone@example.com'},{aud:['wrong']},{exp:1},{iss:'https://attacker.example'}])assert.equal((await get(await token(change))).status,401);
  const signed=await token();assert.equal((await get(signed.slice(0,-10)+'invalid')).status,401);
 }finally{globalThis.fetch=original;}
});

test('live test traffic is temporary and excluded from real statistics',async()=>{
 let write;const env={CONTENT:{put:async(...args)=>write=args}};
 assert.equal((await onRequestPost({request:request({...event(),test:true}),env})).status,204);
 assert.ok(write[0].startsWith('visitor-statistics-test:v1:'));assert.equal(write[2].expirationTtl,300);
});
