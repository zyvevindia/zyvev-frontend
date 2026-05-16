# Sitemap Refresh Workflow (GSC)

## Trigger

- Tier-1 catalog change
- SEO registry slug added/removed
- Post-deploy validation

## Steps

1. Backend: `node scripts/build-sitemaps.mjs`
2. Deploy frontend `public/sitemap*.xml`
3. `npm run validate:production`
4. GSC → **Sitemaps** → submit `https://evsavari.com/sitemap.xml`
5. Wait 24–48h; confirm status **Success**
6. `npm run ops:crawl` — verify freshness `ok`

## Failure: Couldn't fetch

- Verify static XML not rewritten to SPA (Vercel headers)
- `curl -I` must return 200 + XML content-type
