# Sitemap Refresh Procedures

## When to rebuild

- New Tier-1 variant added
- SEO guide slug added to registry
- Compare hub URL structure change
- `siteOrigin` or path convention change
- Weekly deploy during active launch (even if no catalog change — refreshes `lastmod`)

## Procedure

```bash
cd zyvev-backend
node scripts/build-sitemaps.mjs
```

Outputs to `zyvev-frontend/public/`:

- `sitemap.xml` (index)
- `sitemaps/static.xml`, `cars.xml`, `seo-pages.xml`, `compare.xml`
- `sitemap-manifest.json` (freshness metadata for ops reports)

## Deploy

1. Commit updated XML files with frontend deploy (or CI artifact).
2. Verify locally: open `/sitemap.xml` in browser after deploy.
3. GSC → Sitemaps → confirm last read date updates (may take 24–48h).

## Validation

```bash
node scripts/report-seo-operations.js
node scripts/validate-search-console-readiness.js
```

Check:

- `sitemapFreshness.status` = `ok`
- `crawlableUrlCounts.totalUrls` matches expectation
- `orphanDetection.orphanCount` = 0 or documented exceptions

## Safe rollback

If sitemap deploy breaks crawl:

- Redeploy previous `public/sitemap*.xml` from last known good build.
- Do not remove `robots.txt` Sitemap directive.
