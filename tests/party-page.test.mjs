import test from 'node:test';
import assert from 'node:assert/strict';
import {partyPage} from '../lib/party-page.js';
import {PHOTO_SLOTS} from '../assets/page-photo-config.js';
import {PAGES} from '../lib/visitor-statistics.js';
import {pageForPath,structuredData} from '../lib/search-pages.js';
test('party page provides three blank photo spaces and existing menu and enquiry links',()=>{
 const html=partyPage({'party-main':{photo:'',alt:'',caption:''}});
 assert.equal((html.match(/party-photo-empty/g)||[]).length,3);
 assert.equal((html.match(/<img /g)||[]).length,0);
 assert.ok(html.includes('href="/pizza-menu"'));assert.ok(html.includes('href="/mobile-pizza-catering-leeds"'));
 assert.ok(html.includes('Pizza Catering for Parties in Leeds'));
 for(const id of ['party-main','party-second','party-third'])assert.equal(PHOTO_SLOTS[id].page,'parties');
 assert.equal(PAGES.parties,'Private parties');
 assert.ok(JSON.parse(structuredData(pageForPath('/party-pizza-catering-leeds')))['@graph'].some(x=>x['@type']==='Service'));
});
test('saved photos replace their spaces, escape descriptions and can be cleared',()=>{
 const photos={'party-main':{photo:'data:image/jpeg;base64,YQ==',alt:'Guests <enjoying> pizza & "chatting"'},'party-second':{photo:'data:image/webp;base64,Yg==',alt:'Second'}};
 const html=partyPage(photos);
 assert.equal((html.match(/<img /g)||[]).length,2);assert.equal((html.match(/party-photo-empty/g)||[]).length,1);
 assert.ok(html.includes('alt="Guests &lt;enjoying&gt; pizza &amp; &quot;chatting&quot;"'));
 photos['party-main'].photo='';assert.equal((partyPage(photos).match(/<img /g)||[]).length,1);
});

test('initial supplied photo and caption remain editable and explicitly clearing it restores a blank space',()=>{
 const initial=partyPage();assert.ok(initial.includes('/assets/parties/trailer-at-your-door.jpg'));assert.ok(initial.includes('<figcaption>The trailer brought to your door</figcaption>'));
 const edited=partyPage({'party-main':{photo:'data:image/jpeg;base64,Yw==',alt:'Replacement',caption:'New caption'}});assert.ok(edited.includes('<figcaption>New caption</figcaption>'));assert.ok(!edited.includes('/assets/parties/trailer-at-your-door.jpg'));
 const cleared=partyPage({'party-main':{photo:'',alt:'',caption:''}});assert.ok(!cleared.includes('<img'));assert.ok(!cleared.match(/data-photo-slot="party-main"[\s\S]*?<\/figure>/)[0].includes('<figcaption>')); 
});
