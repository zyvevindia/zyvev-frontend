# RC Blocker Update — MVP-02

**Reference:** `recovery/production-closure/09_Remaining_Gaps.md`, `10_Production_Signoff.md`  
**Scope:** Lead-related RC blockers only — re-evaluated after MVP-02

---

## Blocker Status Key

| Status | Meaning |
|---|---|
| **Resolved** | Evidence closes blocker in production |
| **Partially Resolved** | Code/deploy progress; live proof incomplete |
| **Open** | Still blocks RC or pilot |

---

## Lead-Related RC Blockers

| # | Blocker | Pre-MVP-02 | Post-MVP-02 | Evidence |
|---|---|---|---|---|
| L1 | Lead E2E uncertified | Open | **Partially Resolved** | Playwright 7/8 pass; dealer/CRM skipped |
| L2 | Turnstile on lead forms | Open | **Partially Resolved** | Wired in `LeadInquiryModal`; Vercel env unverified |
| L3 | Duplicate suppression | Open | **Open** | Live API `merged: false` on repeat phone |
| L4 | Dealer receives lead | Open | **Open** | No authenticated dealer probe |
| L5 | CRM visibility | Open | **Open** | No sales/admin token probe |
| L6 | Lead delivery monitoring | Open | **Open** | No alert on new lead |
| L7 | Dealer notifications | Open | **Open** | PCS gap #16 unchanged |
| L8 | MVP-02 pilot execution | Open | **Partially Resolved** | This documentation set |

---

## Non-Lead RC Blockers (Unchanged)

| # | Blocker | Status | Notes |
|---|---|---|---|
| R1 | WebKit visual 0/56 | **Open** | Out of MVP-02 scope |
| R2 | Sentry + GA in Vercel prod | **Open** | DevOps |
| R3 | API `GET /health` on Render | **Open** | Backend repo |
| R4 | Legal privacy/terms review | **Open** | External |
| R5 | RC checklist 19 No-Go → ≤4 | **Open** | PMO |

---

## Resolved Since PCS-01 (Non-Lead)

| Item | Status |
|---|---|
| Catalog manifest HTTP 200 | ✅ Resolved |
| Frontend `/api/health` | ✅ Resolved |
| `catalog:certify:strict` in CI | ✅ Resolved |

---

## Lead Blocker Detail

### L1 — Lead E2E

- **Before:** No `tests/leads`, no smoke script
- **After:** `scripts/lead-journey-smoke.mjs`, `tests/leads/lead-loop.spec.js`
- **Remaining:** Dealer + CRM auth probes; duplicate test red

### L2 — Turnstile

- **Before:** Only contact/newsletter/feedback (`ContactPage.jsx`)
- **After:** `LeadInquiryModal.jsx` + `leadSubmitApi.js`
- **Remaining:** `VITE_TURNSTILE_SITE_KEY` on Vercel + backend secret (`03_Configuration_Report.md`)

### L3 — Duplicate suppression

- **Evidence:** `npm run lead:journey:smoke -- --live` fails on duplicate assertion
- **Owner:** Backend (`zyvev-backend`)

---

## RC Readiness Count

| Category | Open | Partial | Resolved |
|---|---|---|---|
| Lead-related | 4 | 3 | 0 |
| Non-lead RC | 5 | 0 | 3 (deploy) |

**Marketplace RC can begin?** **NO** — per PCS-01 criteria; MVP-02 closed documentation and partial E2E only.

---

## Target: ≤4 No-Go After Lead Sprint

To reach RC threshold, minimum closures:

1. L3 Duplicate suppression (backend)
2. L2 Turnstile live verified
3. L4 + L5 Dealer + CRM E2E with pilot credentials
4. L6 Lead monitoring / ops runbook signed

Non-lead items (WebKit, legal) may remain if PMO accepts phased RC.
