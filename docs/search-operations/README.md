# Search & Index Operations

Operational playbook for EVSavari controlled launch. Complements [search-console-readiness](../market-activation/search-console-readiness.md) with day-to-day workflows.

## Quick reference

| Task | Command / action |
|------|------------------|
| SEO ops report | `node scripts/report-seo-operations.js` (backend) |
| Rebuild sitemaps | `node scripts/build-sitemaps.mjs` (backend) |
| Canonical audit | `node scripts/audit-canonical-seo.js` |
| Crawl simulation | `node scripts/audit-crawl-simulation.js` |
| GSC readiness | `node scripts/validate-search-console-readiness.js` |

## Google Search Console verification

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://evsavari.com` (domain or URL-prefix).
3. Verify using one of:
   - **DNS TXT** (recommended for domain property)
   - **HTML file** in `public/` (if already used for other tools)
   - **Google Analytics** (only if same account and property linked)
4. Confirm ownership shows **Verified** before sitemap submission.
5. Record verification date in your launch log.

## Bing Webmaster verification

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add site `https://evsavari.com`.
3. Import from GSC if available, or verify via DNS/HTML.
4. Submit the same sitemap URL as GSC.

## Sitemap submission

**URL:** `https://evsavari.com/sitemap.xml`

After every catalog or SEO registry change:

```bash
cd zyvev-backend
node scripts/build-sitemaps.mjs
# Deploy frontend so public/sitemap*.xml updates
```

In GSC: **Sitemaps** → add `sitemap.xml` → confirm **Success** (not “Couldn’t fetch”).

Child sitemaps live under `/sitemaps/{static,cars,seo-pages,compare}.xml`.

## URL inspection workflow

Use when a strategic URL is not indexed or shows wrong canonical.

1. GSC → **URL inspection** → paste full URL.
2. Check:
   - **URL is on Google** vs **URL is not on Google**
   - **User-declared canonical** vs **Google-selected canonical**
   - **Crawled as** (should not be blocked by robots)
3. Request indexing only for:
   - New Tier-1 vehicles
   - New SEO guide slugs
   - Fixed canonical regressions  
   Avoid mass “Request indexing” — use sitemap refresh instead.

**Sample URLs to spot-check weekly:**

| Type | Example |
|------|---------|
| Vehicle | `/cars/tata-nexon-ev-empowered-lr` |
| SEO guide | `/cars/best-evs-for-city-driving` |
| Compare | `/compare` |
| Hub | `/cars` |

## Indexing diagnostics workflow

1. Run `node scripts/report-seo-operations.js` — note `crawlableUrls`, `orphanCount`, `sitemapFreshness`.
2. Run `node scripts/audit-canonical-seo.js` — zero errors before deploy.
3. GSC **Pages** → Indexed vs Not indexed — bucket reasons:
   - Duplicate / alternate canonical
   - Crawled — currently not indexed
   - Discovered — not crawled
4. For **Crawled — not indexed**: improve internal links from `/cars`, related SEO guides, compare hub.
5. For **Duplicate**: run canonical audit; ensure `/car/*` redirects to `/cars/*`.
6. Document findings in weekly ops notes (no PII).

See [indexing-failures.md](./indexing-failures.md) and [canonical-troubleshooting.md](./canonical-troubleshooting.md).

## Crawl monitoring guidance

- **robots.txt** blocks admin, dealer, query strings, legacy `/car/`, raw `/seo-data/`.
- **Sitemap manifest** age: stale if &gt; 7 days without catalog change — still rebuild on deploy.
- Watch GSC **Crawl stats** for spike in 404s after routing changes.
- SPA note: crawlers rely on sitemap + JSON-LD; if soft 404 appears, verify Vercel serves `sitemap.xml` as static file before SPA rewrite.

## Related docs

- [indexing-failures.md](./indexing-failures.md)
- [canonical-troubleshooting.md](./canonical-troubleshooting.md)
- [sitemap-refresh.md](./sitemap-refresh.md)
- [crawl-monitoring.md](./crawl-monitoring.md)
