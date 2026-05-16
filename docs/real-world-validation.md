# EVSavari Real-World Validation Sprint

Transition from **launch-capable** to **validated through real traffic, indexing, leads, and dealer feedback**.

Philosophy: **market feedback velocity** over new architecture.

## CLI reference (backend)

| Command | Purpose |
|---------|---------|
| `npm run validate:production` | Post-deploy static validation |
| `node scripts/validate-production-deployment.js --live URL` | Live HTTP checks |
| `npm run ops:crawl` | Crawl observations |
| `npm run ops:behavioral-quality` | Session depth, progression rates |
| `npm run ops:lead-validation` | Lead quality + funnel gaps |
| `npm run ops:dealer-pilot` | Dealer pilot aggregates |
| `npm run ops:validation-dashboard` | Minimal unified summary |
| `npm run validate:real-world` | Unified validation audit |

## Admin API

`GET /api/admin/ops/validation-summary?days=7` — read-only, aggregated, no PII.

## Documentation map

| Area | Path |
|------|------|
| Production validation | [production-validation/](./production-validation/) |
| Search Console ops | [search-console-operations/](./search-console-operations/) |
| Soft-launch monitoring | [runbooks/soft-launch-monitoring.md](./runbooks/soft-launch-monitoring.md) |
| Content expansion | [content-operations/real-world-expansion.md](./content-operations/real-world-expansion.md) |
| Dealer pilot | [dealer-operations/](./dealer-operations/) |
| Prior launch ops | [controlled-launch-operations.md](./controlled-launch-operations.md) |

## Traffic observations (foundation)

Manual GSC/analytics notes:

```bash
node scripts/report-traffic-observation-template.js
# Append lines to zyvev-backend/ops/traffic-observations.jsonl
```

## Dealer feedback (foundation)

```bash
# Example: ops/dealer-feedback.example.jsonl
# Programmatic append via services/dealer-feedback (backend)
```

## Staging validation

```bash
npm run validate:production
npm run validate:real-world
npm run ops:crawl
node scripts/validate-launch-profile.js soft-launch
```

With DB: `npm run ops:validation-dashboard -- --db`

## Rollback

See [runbooks/soft-launch-monitoring.md](./runbooks/soft-launch-monitoring.md) rollback triggers and [runbooks/deploy-rollback.md](./runbooks/deploy-rollback.md).
