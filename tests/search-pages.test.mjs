import test from 'node:test';
import assert from 'node:assert/strict';
import {SEARCH_PAGES,ORIGIN,publicLink,structuredData} from '../lib/search-pages.js';
import {onRequest} from '../functions/_middleware.js';
import {readFileSync} from 'node:fs';

test('every service has a unique canonical URL, title, schema and sitemap entry',()=>{
 const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
 assert.equal(new Set(SEARCH_PAGES.map(p=>p.path)).size,SEARCH_PAGES.length);
 assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]),SEARCH_PAGES.filter(p=>p.section!=='privacy').map(p=>ORIGIN+p.path));
 for(const page of SEARCH_PAGES){
  assert.equal(publicLink('#'+page.section),page.path);
  const data=JSON.parse(structuredData(page));
  assert.equal(data['@graph'].find(x=>x['@type']==='WebPage').url,ORIGIN+page.path);
  if(page.section!=='privacy')assert.ok(sitemap.includes('<loc>'+ORIGIN+page.path+'</loc>'));
 }
 assert.equal(publicLink('#corporate-form'),'/corporate-pizza-catering-leeds#corporate-form');
 assert.equal(publicLink('https://example.com/'),'https://example.com/');
});

test('old duplicate files and trailing slash variants redirect without losing query parameters',async()=>{
 for(const [path,target] of [['/index.html','/'],['/pizza-le-bob-final.html','/'],['/wedding-pizza-catering-leeds/','/wedding-pizza-catering-leeds']]){
  const response=await onRequest({request:new Request(ORIGIN+path+'?source=test'),next:()=>{throw Error('Unexpected downstream request');}});
  assert.equal(response.status,301);assert.equal(response.headers.get('location'),ORIGIN+target+'?source=test');
 }
});

test('unknown public HTML URLs return 404 while APIs, assets and admin pass through',async()=>{
 const make=(path,type,method='GET')=>onRequest({request:new Request(ORIGIN+path,{method}),next:async()=>new Response('original',{headers:{'content-type':type}})});
 assert.equal((await make('/made-up-page','text/html')).status,404);
 for(const [path,type] of [['/admin/','text/html'],['/api/content','application/json'],['/assets/x.css','text/css'],['/sitemap.xml','application/xml']])assert.equal(await (await make(path,type)).text(),'original');
 assert.equal(await (await make('/api/enquiry','application/json','POST')).text(),'original');
});
