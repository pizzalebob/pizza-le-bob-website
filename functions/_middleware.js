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

export async function onRequest(context) {
  const response = await context.next();
  const path = new URL(context.request.url).pathname;
  if (context.request.method !== "GET" ||
      !["/", "/index.html"].includes(path) ||
      !response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }
  const updated = new HTMLRewriter()
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
  return updated;
}
