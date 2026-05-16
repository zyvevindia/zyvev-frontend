# Canonical Mismatch Handling

## Detection

- GSC URL inspection: user vs Google canonical differ
- `npm run ops:seo` → `canonicalConsistency.errors` &gt; 0
- `npm run ops:crawl` → canonical observations

## Fix order

1. `node scripts/audit-canonical-seo.js` — identify slug/path
2. Fix `vehicleRoutes` / page Helmet canonical / SEO registry
3. Rebuild sitemaps if URLs changed
4. Deploy
5. Request indexing **only** for fixed URLs

## Common causes

- Legacy `/car/` still linked internally
- SEO slug collides with vehicle slug
- Wrong `siteOrigin` in build env

See also [../search-operations/canonical-troubleshooting.md](../search-operations/canonical-troubleshooting.md).
