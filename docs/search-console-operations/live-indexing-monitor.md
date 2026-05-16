# Live Indexing Monitor

Operational view for **real** indexing after production deploy — not vanity rankings.

## Automated baseline

```bash
cd zyvev-backend
npm run ops:seo
npm run ops:search-console
```

## GSC fields to record (weekly)

| Field | What to note |
|-------|----------------|
| Indexed | Count trend vs prior week |
| Not indexed | Sample 3 URLs — reason in inspection tool |
| Excluded — duplicate | Canonical target correct? |
| Excluded — crawled not indexed | Quality / thin content check |
| Sitemap | Last read date, discovered URLs |
| Enhancements | Vehicle / FAQ errors |

## Bing Webmaster

- Indexed pages estimate  
- Sitemap status  
- URL inspection on 1 new SEO guide if added  

## Internal cross-checks

| Check | Pass |
|-------|------|
| Sitemap URL count = ops:seo totalUrls | ☐ |
| No `/admin` or `/seo-data/` in indexed sample | ☐ |
| Vehicle canonical = `/cars/:slug` | ☐ |
| Compare hub `/compare` intentional | ☐ |

## Crawl anomalies → actions

| Symptom | Action |
|---------|--------|
| Query-string URLs indexed | Verify `Disallow: /*?*` in robots |
| Wrong canonical | Fix registry + redeploy |
| Sitemap 404 | Re-run `build-sitemaps.mjs` + deploy |
| Structured data errors | `node scripts/audit-structured-data.js` |

## Escalation

See [indexing-diagnostics-runbook.md](./indexing-diagnostics-runbook.md).
