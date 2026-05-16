# Dealer Pilot Readiness Checklist

**Status:** Internal preparation only — no dealer-facing dashboards yet.

## Value proposition (validated internally)

- [ ] Dealer-safe lead summaries available (`/api/admin/leads/:id/intent-summary`)
- [ ] Compare-assisted leads identifiable in lead-quality report
- [ ] Trust-engaged sessions tracked (behavioral + lead indicators)
- [ ] No raw behavioral traces or public quality scores exposed

## Operational gates

```bash
cd zyvev-backend
npm run ops:market-health -- --db    # when MONGO_URI available
node scripts/report-dealer-pilot.js  # if configured
```

- [ ] ≥10 verified editorial observations across ≥8 variants
- [ ] Trust presentation complete on all Tier-1 variants
- [ ] Lead `sourcePage` populated on >80% of leads (7d window)

## Pilot scope (suggested)

1. **One metro** — Delhi NCR or Bangalore  
2. **3–5 models** — Nexon, Punch, Comet, BE 6, ZS EV  
3. **Delivery:** Email/CRM with dealer-safe summary only  
4. **Feedback:** `ops/dealer-feedback.jsonl` template  

## Explicitly out of scope

- Dealer CRM integration
- Public dealer scoring / leaderboards
- Auto-sharing buyer behavioral timelines

## Sign-off

| Role | Ready |
|------|-------|
| Editorial | ☐ |
| Ops | ☐ |
| Product | ☐ |
