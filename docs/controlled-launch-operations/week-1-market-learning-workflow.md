# Week 1 Market Learning Workflow

**Cadence:** Daily review (10 min) · Weekly synthesis (30 min)  
**Traffic:** Organic only — do not spike paid traffic to “feed” learning.

---

## Daily

```bash
cd zyvev-backend
npm run ops:market-learning -- --db 7
```

**Requires:** `MONGO_URI` + `BEHAVIORAL_INTELLIGENCE_ENABLED=true` + production traffic.

### Log (copy daily)

```text
Date:
Total events (7d):
Leads (7d):
Compare starts / completions:
Ownership panel views:
Charging reality expands:
SEO → detail:
Top vehicle slug:
Top compare pair:
Anomaly:
Action:
```

---

## Signals → questions

| Signal | Week 1 question |
|--------|-----------------|
| `seo_to_detail` | Which guides drive serious consideration? |
| Compare completion rate | Where do buyers abandon compare? |
| Trust panel views | Correlates with lead quality? |
| Charging expands | Which models trigger anxiety? |
| Lead source pages | Detail vs compare vs SEO? |

---

## Weekly synthesis

```bash
npm run ops:weekly-live-ops -- --db
```

Merge into [../weekly-live-ops/operational-learning-template.md](../weekly-live-ops/operational-learning-template.md).

---

## Do not

- Share raw events with dealers  
- Auto-change catalog from behavioral data  
- Use learning to public “scores”  

---

## If DB unavailable locally

Run without `--db` for code/SEO health only; run `--db` from whitelisted IP or production ops host.

---

## Related

- [behavioral-activation-checklist.md](./behavioral-activation-checklist.md)
- [week-1-learning-template.md](./week-1-learning-template.md)
- [../runbooks/disable-behavioral-tracking.md](../runbooks/disable-behavioral-tracking.md)
