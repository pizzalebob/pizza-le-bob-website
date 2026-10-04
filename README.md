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


## Visitor Statistics

The existing editor now includes a private Visitor Statistics tab. It uses the
existing `CONTENT` KV binding and the same signed, owner-only Cloudflare Access
JWT verification as content saves. No extra secrets, ChatGPT service, or new
subscription is needed. Keep Access protection on `/admin/*` on every hostname.
The existing Cloudflare Pages Web Analytics beacon is preserved. Its Visits
metric is not treated as unique people, and its historical data is not imported.

Optional first-party analytics starts only after the visitor chooses Allow
analytics. The browser keeps a random UUID in localStorage; the collector stores
its SHA-256 hash, the named section, UK Monday week and receipt timestamp.
No IP address, user-agent, enquiry data, name or email is written into events.
Declining, DNT and GPC prevent collection. Choices can be changed on Privacy.
Counts represent consenting browsers, not identified people. Different devices,
cleared storage or new consent can create another unique visitor. No historical
figures are invented. Overall uniques are deduplicated across pages and weeks.

Each view has an independent immutable KV key under `visitor-statistics:v1:`;
concurrent views never update a shared counter. The private read endpoint lists
metadata in cursor-paginated batches. The editor follows all batches before
showing totals, and shows an error instead of partial totals if any batch fails.
KV propagation may delay new views by about a minute. Statistics never modify
`public-content` or the existing dates/menu/reviews data. Editor visits are not
tracked. The collector has origin, size, type, known-page and consent checks,
basic bot filtering and a bounded per-isolate burst guard.

Cloudflare's account-level KV quotas apply (one write per consenting page view;
one list per 1,000 views per refresh). This event log suits a small business site.
A high-volume site should migrate analytics to a dedicated database and stronger
edge rate limiting; the burst guard is not a global rate limiter. Storage or
quota failures do not block public browsing, and unavailable statistics never
appear as invented zero totals. Long-term events persist while the KV namespace
is retained. Cancelling ChatGPT does not delete these GitHub/Cloudflare files.

Run server security/collection tests with Node 22+:
`node --test tests/visitor-statistics.test.mjs`.
