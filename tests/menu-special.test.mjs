import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPut} from '../functions/admin/api/content.js';
import {onRequestGet} from '../functions/api/content.js';

test('editor special details, photo and visibility survive saving and public reloads', async () => {
  const keys = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const jwk = await crypto.subtle.exportKey('jwk',keys.publicKey); jwk.kid='menu-test';
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const head=encode({alg:'RS256',kid:jwk.kid});
  const body=encode({iss:'https://menu-test.cloudflareaccess.com',aud:['menu'],email:'owner@example.com',exp:Math.floor(Date.now()/1000)+600});
  const signature=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(head+'.'+body))).toString('base64url');
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({keys:[jwk]});
  const regular={name:'Margarita',description:'Tomato, basil, mozzarella',price:'£9',photo:'/assets/menu/0.jpg',hidden:false,special:false};
  const weekly={name:'Le Bob Special',description:'',price:'',photo:'data:image/jpeg;base64,YQ==',hidden:false,special:true};
  let stored={events:[],special:{name:'',description:'',price:''},menu:[regular,weekly],reviews:[{name:'Existing review'}],pagePhotos:{},galleryPhotos:[]};
  const env={ACCESS_TEAM_DOMAIN:'menu-test.cloudflareaccess.com',ACCESS_AUD:'menu',OWNER_EMAIL:'owner@example.com',CONTENT:{get:async()=>stored,put:async(key,value)=>{assert.equal(key,'public-content');stored=JSON.parse(value);}}};
  const save = draft => onRequestPut({env,request:new Request('https://menu.example/admin/api/content',{method:'PUT',headers:{'Cf-Access-Jwt-Assertion':head+'.'+body+'.'+signature},body:JSON.stringify(draft)})});
  try {
    const special={name:'Squash & chorizo',description:'Roast squash, chorizo, mozzarella',price:'£12'};
    assert.equal((await save({events:[],special,menu:[regular,weekly]})).status,200);
    let published=await (await onRequestGet({env})).json();
    assert.deepEqual(published.special,special);
    assert.deepEqual(published.menu,[regular,weekly]);
    assert.deepEqual(published.reviews,[{name:'Existing review'}]);
    // A blank optional price and a replaced photo must not restore last week's values.
    const replacement={...weekly,photo:'data:image/webp;base64,Yg==',hidden:true};
    const nextSpecial={name:'New weekly special',description:'New toppings',price:''};
    assert.equal((await save({events:[],special:nextSpecial,menu:[regular,replacement]})).status,200);
    published=await (await onRequestGet({env})).json();
    assert.deepEqual(published.special,nextSpecial);
    assert.deepEqual(published.menu,[regular,replacement]);
    // Removing a special is a valid editor operation; the standard menu is retained.
    assert.equal((await save({events:[],special:{name:'',description:'',price:''},menu:[regular]})).status,200);
    assert.deepEqual((await (await onRequestGet({env})).json()).menu,[regular]);
  } finally { globalThis.fetch=originalFetch; }
});
