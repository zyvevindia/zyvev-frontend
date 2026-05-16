# Daily Live Ops Template

**Date:** ___________  
**Operator:** ___________

---

## Automated run

```bash
cd zyvev-backend
npm run ops:daily-live-ops -- --db
```

| Check | Pass | Detail |
|-------|------|--------|
| market_health | ☐ | Score: ___ / status: ___ |
| seo_canonical | ☐ | Errors: ___ |
| observation_freshness | ☐ | Stale: ___ |
| live_smoke | ☐ | ___/___ |
| behavioral_ingestion | ☐ | on/off |

**allChecksPass:** ☐ Yes ☐ No

---

## Indexing (2 min)

GSC indexed delta today: ______  
Crawl errors new: ☐ None ☐ See notes  

→ [week-1-indexing-monitor.md](../search-console-operations/week-1-indexing-monitor.md)

---

## Learning (if behavioral on)

```bash
npm run ops:market-learning -- --db 7
```

Events 7d: ______ · Leads 7d: ______  
Notable pattern: _________________________________

---

## Trust / observations

Pending moderation: ______  
Trust anomalies to review: ______  

→ [trust-anomaly-tracking.md](../weekly-live-ops/trust-anomaly-tracking.md)

---

## Leads (qualitative)

New leads worth noting: ______  
Compare-assisted: ☐ Yes ☐ No  
Charging concern: ☐ Yes ☐ No  

---

## Anomalies & actions

| Severity | Issue | Action |
|----------|-------|--------|
| | | |

Escalate per [launch-anomaly-escalation.md](./launch-anomaly-escalation.md).

---

## Discipline check

- [ ] No paid traffic spike today  
- [ ] No public observation exposure  
- [ ] No dealer score sharing  

---

## Tomorrow focus

1.  
2.  
