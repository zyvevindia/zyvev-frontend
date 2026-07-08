# Daily Operations — MVP-02 Pilot

**Audience:** EVSavari ops lead  
**Pilot geography:** Delhi NCR (Gurgaon / Noida / Delhi) — per routing config in `leadRouting.js`

---

## Morning Checklist (15 min)

- [ ] Run `npm run deploy:smoke` — all 18 required checks green
- [ ] Open `https://evsavari.com/api/health` — status ok
- [ ] Check Render API: `GET https://evsavari-api.onrender.com/cars?limit=1` → 200
- [ ] Admin login → Leads — review overnight submissions
- [ ] Filter unassigned / `fallback-ops-queue` leads
- [ ] Confirm each NCR lead has dealer assignment
- [ ] Check dealer dashboard (pilot account) — manual refresh for new leads
- [ ] Review Sentry/errors if configured
- [ ] Log count in daily dashboard (`08_Pilot_Dashboard.md`)

---

## Intraday Lead Handling

| Time | Action |
|---|---|
| T+0 | Lead submitted — note `leadId` from admin |
| T+5 min | Verify lead in admin + assigned dealer inbox |
| T+15 min | If no dealer ack — call/WhatsApp dealer |
| T+1 hr | Status must move from `new` → `contacted` |
| T+24 hr | Follow-up or escalate to ops lead |

---

## Support Workflow

| Issue | First response | Escalation |
|---|---|---|
| Buyer: form won't submit | Check Turnstile; try different browser | Engineering if API 5xx |
| Buyer: no callback | Verify dealer assignment + dealer contact | Reassign in admin |
| Dealer: can't login | Reset password via admin | Backend auth |
| Dealer: no leads showing | Confirm city mapping; manual refresh | Check `assignedDealerId` |
| Duplicate buyer complaints | Check phone in admin — **known gap** | Merge manually until backend fix |

---

## Issue Escalation

| Severity | Example | Response |
|---|---|---|
| P0 | Leads API down (5xx) | Pause ads; notify CEO; backend on-call |
| P1 | Turnstile blocking all submits | Disable key temporarily **only with CEO approval** |
| P2 | Single dealer not receiving | Manual assign + dealer support |
| P3 | UI typo / non-blocking | Log for next deploy |

---

## Lead Reconciliation (End of Day)

1. Export admin leads CSV (`adminExportApi.js`)
2. Count: submitted vs assigned vs contacted vs won/lost
3. Match dealer-reported closures
4. Flag orphan leads (no dealer, duplicate phones)
5. Enter totals in weekly review template

---

## Manual Fallback

If automated routing fails:

1. Admin → open lead → Assign dealer manually
2. Copy buyer phone → WhatsApp template via dealer dashboard
3. Mark status `contacted` with note "manual routing — MVP pilot"
4. File gap in `09_Remaining_Gaps.md` weekly review

---

## QA Test Leads

- Tag: `[QA-TEST]` or `leadMetadata.qaTest: true`
- Safe to delete from admin after verification
- Do **not** use production dealer phones for smoke tests

---

## Commands Reference

```bash
npm run lead:journey:smoke -- --live   # API health check
npm run deploy:smoke                   # Production surface check
npx playwright test tests/leads        # E2E suite
```
