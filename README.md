# Pizza le Bob public website and phone editor

This is the prepared Cloudflare Pages project. `index.html` is the public site; `admin/index.html` is the phone editor. The Pages Functions in `functions/api` serve public content and handle protected edits.

Use Git integration or Wrangler deployment. Cloudflare's dashboard drag-and-drop Direct Upload does **not** deploy Pages Functions.

Before putting this site live:
1. Create a Cloudflare Pages project from this folder/repository (no build command; output directory is the project root), or deploy with Wrangler.
2. Create a Workers KV namespace and bind it as `CONTENT` for production and preview environments.
3. Configure Cloudflare Access self-hosted apps for **both** `/admin/*` on the final domain, allowing only the owner's verified email. Also protect equivalent paths on the `pages.dev` hostname if it remains reachable. Keep `/api/content` public.
4. Verify an unauthenticated PUT to `/admin/api/content` is blocked and an authenticated save updates the public site.
5. Add the domain in Pages > Custom domains. For an apex domain, add the domain to Cloudflare and set its assigned nameservers at Namecheap. Copy existing DNS records, especially MX/SPF/DKIM/DMARC, before changing nameservers so email keeps working.
6. Add `www` as another custom domain or redirect it to the apex as desired.

The site currently generates the next four Saturdays by default. Once the editor saves a schedule, only its confirmed upcoming dates appear. The menu special updates from the same content endpoint.

Set Pages environment variables `ACCESS_TEAM_DOMAIN` (e.g. team.cloudflareaccess.com), `ACCESS_AUD` (Access application audience tag), and `OWNER_EMAIL` (the single authorised email). The write endpoint validates the signed Access JWT, audience, issuer, expiry and owner email.
