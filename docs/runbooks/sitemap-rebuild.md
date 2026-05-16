# Runbook: Sitemap Rebuild

**When:** Catalog/SEO change, weekly active launch deploy, or GSC sitemap errors.

## Steps

1. `cd zyvev-backend && node scripts/build-sitemaps.mjs`
2. `node scripts/audit-canonical-seo.js` — exit 0
3. `node scripts/report-seo-operations.js` — check `health`
4. Deploy frontend `public/sitemap*.xml`
5. Verify `curl -I https://evsavari.com/sitemap.xml`
6. GSC → resubmit sitemap if needed

## Rollback

Redeploy previous commit’s `public/sitemap*.xml` only.

## Time

~2–5 minutes + deploy pipeline.
