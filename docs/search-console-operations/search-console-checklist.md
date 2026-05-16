# Google Search Console — readiness checklist

Use before and after each production deploy that touches SEO routes, sitemaps, or canonicals.

**Automated pre-flight:** `npm run gsc:verify` (robots, sitemap index, discovery URL hygiene, canonical map).

**Property:** [Google Search Console](https://search.google.com/search-console) → `https://evsavari.com`

---

## 1. Property & verification

- [ ] Domain or URL-prefix property verified for `evsavari.com`
- [ ] HTTPS preferred domain matches live site (`https://evsavari.com`)
- [ ] No conflicting `www` vs apex redirects (apex is canonical)

## 2. robots.txt

Live URL: `https://evsavari.com/robots.txt`

- [ ] `User-agent: *` with `Allow: /`
- [ ] Admin/CRM paths disallowed: `/admin`, `/sales`, `/dealer`, `/login`, `/kanban`
- [ ] **No** blanket `Disallow: /*?*` (blocks `?variant=` on family pages)
- [ ] `Allow: /*?variant=` present for trim selection
- [ ] Compare query traps blocked: `/compare?`, `/*?cars=*`
- [ ] Tracking params discouraged: `utm_`, `fbclid`, `gclid`, `debug`, `ref`
- [ ] `/seo-data/` disallowed (static JSON, not HTML)
- [ ] `Sitemap: https://evsavari.com/sitemap.xml` at bottom
- [ ] Regenerate via `npm run build:sitemaps` after changes (do not hand-edit in prod without syncing generator)

## 3. Sitemap index

Live URL: `https://evsavari.com/sitemap.xml`

- [ ] Index lists four child sitemaps:
  - `sitemaps/static.xml`
  - `sitemaps/cars.xml` (tier-1 **family** slugs only)
  - `sitemaps/seo-pages.xml` (discovery guides, cities, compares)
  - `sitemaps/compare.xml` (`/compare` hub)
- [ ] Submit sitemap URL in GSC → **Sitemaps** → Add `https://evsavari.com/sitemap.xml`
- [ ] After content batch: confirm **Discovered URLs** count increased (expect 120+ discovery URLs)
- [ ] No legacy `/cars/{seo-guide-slug}` URLs in `seo-pages.xml`
- [ ] No `?variant=` or `?cars=` URLs in any sitemap file

## 4. Canonical consistency

- [ ] Legacy guides at `/cars/{slug}` render with `<link rel="canonical">` → discovery path (e.g. `/best-evs/city-driving`)
- [ ] Vehicle detail canonical = family URL only (`/cars/tata-nexon-ev`), not variant slug
- [ ] Compare SEO pages canonical = `/compare/{slug}`, not `/compare?cars=`
- [ ] City pages canonical = `/cities/{city}/evs` or `/charging`
- [ ] Run `npm run seo:qa` — 0 errors on duplicate canonicals / titles / H1s

## 5. Indexing requests (priority URLs)

After deploy, use **URL Inspection** → **Request indexing** for:

1. `https://evsavari.com/guides`
2. Top 5 city EV pages (e.g. Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune)
3. Top 3 compare guides (Nexon vs ZS EV, Comet vs Tiago, one new pair)
4. 2–3 new best-evs / ownership guides from latest content batch
5. Tier-1 family pages with major catalog updates

See [indexing-requests.md](./indexing-requests.md).

## 6. Structured data

- [ ] Spot-check Article / FAQ / Breadcrumb JSON-LD on a guide page (View Source)
- [ ] Spot-check Product schema on a family detail page
- [ ] GSC → **Enhancements** → no new critical errors after deploy

## 7. Post-submit monitoring (week 1)

See [indexing-monitoring-checklist.md](./indexing-monitoring-checklist.md).

---

## Related

- [indexing-monitoring-checklist.md](./indexing-monitoring-checklist.md)
- [sitemap-refresh.md](./sitemap-refresh.md)
- [canonical-mismatches.md](./canonical-mismatches.md)
- [../runbooks/sitemap-rebuild.md](../runbooks/sitemap-rebuild.md)
