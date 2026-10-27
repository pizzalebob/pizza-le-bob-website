import assert from 'node:assert/strict';
import test from 'node:test';
import {allergenPage, publicSnapshot} from '../lib/allergen-page.js';
import {onRequestGet} from '../functions/allergens.js';
const fixture={schemaVersion:1,reviewedAt:'2026-10-27T12:00:00Z',crossContact:'Shared equipment.',items:[{name:'Test pizza <script>alert(1)</script>',contains:['Milk'],mayContain:['Soya'],details:'Notes <img onerror=alert(1)>'}],publishedBy:'private@example.com'};
test('public projection strips internal fields and escapes public text',()=>{
  const dto=publicSnapshot(fixture); assert.equal(dto.publishedBy,undefined);
  const html=allergenPage(dto); assert.doesNotMatch(html,/<script>alert|<img onerror|private@example/);
  assert.match(html,/&lt;script&gt;/); assert.match(html,/Contains/); assert.match(html,/May contain/);
});
test('missing, withdrawn, invalid and unreachable publications fail closed',async()=>{
  const original=globalThis.fetch;
  try {
    for(const fn of [async()=>new Response('{}',{status:503}),async()=>Response.json({schemaVersion:5}),async()=>{throw new Error('offline')}]) {
      globalThis.fetch=fn;
      const result=await onRequestGet(); assert.equal(result.status,200); const html=await result.text(); assert.match(html,/Please speak to us before ordering/); assert.match(html,/allergen-loader.js/); assert.doesNotMatch(html,/<article class="pizza"/); assert.match(result.headers.get('cache-control'),/no-store/);
    }
  } finally {globalThis.fetch=original;}
});
test('customer handler reads only the fixed public service and sets no-store',async()=>{
  const original=globalThis.fetch; let url,options;
  try {
    globalThis.fetch=async(u,o)=>{url=u;options=o;if ('cache' in o) throw new Error("The 'cache' field on 'RequestInitializerDict' is not implemented.");return Response.json(fixture)};
    const result=await onRequestGet();
    assert.equal(result.status,200); assert.equal(url,'https://pizza-le-bob-food-staff-quiz.pizzalebob.workers.dev/api/public-allergens');
    assert.equal(options.cache,undefined); assert.deepEqual(options.cf,{cacheTtl:0,cacheEverything:false}); assert.equal(options.redirect,'error');
    assert.doesNotMatch(await result.text(),/private@example/);
    assert.match(result.headers.get('cache-control'),/no-store/);
  } finally {globalThis.fetch=original;}
});
