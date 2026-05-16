# Market Activation Sprint

Production crawl, indexing, and observability for EVSavari.

## Sitemap architecture

| File | Contents |
|------|----------|
| `/sitemap.xml` | Sitemap index |
| `/sitemaps/static.xml` | Home, `/cars`, about, contact, privacy |
| `/sitemaps/cars.xml` | Vehicle detail `/cars/{slug}` (excludes reserved SEO slugs) |
| `/sitemaps/seo-pages.xml` | Programmatic decision pages |
| `/sitemaps/compare.xml` | Compare hub `/compare` |

Generate before deploy:

```bash
cd zyvev-backend
node scripts/build-sitemaps.mjs
```

Or from frontend: `npm run build:sitemaps` (included in `npm run build`).

## robots.txt

Generated alongside sitemaps. Blocks admin/sales/dealer paths, `/*?*` query traps, legacy `/car/`, and `/seo-data/`.

## Audits & health

```bash
node scripts/audit-canonical-seo.js
node scripts/audit-production-readiness.js
node scripts/report-platform-health.js
```

## Search Console readiness (manual)

1. Verify domain in Google Search Console / Bing Webmaster
2. Submit `https://evsavari.com/sitemap.xml`
3. Inspect sample URLs: vehicle detail, SEO guide, `/compare`
4. Confirm canonical and FAQ rich results in URL inspection

No external API integration in codebase yet.

## Staging validation

1. `curl https://<preview>/sitemap.xml` — XML index
2. `curl https://<preview>/robots.txt` — Sitemap directive present
3. View source on detail + SEO pages — `Vehicle` / `FAQPage` / `BreadcrumbList` JSON-LD
4. Run `audit-production-readiness.js` — `ready: true`

## Rollback

Revert `public/sitemap*.xml` and `robots.txt` from git; redeploy. Crawlers will use previous files until recrawl.
