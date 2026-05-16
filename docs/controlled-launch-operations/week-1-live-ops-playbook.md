# Week 1 Live Ops Playbook

Single playbook for **Day 0 deploy → Day 7 review** under controlled launch.

---

## Principles

See [controlled-launch-principles.md](./controlled-launch-principles.md) — organic only, no scaling hacks, rollback-ready.

---

## Day 0 — Cutover

| Step | Doc / command |
|------|----------------|
| 1 | [production-cutover-checklist.md](../production-validation/production-cutover-checklist.md) |
| 2 | Deploy backend + frontend |
| 3 | [production-smoke-checklist.md](../production-validation/production-smoke-checklist.md) |
| 4 | [live-indexing-checklist.md](../search-console-operations/live-indexing-checklist.md) |
| 5 | Enable behavioral when approved → [behavioral-activation-checklist.md](./behavioral-activation-checklist.md) |
| 6 | Start [week-1-indexing-monitor.md](../search-console-operations/week-1-indexing-monitor.md) |

---

## Days 1–7 — Daily (10–15 min)

```bash
cd zyvev-backend
npm run ops:daily-live-ops -- --db
```

Use [daily-live-ops-template.md](./daily-live-ops-template.md) for logging.

| Review | Doc |
|--------|-----|
| Indexing | [week-1-indexing-monitor.md](../search-console-operations/week-1-indexing-monitor.md) |
| Market learning | [week-1-market-learning-workflow.md](./week-1-market-learning-workflow.md) |
| Trust anomalies | [../weekly-live-ops/trust-anomaly-tracking.md](../weekly-live-ops/trust-anomaly-tracking.md) |
| Escalation | [launch-anomaly-escalation.md](./launch-anomaly-escalation.md) |

---

## Day 3 — Mobile sign-off

[../production-validation/mobile-qa-signoff.md](../production-validation/mobile-qa-signoff.md)

---

## Day 7 — Weekly close

```bash
npm run ops:weekly-live-ops -- --db
npm run ops:market-health
npm run ops:market-learning -- --db 7
```

- Complete [../weekly-live-ops/week-1-live-ops-summary.md](../weekly-live-ops/week-1-live-ops-summary.md)
- Dealer pilot go/no-go → [../dealer-pilot-operations/onboarding-checklist.md](../dealer-pilot-operations/onboarding-checklist.md)

---

## Command reference

| Purpose | Command |
|---------|---------|
| Daily rollup | `ops:daily-live-ops --db` |
| Weekly rollup | `ops:weekly-live-ops --db` |
| SEO | `ops:seo` |
| Production activation | `ops:production-activation -- --live https://evsavari.com` |
| Live smoke | `ops:live-smoke https://evsavari.com` |

---

## Related

- [week-1-live-operations.md](./week-1-live-operations.md)
- [daily-live-ops-workflow.md](./daily-live-ops-workflow.md)
