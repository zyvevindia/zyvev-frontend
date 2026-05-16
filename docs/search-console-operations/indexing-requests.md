# Indexing Request Workflow

Use sparingly — prefer sitemap refresh for bulk updates.

## Eligible URLs

- Brand-new vehicle slug (first publish)
- New SEO guide slug (first publish)
- URL fixed after canonical or 404 regression

## Procedure

1. Confirm `validate:production` and canonical audit pass
2. GSC URL inspection → **Request indexing**
3. Log URL + date in ops notes
4. Re-check in 3–7 days

## Not eligible

- Entire catalog refresh (use sitemap)
- URLs with open canonical mismatches
- Query-string or legacy `/car/` URLs

## Bulk changes

1. `node scripts/build-sitemaps.mjs`
2. Deploy
3. GSC → Sitemaps → resubmit `sitemap.xml` only
