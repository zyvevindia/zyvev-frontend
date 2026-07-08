# Master Pilot Report — MVP-02

**Sprint:** MVP-02 — Live Pilot Execution & Lead Loop Validation  
**Date:** 2026-07-08  
**Verdict:** **CONDITIONAL FAIL** — buyer capture works; dealer/CRM loop and duplicate suppression unproven

---

## Executive Summary

MVP-02 certified the **buyer submission path** end-to-end at the API layer and hardened the **frontend lead form** with Cloudflare Turnstile wiring (same pattern as contact/newsletter). Automated evidence was added via `npm run lead:journey:smoke` and Playwright `tests/leads/lead-loop.spec.js`.

The sprint **does not pass** full success criteria because:

| Criterion | Status |
|---|---|
| Buyer can submit enquiry | ✅ Pass |
| CAPTCHA on production lead forms | ⚠️ Code ready; `VITE_TURNSTILE_SITE_KEY` not verified live on Vercel |
| Lead reaches backend / stored | ✅ Pass (HTTP 201 + `leadId`) |
| Dealer receives assigned lead | ❌ Not proven (no authenticated dealer probe) |
| Lead visible in CRM | ❌ Not proven (no sales/admin token probe) |
| Duplicate suppression | ❌ **Fail** — API returns `merged: false` on repeat phone |
| E2E Playwright | ⚠️ 7/8 pass; 1 intentional fail (duplicate); dealer test skipped |
| Pilot operations documented | ✅ This folder |
| Go-live recommendation | ✅ `10_Go_Live_Recommendation.md` |

---

## Workstream Status

| # | Workstream | Status | Evidence |
|---|---|---|---|
| 1 | End-to-end lead journey | Partial | `01_Lead_Journey.md` |
| 2 | Playwright E2E | Partial | `04_Playwright_E2E.md` |
| 3 | Lead operations | Audited | `05_Pilot_Operations.md` |
| 4 | Pilot operations | Documented | `07_Daily_Operations.md`, `08_Pilot_Dashboard.md` |
| 5 | Marketplace RC blockers | Updated | `06_RC_Blocker_Update.md` |
| 6 | Pilot readiness | Documented | `02_Dealer_Journey.md`, `03_CRM_Journey.md` |

---

## Engineering Changes (This Sprint)

| Change | Path |
|---|---|
| Turnstile + centralized submit on lead modal | `src/components/LeadInquiryModal.jsx` |
| Lead submit API helper | `src/services/leadSubmitApi.js` |
| API + wiring smoke | `scripts/lead-journey-smoke.mjs` |
| Playwright lead suite | `tests/leads/lead-loop.spec.js`, `playwright.config.js` |
| npm scripts | `lead:journey:smoke`, `test:leads`, `test:leads:live` |

---

## Test Evidence (2026-07-08)

```text
npm run lead:journey:smoke          → PASSED (offline wiring)
npm run lead:journey:smoke -- --live → FAILED (1) duplicate suppression
npx playwright test tests/leads     → 7 passed, 1 failed (duplicate), 1 skipped (dealer token)
```

Live API sample (production):

```json
POST https://evsavari-api.onrender.com/leads → 201
{"success":true,"leadId":"6a4d5e919573bc1d0b94717e","merged":false,"autoAssigned":false}
```

Duplicate resubmit (same phone) → 201, **new `leadId`**, `merged: false`.

---

## CEO Report (Quick Answers)

| # | Question | Answer |
|---|---|---|
| 1 | Can a real customer submit a lead? | **Yes** — API + UI entry points verified |
| 2 | Can a real dealer receive it? | **Not proven** — dealer inbox requires auth probe |
| 3 | Can EVSavari run a live pilot next week? | **Not yet** — fix duplicate suppression + Turnstile prod env + dealer E2E |
| 4 | Which RC blockers remain? | See `06_RC_Blocker_Update.md` |
| 5 | What must be fixed before first dealer? | Turnstile env, backend duplicate merge, dealer assignment proof, notifications |
| 6 | Ready to generate real leads? | **Partial** — capture works; ops/CRM loop not certified |

---

## Document Index

| File | Purpose |
|---|---|
| `01_Lead_Journey.md` | Buyer → backend flow |
| `02_Dealer_Journey.md` | Dealer portal flow |
| `03_CRM_Journey.md` | Admin / sales CRM |
| `04_Playwright_E2E.md` | Automated test evidence |
| `05_Pilot_Operations.md` | Lead ops audit |
| `06_RC_Blocker_Update.md` | RC blocker re-evaluation |
| `07_Daily_Operations.md` | Daily ops checklist |
| `08_Pilot_Dashboard.md` | KPI dashboard template |
| `09_Remaining_Gaps.md` | Open gaps register |
| `10_Go_Live_Recommendation.md` | Pilot go/no-go |

---

*MVP-02 scope: blocker fixes and certification only — no architecture redesign.*
