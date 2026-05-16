# Week 1 Live Operations

Operational runbook for the first 7 days of controlled public exposure.

---

## Day 0 — Deploy

1. Complete [production-env-checklist.md](../production-validation/production-env-checklist.md)  
2. Deploy frontend + backend  
3. Run [deploy-verification-checklist.md](../production-validation/deploy-verification-checklist.md)  
4. Submit sitemaps ([week-1-indexing-ops.md](../search-console-operations/week-1-indexing-ops.md))  
5. Enable behavioral ingestion when smoke passes  

---

## Days 1–7 — Daily (10–15 min)

```bash
cd zyvev-backend
npm run ops:daily-live-ops -- --db
```

| Step | Action |
|------|--------|
| 1 | Review health score + checklist |
| 2 | Log indexing delta in week-1-indexing-ops |
| 3 | Check observation pending count = 0 |
| 4 | Scan trust anomalies (weekly-live-ops if needed) |
| 5 | Update [week-1-live-ops-summary.md](../weekly-live-ops/week-1-live-ops-summary.md) |

---

## Day 3 — Mobile sign-off

Complete [mobile-qa-signoff.md](../production-validation/mobile-qa-signoff.md) on Android Chrome 375px.

---

## Day 7 — Weekly close

```bash
npm run ops:weekly-live-ops -- --db
npm run ops:market-learning -- --db 7
```

| Deliverable | Doc |
|-------------|-----|
| Operational learning narrative | [operational-learning-template.md](../weekly-live-ops/operational-learning-template.md) |
| Indexing summary | [week-1-indexing-observations.md](../search-console-operations/week-1-indexing-observations.md) |
| Dealer pilot go/no-go | [dealer-pilot-operations/onboarding-checklist.md](../dealer-pilot-operations/onboarding-checklist.md) |

---

## Commands reference

| Purpose | Command |
|---------|---------|
| SEO | `npm run ops:seo` |
| Production activation | `npm run ops:production-activation -- --live https://evsavari.com` |
| Live smoke | `npm run ops:live-smoke https://evsavari.com` |
| Market health | `npm run ops:market-health` |
| Controlled launch | `npm run ops:controlled-launch` |

---

## Discipline reminders

- No paid traffic scaling in Week 1  
- No public observation exposure  
- No dealer score sharing  
- No auto-publish observations to catalog  

See [controlled-launch-principles.md](./controlled-launch-principles.md).
