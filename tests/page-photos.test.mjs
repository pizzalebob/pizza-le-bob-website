import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPut} from '../functions/admin/api/content.js';
const origin='https://plb.example';
const draft={events:[],special:{name:'',description:'',price:''}};
test('photo changes require owner authentication',async()=>{
 const r=await onRequestPut({request:new Request(origin+'/admin/api/content',{method:'PUT',body:JSON.stringify(draft)}),env:{}});assert.equal(r.status,401);
});
test('owner saves named photo slots, preserves other fields and rejects invalid images',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='test';
 const enc=s=>Buffer.from(s).toString('base64url');const head=enc(JSON.stringify({alg:'RS256',kid:'test'})),body=enc(JSON.stringify({iss:'https://test.cloudflareaccess.com',aud:['aud'],email:'owner@example.com',exp:Math.floor(Date.now()/1000)+600}));
 const sig=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(head+'.'+body))).toString('base64url');
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 const previous={menu:[{name:'existing'}],reviews:[{name:'existing review'}],galleryPhotos:[{photo:'data:image/jpeg;base64,YQ==',alt:'Existing gallery'}],pagePhotos:{'corporate-first':{photo:'data:image/jpeg;base64,YQ==',alt:'Existing'}}};let saved;
 const env={ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'aud',OWNER_EMAIL:'owner@example.com',CONTENT:{get:async()=>previous,put:async(key,value)=>{assert.equal(key,'public-content');saved=JSON.parse(value);}}};
 async function save(pagePhotos,galleryPhotos){return onRequestPut({request:new Request(origin+'/admin/api/content',{method:'PUT',headers:{'Cf-Access-Jwt-Assertion':head+'.'+body+'.'+sig},body:JSON.stringify({...draft,...(galleryPhotos===undefined?{}:{galleryPhotos}),...(pagePhotos===undefined?{}:{pagePhotos})})}),env});}
 try{
  assert.equal((await save(undefined)).status,200);assert.deepEqual(saved.pagePhotos,previous.pagePhotos);assert.deepEqual(saved.galleryPhotos,previous.galleryPhotos);assert.deepEqual(saved.menu,previous.menu);assert.deepEqual(saved.reviews,previous.reviews);
  const photos={'wedding-extra':{photo:'',alt:''},'wedding-main':{photo:'data:image/jpeg;base64,YQ==',alt:'New couple'},'wedding-venue':{photo:'',alt:'A venue',caption:'New venue'},'corporate-second':{photo:'data:image/webp;base64,YQ==',alt:'New corporate'}};
  assert.equal((await save(photos)).status,200);assert.deepEqual(saved.pagePhotos,photos);assert.deepEqual(saved.menu,previous.menu);assert.deepEqual(saved.reviews,previous.reviews);
  const added=[{photo:'data:image/jpeg;base64,YQ==',alt:'New gallery'}];assert.equal((await save(photos,added)).status,200);assert.deepEqual(saved.galleryPhotos,added);assert.deepEqual(saved.pagePhotos,photos);assert.equal((await save(photos,[])).status,200);assert.deepEqual(saved.galleryPhotos,[]);
  for(const invalid of [null,{},Array(21).fill(added[0]),[{photo:'https://example.com/image.jpg',alt:''}],[{photo:'data:image/svg+xml;base64,YQ==',alt:''}],[{photo:'data:image/jpeg;base64,YQ==',alt:9}]])assert.equal((await save(photos,invalid)).status,400);
  for(const invalid of [{unknown:{photo:'',alt:''}},{'wedding-main':{photo:'https://attacker.example/a.jpg',alt:''}},{'wedding-main':{photo:'data:image/svg+xml;base64,YQ==',alt:''}},{'wedding-main':{photo:'data:image/jpeg;base64,'+'A'.repeat(400000),alt:''}},{'wedding-venue':{photo:'',alt:'',caption:5}}])assert.equal((await save(invalid)).status,400);
 }finally{globalThis.fetch=originalFetch;}
});
