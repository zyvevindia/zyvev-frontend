# Week 1 Learning Template

**Period:** Day 1–7 of controlled public exposure  
**Traffic policy:** Organic only — no paid campaigns, no spikes

## Daily ops (15 min)

```bash
cd zyvev-backend
npm run ops:market-health -- --db
npm run ops:market-learning -- --db 7
```

Log anomalies only — do not react to single-day noise.

## Signals to track

| Signal | Source | Week 1 question |
|--------|--------|-----------------|
| SEO entry | GSC + `seo_to_detail` events | Which guides drive detail views? |
| Compare usage | Behavioral trends | Top pairs? Abandonment rate? |
| Trust engagement | `ownership_panel_viewed`, trust block | Correlates with leads? |
| Charging anxiety | `charging_reality_expanded` | High on which vehicles? |
| Lead funnel | Leads + `lead_submitted` events | Source page coverage %? |
| First-time EV | Lead quality indicators | % first-time pattern? |

## Daily log (copy per day)

```text
Date: YYYY-MM-DD
Sessions (est): 
Events (7d rolling): 
Leads (7d rolling): 
Top SEO slug: 
Top compare pair: 
Trust-engaged lead %: 
Anomalies: 
Action taken: 
```

## End of week review

- [ ] Run [weekly-indexing-review](../search-console-operations/weekly-indexing-review.md)
- [ ] Review observation moderation queue
- [ ] Review lead calibration observations in admin
- [ ] Decide Week 2: expand observations OR dealer pilot OR neither

## Do not

- Increase ad spend to “boost learning”
- Publish user reviews or star ratings
- Auto-apply observations to catalog copy without editorial sign-off
