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
  const response = await context.next();
  const path = new URL(context.request.url).pathname;
  if (context.request.method !== "GET" ||
      !["/", "/index.html"].includes(path) ||
      !response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }
  let reviews=[];
  try { const content=await context.env.CONTENT.get("public-content",{type:"json"}); if(Array.isArray(content?.reviews)) reviews=content.reviews; } catch { /* Keep the existing reviews available if storage is unavailable. */ }
  const updated = new HTMLRewriter()
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
    .transform(response);
  updated.headers.delete("content-length");
  updated.headers.delete("etag");
  updated.headers.set("Cache-Control","no-store");
  return updated;
}
