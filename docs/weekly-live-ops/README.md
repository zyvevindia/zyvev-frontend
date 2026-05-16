# Weekly Live Intelligence Operations

Operational learning cadence for EVSavari under controlled live exposure.

## Commands

| Cadence | Command |
|---------|---------|
| Daily (10–15 min) | `cd zyvev-backend && npm run ops:daily-live-ops -- --db` |
| Weekly (30–45 min) | `npm run ops:weekly-live-ops -- --db` |
| Market learning | `npm run ops:market-learning -- --db 7` |
| Dealer pilot (internal) | `npm run ops:dealer-pilot 7` |

## Artifacts

- [week-1-live-ops-summary.md](./week-1-live-ops-summary.md) — running Week 1 log
- [operational-learning-template.md](./operational-learning-template.md) — weekly narrative template
- [trust-anomaly-tracking.md](./trust-anomaly-tracking.md) — trust/calibration review log
- [Daily workflow](../controlled-launch-operations/daily-live-ops-workflow.md)

## Guardrails

- No public observation exposure
- No dealer-facing scores
- No paid traffic scaling
- Calibration is advisory only (`autoApply: false`)
