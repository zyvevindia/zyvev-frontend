# EVSavari Controlled Launch Operations

Transition from **soft-launch capable** to **observable and market-learning ready**.

Philosophy: market learning over new architecture. No heavy BI, no invasive profiling.

## Capabilities delivered

### Search & index operations

- Docs: [search-operations/](./search-operations/)
- CLI: `node scripts/report-seo-operations.js` (backend repo)
- Covers GSC/Bing checklists, sitemap refresh, canonical/orphan diagnostics

### Content operations

- Docs: [content-operations/](./content-operations/)
- Pre-publish governance checklist for SEO guides and Tier-1 additions

### Lead quality observability

- CLI: `node scripts/report-lead-quality.js [days]` (requires `MONGO_URI`)
- Aggregated only — no PII in report output

### Lead source continuity

- CLI: `node scripts/audit-lead-source-continuity.js [--db] [days]`
- Validates SEO → detail → compare → lead → CRM attribution chain

### Behavioral trends

- CLI: `node scripts/report-behavioral-trends.js [days]`
- Top compare pairs, SEO engagement, abandonment, conversion patterns

### Traffic learning (foundation)

- `services/traffic-learning/` — observation record shapes for manual GSC/Bing imports
- Storage recommendation: `ops/traffic-observations.jsonl` (create when needed)

### Operational dashboard

- CLI: `node scripts/report-operational-dashboard.js [--db]`
- Crawlable URLs, sitemap freshness, lead distribution, top compare pairs

### Controlled launch & market learning

- Checklist: [controlled-launch-checklist.md](./controlled-launch-checklist.md)
- CLI: `npm run ops:controlled-launch`, `npm run ops:market-learning -- --db 7`, `npm run ops:market-health -- --db`
- Weekly indexing: [search-console-operations/weekly-indexing-review.md](./search-console-operations/weekly-indexing-review.md)
- Dealer pilot: [dealer-operations/dealer-pilot-readiness-checklist.md](./dealer-operations/dealer-pilot-readiness-checklist.md)
- Mobile QA: [production-validation/mobile-experience-validation.md](./production-validation/mobile-experience-validation.md)
- Production deploy: [production-validation/production-activation-checklist.md](./production-validation/production-activation-checklist.md)
- Week 1 learning: [controlled-launch-operations/week-1-learning-template.md](./controlled-launch-operations/week-1-learning-template.md)
- Live indexing: [search-console-operations/live-indexing-monitor.md](./search-console-operations/live-indexing-monitor.md)
- Dealer pilot ops: [dealer-operations/dealer-pilot-operations.md](./dealer-operations/dealer-pilot-operations.md)
- Dealer pilot package: [dealer-pilot-package/](./dealer-pilot-package/)
- Production cutover: [production-validation/production-cutover-report.md](./production-validation/production-cutover-report.md)
- Live smoke: [production-validation/live-smoke-test-report.md](./production-validation/live-smoke-test-report.md)
- Daily live ops: [controlled-launch-operations/daily-live-ops-workflow.md](./controlled-launch-operations/daily-live-ops-workflow.md)
- Weekly live ops: [weekly-live-ops/](./weekly-live-ops/)
- Launch principles: [controlled-launch-operations/controlled-launch-principles.md](./controlled-launch-operations/controlled-launch-principles.md)
- Week 1 operations: [controlled-launch-operations/week-1-live-operations.md](./controlled-launch-operations/week-1-live-operations.md)
- **Week 1 playbook:** [controlled-launch-operations/week-1-live-ops-playbook.md](./controlled-launch-operations/week-1-live-ops-playbook.md)
- Daily ops template: [controlled-launch-operations/daily-live-ops-template.md](./controlled-launch-operations/daily-live-ops-template.md)
- Behavioral activation: [controlled-launch-operations/behavioral-activation-checklist.md](./controlled-launch-operations/behavioral-activation-checklist.md)
- Market learning: [controlled-launch-operations/week-1-market-learning-workflow.md](./controlled-launch-operations/week-1-market-learning-workflow.md)
- Anomaly escalation: [controlled-launch-operations/launch-anomaly-escalation.md](./controlled-launch-operations/launch-anomaly-escalation.md)
- Live indexing: [search-console-operations/live-indexing-checklist.md](./search-console-operations/live-indexing-checklist.md)
- Dealer pilot ops: [dealer-pilot-operations/](./dealer-pilot-operations/)

### Launch profiles

- `config/launchProfiles.js`: `staging`, `soft-launch`, `public-beta`, `intelligence-public`, `behavioral-public`
- `node scripts/validate-launch-profile.js [profile]`

### Runbooks

- [runbooks/](./runbooks/) — sitemap, rollback, SEO, routes, behavioral disable, leads, compare

### Dealer operations

- [dealer-operations/](./dealer-operations/) — expectations and intent interpretation (docs only)

## Staging validation steps

```bash
cd zyvev-backend
node scripts/validate-launch-profile.js soft-launch
node scripts/build-sitemaps.mjs
node scripts/report-seo-operations.js
node scripts/audit-canonical-seo.js
node scripts/audit-soft-launch-readiness.js
node scripts/audit-lead-source-continuity.js
# With DB:
node scripts/report-lead-quality.js 7
node scripts/report-behavioral-trends.js 7
node scripts/report-operational-dashboard.js --db
```

Frontend smoke: vehicle detail, SEO guide (static JSON), compare, lead submit in staging.

## Rollback considerations

- **Profile rollback:** revert env to `soft-launch` profile; disable behavioral flags first
- **Sitemap rollback:** redeploy previous `public/sitemap*.xml`
- **SEO content rollback:** remove slug from registry + frontend list + redeploy sitemaps
- **No git push** unless explicitly requested — validate locally/staging

## Unresolved operational risks

| Risk | Mitigation |
|------|------------|
| SPA indexing variance | Sitemap + JSON-LD; monitor GSC |
| Small catalog | Focus SEO guides + compare for long-tail |
| GSC/Bing manual only | Weekly CSV notes; traffic-learning shapes ready |
| DB metrics need flags + URI | Use `--db` scripts only when behavioral enabled |
| Lead completion rate | Correlate via behavioral trends, not standalone yet |

## Related prior docs

- [soft-launch-readiness.md](./soft-launch-readiness.md)
- [market-activation/](./market-activation/)
- [buyer-intent-intelligence/](./buyer-intent-intelligence/)
