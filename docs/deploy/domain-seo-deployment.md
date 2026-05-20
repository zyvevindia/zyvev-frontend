# Domain + SEO deployment readiness

## Canonical domain

- **Primary**: apex `https://evsavari.com` (matches `APP_CONFIG.domain` / sitemap generator origin).
- **www**: Configure **301** from `https://www.evsavari.com` → `https://evsavari.com` at DNS or CDN (Vercel redirect rule). Pick **one** canonical; GSC property should match (URL-prefix recommended).

## HTTPS

- Enforce HTTPS at the edge (Vercel default). No mixed content: `VITE_API_URL` must be `https://`.

## Files that must be publicly accessible

| Path | Check |
|------|--------|
| `/robots.txt` | `200`, contains `Sitemap:` |
| `/sitemap.xml` | `200`, valid sitemap index |
| `/sitemaps/*.xml` | Child sitemaps referenced from index |
| `/seo-data/*.json` | Used by SEO routes (even if `robots` disallows crawling of `/seo-data/`, the **app** fetches JSON client-side — CDN must still **serve** them **200** for the SPA) |

> Note: `robots.txt` may `Disallow: /seo-data/` for **crawlers**; that does not remove the need for browsers to load JSON. Ensure CDN does not block public GETs.

## Compare URL stability

- Editorial compare guides: `/compare/:slug` (shareable).
- Avoid changing slug scheme without redirects; old URLs should **301** to new canonical compares if renamed.

## DNS / domain validation checklist

- [ ] [H] Apex `A` / `ALIAS` → Vercel as per host instructions
- [ ] [H] `www` CNAME → Vercel **or** apex-only with redirect from `www` (see `vercel.json`)
- [ ] [H] TLS certificate active for **both** hosts tested if `www` still resolves
- [ ] `curl -sI https://evsavari.com/` → `200`, `location` chain does not bounce to HTTP

## Post-DNS checklist

1. `curl -sI https://evsavari.com/robots.txt` → `200`
2. `curl -sI https://evsavari.com/sitemap.xml` → `200`
3. `npm run gsc:verify` on a build machine with fresh `public/`
4. GSC: submit `https://evsavari.com/sitemap.xml` once per property
5. `EVSAVARI_SITE_ORIGIN=https://evsavari.com npm run deploy:smoke`

## GSC submission checklist

- [ ] Property type matches how you serve (URL-prefix `https://evsavari.com/` recommended)
- [ ] Ownership verification complete
- [ ] Sitemap submitted; no typos in URL (HTTPS)
- [ ] **Sitemaps** report: “Success” after fetch (allow 24–48h)

## Post-deploy indexing checklist (first week)

- [ ] **Pages** report: monitor errors (5xx, soft 404)
- [ ] **Removals** / manual actions: none unless legal requirement
- [ ] Compare + discovery sample URLs: “URL is on Google” or valid “Crawled — currently not indexed” with reason reviewed
- [ ] No accidental `noindex` on homepage (also checked by `deploy:smoke` response headers)

## SEO validation notes

- Run `npm run seo:qa` in CI (already part of `post-launch:smoke`).
- After deploy, spot-check one discovery URL and one compare URL in **incognito** (no service worker/cache from dev).
