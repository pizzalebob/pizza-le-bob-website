import {partyPage} from '../lib/party-page.js';
import {ORIGIN, SEARCH_PAGES, pageForPath, publicLink, structuredData} from '../lib/search-pages.js';
import {PHOTO_SLOTS} from '../assets/page-photo-config.js';
// Place the corporate package menus beside the event information.
const menuChoice = `
<div class="corporate-menu-choice" aria-label="Corporate menu packages" style="margin:26px 0 28px">
  <p style="color:var(--cream);font-size:0.95rem;margin-bottom:12px">You can choose which menu package you would like for your event from these two options.</p>
  <div style="display:flex;flex-wrap:wrap;gap:12px">
    <a href="/assets/menus/alegre-corporate-menu.pdf" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:var(--cream);border:1px solid rgba(248,244,234,0.55);padding:12px 16px;font-size:0.9rem;text-decoration:underline;text-underline-offset:3px">View Alegre Menu — £11 per head (PDF)</a>
    <a href="/assets/menus/premium-corporate-menu.pdf" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:var(--cream);border:1px solid rgba(248,244,234,0.55);padding:12px 16px;font-size:0.9rem;text-decoration:underline;text-underline-offset:3px">View Premium Menu — £12.50 per head (PDF)</a>
  </div>
</div>
`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}
function reviewCards(reviews) {
  return reviews.map(review => {
    const date = /^\d{4}-(0[1-9]|1[0-2])$/.test(review.date || '') ?
      new Intl.DateTimeFormat('en-GB', {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(review.date+'-01T12:00:00Z')) : '';
    const rating = Number.isInteger(review.rating) && review.rating>=1 && review.rating<=5 ? review.rating : 5;
    const stars = '<svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6L1.3 7.2l6.1-.6z"/></svg>'.repeat(rating);
    return '<div class="review-card" data-added-review><div class="review-stars" role="img" aria-label="'+rating+' out of 5 stars">'+stars+'</div><p style="white-space:pre-line">“'+escapeHtml(review.text)+'”</p><div class="review-meta"><span class="review-name">'+escapeHtml(review.name)+'</span><span class="review-date">'+escapeHtml(date)+'</span></div></div>';
  }).join('');
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  if (!['GET','HEAD'].includes(context.request.method)) return context.next();
  const cleanPath = path.replace(/\/$/, '') || '/';
  const page = pageForPath(cleanPath);
  if (path === '/index.html' || path === '/pizza-le-bob-final.html' || (page && path !== page.path)) {
    return Response.redirect(url.origin + (page?.path || '/') + url.search, 301);
  }
  if (!page) {
    const response = await context.next();
    // Pages otherwise falls back to the homepage for nonexistent URLs.
    if (response.headers.get('content-type')?.includes('text/html') && !path.startsWith('/admin'))
      return new Response('Page not found', {status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    return response;
  }
  const response = await context.next(new URL('/', url).href);
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  let reviews=[],pagePhotos={},galleryPhotos=[];
  try { const content=await context.env.CONTENT.get("public-content",{type:"json"}); if(Array.isArray(content?.reviews)) reviews=content.reviews; if(content?.pagePhotos) pagePhotos=content.pagePhotos; if(Array.isArray(content?.galleryPhotos)) galleryPhotos=content.galleryPhotos; } catch { /* Keep the existing reviews available if storage is unavailable. */ }
  const rewriter = new HTMLRewriter()
    .on('header.top', {element(element){if(page.section==='parties')element.after(partyPage(pagePhotos),{html:true});}})
    .on('#book .book-info-item:nth-child(2) h3', {element(element){element.setInnerContent('<a href="/party-pizza-catering-leeds" style="color:inherit;text-decoration:underline;text-underline-offset:4px">Corporate &amp; Private Parties</a>',{html:true});}})
    .on('#popup > .section-head h2', {element(element){element.setInnerContent('The weekly pop-up pizza takeaway in Morley');}})
    .on('#weddings > .section-head h2', {element(element){element.setInnerContent('Wedding Pizza Catering in Leeds');}})
    .on('#corporate > .section-head h2', {element(element){element.setInnerContent('Corporate Pizza Catering in Leeds');}})
    .on('#book > .section-head h2', {element(element){element.setInnerContent('Mobile Pizza Catering in Leeds');}})
    .on('#book .section-head', {element(element){element.append('<p>Based in Morley, Pizza le Bob brings authentic Neapolitan-style pizza to parties, weddings and corporate events in Leeds and nearby areas. Our mobile pizza trailer comes to your venue, with pizzas freshly prepared and cooked on site. Tell us your date, venue and guest numbers, and we’ll come back with availability and a tailored quote.</p>', {html:true});}})
    .on('title', {element(element){element.setInnerContent(page.title);}})
    .on('body', {element(element){element.setAttribute('data-page-section',page.section);}})
    .on('body > section', {element(element){
      const id=element.getAttribute('id');
      if(id!==page.section && !(page.section==='gallery' && id==='provenance')) element.remove();
    }})
    .on('.home-dates', {element(element){if(!['home','popup'].includes(page.section))element.setAttribute('hidden','');}})
    .on('a[href]', {element(element){const href=element.getAttribute('href');const next=publicLink(href);if(next!==href)element.setAttribute('href',next);}})

    .on('head link[rel="icon"], head link[rel="shortcut icon"], head link[rel="apple-touch-icon"], head link[rel="mask-icon"]', { element(element) { element.remove(); } })
    .on('head', { element(element) { element.append('<meta name="description" content="'+escapeHtml(page.description)+'"><link rel="canonical" href="'+ORIGIN+page.path+'"><link rel="icon" type="image/png" sizes="256x256" href="/assets/icons/pizza-le-bob-256.png?v=plb-logo-1"><link rel="shortcut icon" href="/favicon.ico?v=plb-logo-1"><link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png?v=plb-logo-1"><meta property="og:type" content="website"><meta property="og:site_name" content="Pizza le Bob"><meta property="og:title" content="'+escapeHtml(page.title)+'"><meta property="og:description" content="'+escapeHtml(page.description)+'"><meta property="og:url" content="'+ORIGIN+page.path+'"><script type="application/ld+json">'+structuredData(page)+'</script><style>#weddings .wedding-layout{align-items:start}</style><link rel="stylesheet" href="/assets/parties.css?v=20261026-reviews-1"><link rel="stylesheet" href="/assets/approved-presentation.css?v=20261026-menu-centre-4"><link rel="stylesheet" href="/assets/menu-presentation.css?v=20261021-1">', {html:true}); } })
    .on('body', { element(element) { element.append('<script src="/assets/visitor-tracking.js?v=20261026-routes-1" defer></script><script src="/assets/approved-presentation.js" defer></script><script src="/assets/menu-presentation.js?v=20261026-routes-1" defer></script>', {html:true}); } })
    .on('#privacy .wrap', { element(element) { element.append('<p>Cloudflare hosts this website and provides its privacy-focused Web Analytics. We also count page views to understand and improve the website. Our own counter sends only the page name and a random identifier for that single page view; it does not store a browser identifier, IP address, name, email or browsing history. Records retain only the page and date and cannot link your page views together. Repeat views count again. Counting runs without an acceptance prompt. You can turn it off using the button below, and we honour browser Do Not Track and Global Privacy Control signals for our own counter. We remember only your choice on this browser. Previous refusals remain respected and old browser identifiers are removed. Existing anonymous statistics remain. Google Fonts contacts Google. The embedded Google map loads only after you choose Enable Google map; Get directions opens Google Maps separately.</p>', {html:true}); } })
    .on('header #navLinks', { element(element) { element.setInnerContent("<a href=\"/\">Home</a><a href=\"/pizza-menu\">Menu</a><a href=\"/our-story\">Our Story</a><a href=\"/wedding-pizza-catering-leeds\">Weddings</a><a href=\"/corporate-pizza-catering-leeds\">Corporate</a><a href=\"/pizza-takeaway-morley\">Pop-up</a><a href=\"/gallery\">Gallery</a><a href=\"/reviews\">Reviews</a><a href=\"/party-pizza-catering-leeds\">Parties</a><a href=\"/mobile-pizza-catering-leeds\">Book your event</a>", {html:true}); } })
    .on('#menu .section-head p', { element(element) { element.setInnerContent("Authentic 12\" Neapolitan-style pizzas - made to order"); } })
    .on('#popup .section-head p', { element(element) { element.setInnerContent("Find the trailer parked up at the Gardeners Arms in Morley (see map below) - currently firing up most Friday and Saturday evenings. Always check the banner above for confirmed dates. \u2014 no booking required, though pre-ordering means you won't miss out. Click on the menu button above to see the current menu and this week's special."); element.after("<div class=\"popup-how-it-works\" style=\"margin-top:24px\"><p style=\"color:var(--cream);margin-top:0\"><strong>So how does it work?</strong></p><p>Most people pre-order using WhatsApp and collect their pizzas to take home without having to wait. Others also turn up at the trailer, order and then go and have a drink in the pub. (or the Beer Garden in good weather) They receive a buzzer which tells them when their order is ready. Customers are welcome to eat their pizza in the pub for the full dine-in experience! When customers order on WhatsApp they pay on collection - cash or card. Customers ordering at the trailer pay when ordering.</p></div>", {html:true}); } })
    .on("#reviews .reviews-masonry", { element(element) { if(reviews.length) element.prepend(reviewCards(reviews), {html:true}); } })
    .on("#reviews .reviews-intro p", { element(element) { if(reviews.length) element.setInnerContent("Customer reviews — from birthday parties to weddings to community events."); } })
    .on(".corporate-copy > p:first-child", {
      element(element) { element.setInnerContent("Whether you're treating your staff or sharing an occasion with clients, proper Italian pizza never fails to impress. Restaurant quality pizzas cooked onsite with authentic Italian ingredients."); }
    })
    .on(".corporate-copy .corporate-menu-choice", { element(element) { element.remove(); } })
    .on('.corporate-copy a[href="#corporate-form"]', {
      element(element) { element.before(menuChoice, { html: true }); }
    })
    .on("#corporate-form .corporate-menu-links", { element(element) { element.remove(); } })
    ;
  const selectors=[...new Set(Object.values(PHOTO_SLOTS).map(slot=>slot.selector))];
  for(const selector of selectors){
    let index=0;
    rewriter.on(selector,{element(element){
      const currentIndex=index++;
      const entry=Object.entries(PHOTO_SLOTS).find(([,slot])=>slot.selector===selector&&slot.index===currentIndex);
      if(!entry)return;
      const item=pagePhotos[entry[0]];
      if(!item)return;
      if(item.photo)element.setAttribute('src',item.photo);
      if(typeof item.alt==='string')element.setAttribute('alt',item.alt);
    }});
  }
  rewriter.on('#weddings .wedding-inline-photo figcaption',{element(element){const caption=pagePhotos['wedding-venue']?.caption;if(typeof caption==='string')element.setInnerContent(caption);}});
  rewriter.on('#weddings .wedding-photo-stack',{element(element){
    const item=pagePhotos['wedding-extra'];
    if(item?.photo)element.append('<div class="wedding-extra-photo" style="margin-top:20px"><img src="'+escapeHtml(item.photo)+'" alt="'+escapeHtml(item.alt||'')+'" style="display:block;width:100%;height:auto;border-radius:12px"></div>',{html:true});
  }});
  rewriter.on('#gallery .gallery-grid',{element(element){
    if(galleryPhotos.length)element.append(galleryPhotos.map(item=>'<div class="gallery-item" data-added-gallery><img src="'+escapeHtml(item.photo)+'" alt="'+escapeHtml(item.alt||'')+'" loading="lazy"></div>').join(''),{html:true});
  }});
  const updated=rewriter.transform(response);
  updated.headers.delete("content-length");
  updated.headers.delete("etag");
  updated.headers.set("Cache-Control","no-store");
  return updated;
}
