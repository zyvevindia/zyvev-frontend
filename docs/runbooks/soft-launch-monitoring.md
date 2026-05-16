# Soft-Launch Monitoring Runbook

Real-world validation rhythm after controlled launch.

## Daily checks (5–10 min)

- [ ] Site loads: `/`, `/cars`, 1 vehicle URL
- [ ] Lead form submit (or verify last 24h leads in admin)
- [ ] API/error logs — no spike in 5xx
- [ ] If incident: [deploy-rollback](./deploy-rollback.md)

```bash
cd zyvev-backend
npm run validate:production
```

## Weekly SEO checks

- [ ] GSC Performance export → `ops/traffic-observations.jsonl`
- [ ] GSC Coverage — indexed vs last week
- [ ] `npm run ops:crawl`
- [ ] `npm run ops:seo`
- [ ] URL inspection: 1 vehicle + 1 SEO guide
- [ ] Sitemap status **Success** in GSC

## Crawl-error checks

- [ ] GSC indexing errors bucket review
- [ ] `npm run validate:real-world`
- [ ] Orphans in crawl report — document hub `/cars`, `/compare` if expected

## Lead-quality checks (if DB live)

```bash
npm run ops:lead-validation -- 7
npm run ops:continuity -- --db
```

- [ ] `sourcePageCoverage` trending up
- [ ] No PII in intent context gaps
- [ ] Compare-assisted vs SEO-originated mix noted for dealers

## Behavioral quality (if enabled)

```bash
npm run ops:behavioral-quality -- 7
```

- [ ] Compare completion rate stable or improving
- [ ] SEO→compare progression documented for content ops

## Dealer-feedback checks

- [ ] Collect pilot dealer notes → `ops/dealer-feedback.jsonl`
- [ ] `node scripts/report-dealer-pilot.js 7` for aggregated summary
- [ ] Response-time observations recorded

## Validation dashboard

```bash
npm run ops:validation-dashboard -- --db
# or GET /api/admin/ops/validation-summary?days=7
```

## Rollback triggers

| Signal | Action |
|--------|--------|
| Canonical errors after deploy | Revert routing/SEO commit; rebuild sitemaps |
| Sitemap 404 | Redeploy last good `public/sitemap*.xml` |
| Lead API down | Rollback API; verify CRM queue |
| PII in intent context audit | Disable behavioral attach; privacy review |
| Indexed −20% WoW | Pause new SEO publishes; SEO incident runbook |

## Escalation

1. **L1 ops** — runbooks, CLI reports, flag toggles  
2. **L2 engineering** — routing, API, data fixes  
3. **Privacy** — any PII in behavioral/intent payloads  

## Related docs

- [../production-validation/](../production-validation/)
- [../search-console-operations/](../search-console-operations/)
- [../real-world-validation.md](../real-world-validation.md)
