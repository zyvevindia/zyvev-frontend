# Indexing Diagnostics Runbook

## Symptoms → checks

| Symptom | Check |
|---------|--------|
| Pages not indexed | URL inspection; robots.txt; canonical tag on live HTML |
| Duplicate URLs | Canonical audit: `node scripts/audit-canonical-seo.js` |
| Soft 404 on SPA routes | Ensure prerender or SSR meta for `/cars/:slug` |
| Structured data errors | `node scripts/audit-structured-data.js` |
| Sitemap rejected | Validate XML; confirm 52 URLs match manifest |

## Commands (backend repo)

```bash
npm run ops:seo
npm run ops:search-console
node scripts/audit-soft-launch-readiness.js
npm run ops:public-beta
```

## Safe indexing scope for beta

- Vehicle detail pages (Tier-1 on-sale)
- SEO decision guides under `/cars/:seo-slug`
- Static: `/`, `/cars`, `/compare`, about/contact/privacy
- **Exclude:** admin, sales, dealer, raw `/seo-data/`
