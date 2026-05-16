# Runbook: SEO Issue Response

## Triage (15 min)

1. `node scripts/report-seo-operations.js`
2. `node scripts/audit-canonical-seo.js`
3. GSC → Pages / URL inspection for reported URL
4. Classify: canonical | sitemap | orphan | soft-404 | collision

## Playbooks

| Class | Action |
|-------|--------|
| Canonical | [canonical-troubleshooting](../search-operations/canonical-troubleshooting.md) |
| Sitemap | [sitemap-rebuild](./sitemap-rebuild.md) |
| Orphan | Add internal links; `audit-crawl-simulation.js` |
| Soft 404 | Verify slug + JSON-LD + static SEO JSON |
| Slug collision | Sync SEO registry + frontend slugs |

## Communication

- Do not mass-request indexing
- Document fix deploy time for re-check in 48–72h

## Escalation

If indexed count drops &gt; 20% WoW after deploy → hold further SEO content publishes until stable.
