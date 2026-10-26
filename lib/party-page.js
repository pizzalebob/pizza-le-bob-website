import {PHOTO_SLOTS} from '../assets/page-photo-config.js';
function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function partyPage(pagePhotos={}){
 const photos=['party-main','party-second','party-third'].map((id,index)=>{
  const slot=PHOTO_SLOTS[id];
  const item=pagePhotos[id]||{photo:slot.defaultPhoto||'',alt:slot.alt,caption:slot.caption||''};
  return `<figure class="party-photo ${index===0?'party-photo-main':''}" data-photo-slot="${id}"${item.photo?'':' aria-hidden="true"'}><div class="party-photo-frame ${item.photo?'':'party-photo-empty'}">${item.photo?`<img src="${escape(item.photo)}" alt="${escape(item.alt||'')}" loading="${index===0?'eager':'lazy'}">`:''}</div>${item.photo&&item.caption?`<figcaption>${escape(item.caption)}</figcaption>`:''}</figure>`;
 }).join('');
 return `<section id="parties">
 <div class="section-head wrap"><h2>Pizza Catering for Parties in Leeds</h2></div>
 <div class="party-layout wrap"><div class="party-copy">
 <p>Planning a birthday, garden party, anniversary or family celebration? Pizza le Bob brings freshly cooked Neapolitan-style pizza to your venue in Morley, Leeds and nearby areas.</p>
 <p>Our mobile pizza trailer makes the food part of the occasion, with pizzas prepared and cooked on site for your guests.</p>
 <p>From familiar favourites to something a little different, <a href="/pizza-menu">explore our menu</a> and tell us what you have in mind for your celebration.</p>
 <p>Send us your party date, venue and approximate guest numbers. We’ll check availability and come back with a tailored quote.</p>
 <a class="btn btn-primary" href="/mobile-pizza-catering-leeds">Check availability for your party</a>
 </div><div class="party-photos">${photos}</div></div></section>`;
}
