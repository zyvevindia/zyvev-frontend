# Daily Live Ops Workflow

**Cadence:** Once per day during Week 1 (10–15 minutes)

## Single command

```bash
cd zyvev-backend
npm run ops:daily-live-ops -- --db
```

Without DB (catalog/SEO only):

```bash
npm run ops:daily-live-ops -- --no-smoke
```

## Checklist interpretation

| Check | Action if fail |
|-------|----------------|
| market_health | Review alerts in JSON; fix high severity first |
| seo_canonical | Run `audit-canonical-seo.js` |
| observation_freshness | Editorial review stale obs |
| live_smoke | Run `ops:live-smoke` from network with egress |
| behavioral_ingestion | Enable env var on backend deploy |

## Also run (weekly)

```bash
npm run ops:weekly-live-ops -- --db
npm run ops:market-learning -- --db 7
```

See [weekly-live-ops/](../weekly-live-ops/) for templates and trust anomaly log.

Log GSC deltas in [week-1-indexing-observations.md](../search-console-operations/week-1-indexing-observations.md).

## Do not

- Increase paid traffic to “fix” metrics  
- Auto-publish observations to catalog  
- Share lead quality tiers with dealers  

## Escalation

- SEO: [indexing-diagnostics-runbook.md](../search-console-operations/indexing-diagnostics-runbook.md)  
- Rollback: [production-cutover-report.md](../production-validation/production-cutover-report.md)  
