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
 </div><div class="party-photos">${photos}</div></div>
 <div class="party-reviews wrap" aria-labelledby="party-reviews-title">
 <h3 id="party-reviews-title">Happy guests, happy hosts</h3>
 <p class="party-reviews-intro">Recommendations shared by our customers on Facebook.</p>
 <div class="party-review-grid">
 <figure class="party-review"><blockquote>We used Pizza le Bob to cater for my 30th birthday party and I couldn’t have been happier. From the start, Bob was super reliable and flexible with our order, and the price was very fair. He arrived exactly when he said he would, and the pizzas were absolutely delicious – so many of our guests commented on how great they tasted. They were a massive hit and I would wholeheartedly recommend him for any event.</blockquote><figcaption><strong>Benji Chandra</strong><span>30th birthday party · Facebook recommendation</span></figcaption></figure>
 <figure class="party-review"><blockquote>Bob catered our children’s joint birthday party in April for over 80 people (adults &amp; children), and it was by far the biggest hit of the day! Everyone raved about how delicious the food was and how it was “the best kids party food they’ve ever had!” and we couldn’t agree more! Bob and his team’s communication, organisation, quality, and delivery was brilliant from start to finish. He delivered the quantity and timings of the food perfect, despite such a big event. We would highly recommend Bob and his pizzas for any occasion- big or small.</blockquote><figcaption><strong>Devin Kelly Grainey</strong><span>Children’s joint birthday party · Facebook recommendation</span></figcaption></figure>
 </div>
 <div class="party-review-action"><a class="btn btn-primary party-facebook-reviews" href="https://www.facebook.com/profile.php?id=61562747025862&amp;sk=reviews" target="_blank" rel="noopener noreferrer">Read more reviews</a><a class="btn btn-primary" href="/mobile-pizza-catering-leeds">Check availability for your party</a></div>
 </div></section>`;
}
