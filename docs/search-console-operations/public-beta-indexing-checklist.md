# Search Console — Controlled Public Beta Indexing

## Pre-submit

1. Run `npm run ops:search-console` (backend) — canonical + structured data + sitemap checks.
2. Run `node scripts/build-sitemaps.mjs` after any catalog or SEO registry change.
3. Confirm `robots.txt` allows `/` and blocks `/admin`, `/sales`, `/*?*`.

## Google Search Console

1. Verify domain property for production origin.
2. Submit `https://evsavari.com/sitemap.xml`.
3. URL inspection: one vehicle (`/cars/tata-nexon-ev-creative-plus`), one SEO guide (`/cars/best-evs-for-apartment-living`), `/compare`.
4. Monitor Coverage → excluded pages for query-parameter duplicates.
5. Monitor Enhancements → structured data (Vehicle, FAQ where present).

## Bing Webmaster Tools

1. Add site and verify ownership.
2. Submit same sitemap URL.
3. Use URL inspection for homepage and one decision guide.

## Post-beta (weekly)

- Sitemap lastmod freshness (< 7 days after catalog deploy).
- Orphan report from `npm run ops:seo` (`/cars`, `/compare` are intentional hubs).
- No indexation of `/seo-data/` JSON (blocked in robots).
