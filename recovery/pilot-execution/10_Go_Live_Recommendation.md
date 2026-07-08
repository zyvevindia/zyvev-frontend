# Go-Live Recommendation — MVP-02

**Date:** 2026-07-08  
**Decision authority:** CEO / Program lead  
**Recommendation:** **CONDITIONAL GO** for controlled pilot — **NOT** full marketplace RC

---

## Verdict Summary

| Dimension | Recommendation |
|---|---|
| Capture real buyer leads | **GO** — API proven, UI ready |
| Onboard first dealer | **HOLD** until G-MVP-01, G-MVP-02, G-MVP-03 closed |
| Paid traffic / marketing blast | **NO-GO** until Turnstile live + duplicate fix |
| Marketplace RC | **NO-GO** — lead loop incomplete |

---

## CEO Report (Evidence-Based)

### 1. Can a real customer submit a lead?

**Yes.**

| Evidence | Detail |
|---|---|
| Live API | `POST https://evsavari-api.onrender.com/leads` → **201** + `leadId` |
| Playwright | `buyer can submit enquiry to production API` — PASS |
| UI | Vehicle page CTAs visible; `LeadInquiryModal` submits via `submitBuyerLead` |

### 2. Can a real dealer receive it?

**Not proven.**

| Evidence | Detail |
|---|---|
| Code | `DealerDashboard.jsx` → `GET /api/dealer/leads` |
| Gap | No authenticated probe; `LEAD_SMOKE_DEALER_TOKEN` not set |
| API | `autoAssigned: false` on submit response |

**Action before dealer onboarding:** Submit test lead with Gurgaon city → confirm in pilot dealer inbox.

### 3. Can EVSavari run a live pilot next week?

**Not without 3 fixes (estimated 2–4 days):**

1. Backend duplicate suppression (`merged: true`)
2. Vercel `VITE_TURNSTILE_SITE_KEY` + backend Turnstile secret
3. End-to-end proof: buyer submit → dealer inbox → CRM kanban

### 4. Which RC blockers remain?

**Lead-related (open):**

- Duplicate suppression (G-MVP-01)
- Turnstile production verify (G-MVP-02)
- Dealer + CRM E2E (G-MVP-03, G-MVP-04)
- Lead monitoring (G-MVP-08)
- Dealer notifications (G-MVP-07)

**Non-lead (unchanged):** WebKit visual, legal, API health, Sentry/GA — see `06_RC_Blocker_Update.md`

### 5. What must be fixed before onboarding the first dealer?

| Priority | Fix | Owner |
|---|---|---|
| P0 | Phone duplicate merge on backend | Backend |
| P0 | Turnstile keys on Vercel + Render | DevOps |
| P0 | Map `pilot-ncr-01` to real dealer account + prove inbox | Ops + Backend |
| P1 | Dealer new-lead notification (email/WhatsApp) | Backend |
| P1 | Daily reconciliation runbook signed | Ops |

### 6. Is EVSavari ready to start generating real leads?

**Partial yes — controlled pilot only.**

| Ready | Not ready |
|---|---|
| Public vehicle pages + lead form | Duplicate leads polluting CRM |
| API ingestion | Unverified CAPTCHA on production |
| Routing metadata to pilot desks | Dealer closure loop unproven |
| Ops documentation | Automated monitoring |

---

## Recommended Pilot Sequence

### Phase A — Soft pilot (after P0 fixes, ~3 days)

- 1 dealer (NCR)
- Organic traffic only (no paid ads)
- Ops manual reconciliation daily
- CEO daily dashboard review

### Phase B — Expand (after 2 weeks clean data)

- Dealer #2–#3
- Limited paid geo campaigns
- Automate dealer notifications

### Phase C — RC path

- Close remaining No-Go items
- WebKit + legal parallel track

---

## Sign-Off Criteria for Phase A

- [ ] `npm run lead:journey:smoke -- --live` — **0 failures**
- [ ] `npx playwright test tests/leads` — **0 failures** (dealer test enabled)
- [ ] Turnstile verified on production lead submit
- [ ] Pilot dealer confirms lead received within 15 min
- [ ] Ops lead signs `07_Daily_Operations.md`

---

## Final Recommendation

**Proceed with engineering fixes (duplicate + Turnstile env + dealer E2E), then start a 1-dealer soft pilot.** Do not declare Marketplace RC or scale lead generation until the full success criteria in `00_Master_Pilot_Report.md` pass.

| Role | Recommendation | Date |
|---|---|---|
| Engineering | Conditional GO — buyer path certified | 2026-07-08 |
| Ops | HOLD — pending dealer proof | 2026-07-08 |
| CEO decision | _______________ | __________ |

---

*Evidence repository path: `recovery/pilot-execution/`*
