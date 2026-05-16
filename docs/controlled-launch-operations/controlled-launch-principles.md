# Controlled Launch Principles

EVSavari launches as an **operational intelligence platform**, not a traffic-maximization event.

---

## Core principles

1. **Organic only (initially)** — no paid campaigns in Week 1  
2. **Slow rollout** — observe before scaling exposure  
3. **Trust-first** — no public reviews, scores, or crowdsourced ratings  
4. **Privacy-first learning** — anonymous behavioral events only  
5. **Editorial governance** — observations and trust copy human-governed  
6. **Rollback-ready** — env flags and Vercel rollback documented  

---

## What we optimize for (Week 1)

- Correct catalog + trust rendering  
- Clean SEO/canonical integrity  
- Lead quality signals (internal)  
- Indexing baseline (GSC/Bing)  
- Operational learning cadence  

## What we do not optimize for (Week 1)

- Viral traffic  
- Dealer volume guarantees  
- Aggressive indexing requests  
- Feature velocity  

---

## Exposure guardrails

| Allowed | Not allowed |
|---------|-------------|
| Organic search, direct, light social | Paid search / Meta blast |
| Editorial SEO guides | Link schemes / doorway pages |
| 1-metro dealer pilot (manual) | Public dealer dashboards |
| Internal ops dashboards | Public analytics APIs |

---

## Monitoring cadence

| Frequency | Command / doc |
|-----------|----------------|
| Daily | `ops:daily-live-ops --db` |
| Weekly | `ops:weekly-live-ops --db` |
| Indexing | [week-1-indexing-ops.md](../search-console-operations/week-1-indexing-ops.md) |
| Trust | [trust-anomaly-tracking.md](../weekly-live-ops/trust-anomaly-tracking.md) |

---

## Rollback decision rules

**Immediate rollback consideration:**

- Production lead flow broken  
- PII in behavioral payloads  
- Mass canonical/noindex regression  
- Admin routes indexed publicly  

**Do not rollback for:**

- Low Day-1 indexed URLs  
- Single-variant trust copy mismatch (editorial fix)  
- Market health `watch` with stable core audits  

---

## Anomaly escalation

| Severity | Example | Action |
|----------|---------|--------|
| P0 | Leads down, API 5xx | Rollback + incident |
| P1 | Canonical errors on top URLs | Hotfix deploy |
| P2 | Trust mismatch one variant | Editorial queue |
| P3 | GSC crawl lag | Monitor 48h |

---

## Related

- [week-1-live-operations.md](./week-1-live-operations.md)
- [daily-live-ops-workflow.md](./daily-live-ops-workflow.md)
- [../production-validation/deploy-verification-checklist.md](../production-validation/deploy-verification-checklist.md)
