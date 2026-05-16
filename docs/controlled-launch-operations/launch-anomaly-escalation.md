# Launch Anomaly Escalation

Use during Week 1 live ops when automated checks or judgment signal risk.

---

## Severity tiers

| Tier | Examples | Response time | Owner |
|------|----------|---------------|-------|
| **P0** | Leads down, API 5xx widespread, PII in events | Immediate | Deploy + ops lead |
| **P1** | Canonical errors on top URLs, sitemap 404, compare broken | < 4h | Engineering |
| **P2** | Single variant trust mismatch, one 404 route | < 24h | Editorial + eng |
| **P3** | GSC crawl lag, low indexed Day 2 | Monitor 48h | Ops |

---

## P0 playbook

1. [rollback-checklist.md](../production-validation/rollback-checklist.md) — disable behavioral first if event-related  
2. Vercel rollback if frontend regression  
3. Backend env/profile downgrade if API regression  
4. `ops:live-smoke` after fix  
5. Log in daily template + week-1 summary  

---

## P1 playbook

1. `npm run ops:seo` — identify canonical/sitemap break  
2. Hotfix deploy  
3. GSC URL inspect affected URLs after fix  
4. Do **not** request indexing on entire site  

---

## P2 playbook

1. `ops:weekly-live-ops` → trust anomalies  
2. Editorial review — no auto-apply to catalog  
3. Optional content hotfix  

---

## P3 playbook

1. Continue [week-1-indexing-monitor.md](../search-console-operations/week-1-indexing-monitor.md)  
2. Verify robots + sitemap unchanged  
3. Re-check Day 5  

---

## Escalation contacts (fill in)

| Role | Contact |
|------|---------|
| Deploy on-call | |
| Editorial | |
| Founder decision (rollback) | |

---

## Communication template

```text
EVSavari launch anomaly [P0/P1/P2/P3]
Time:
Symptom:
Impact:
Mitigation:
ETA:
Rollback considered: yes/no
```

---

## Related

- [controlled-launch-principles.md](./controlled-launch-principles.md)
- [../runbooks/deploy-rollback.md](../runbooks/deploy-rollback.md)
- [../runbooks/seo-issue-response.md](../runbooks/seo-issue-response.md)
