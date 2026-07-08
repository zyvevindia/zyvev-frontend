# Remaining Gaps — MVP-02

**Date:** 2026-07-08  
**Sprint:** MVP-02 — after lead loop validation

---

## Critical (Pilot Blockers)

| ID | Gap | Owner | Evidence | ETA |
|---|---|---|---|---|
| G-MVP-01 | Backend duplicate suppression not working | Backend | Live API `merged: false`; smoke + Playwright fail | 1–2 days |
| G-MVP-02 | Turnstile not verified on production Vercel | DevOps | `03_Configuration_Report.md`; lead form wired but env unknown | 1 day |
| G-MVP-03 | Dealer inbox E2E unproven | QA + Ops | Playwright skipped — no `LEAD_SMOKE_DEALER_TOKEN` | 1 day |
| G-MVP-04 | CRM visibility E2E unproven | QA + Ops | No `LEAD_SMOKE_SALES_TOKEN` | 1 day |
| G-MVP-05 | `autoAssigned: false` on live leads | Backend | API response field | 2–3 days |

---

## High (Pilot Degradation)

| ID | Gap | Owner | Notes |
|---|---|---|---|
| G-MVP-06 | No dealer lead polling | Frontend | `DealerDashboard` loads once on mount |
| G-MVP-07 | No new-lead notifications | Backend | Email/WhatsApp on ingest |
| G-MVP-08 | No lead monitoring alerts | Ops | Manual admin check only |
| G-MVP-09 | API `/health` 404 on Render | Backend | PCS gap unchanged |
| G-MVP-10 | Rate limiting unknown on `/leads` | Backend | Honeypot + Turnstile only |

---

## Medium (Post-Pilot Week 1)

| ID | Gap | Owner |
|---|---|---|
| G-MVP-11 | WebKit visual baselines | QA |
| G-MVP-12 | Sentry + GA production verify | DevOps |
| G-MVP-13 | Legal privacy/terms signoff | Legal |
| G-MVP-14 | UI E2E full form fill + Turnstile solve | QA |
| G-MVP-15 | Idempotent submit / retry UX | Frontend |

---

## Closed in MVP-02

| ID | Item | Evidence |
|---|---|---|
| C-MVP-01 | Lead form Turnstile wiring | `LeadInquiryModal.jsx` |
| C-MVP-02 | Centralized lead submit | `leadSubmitApi.js` |
| C-MVP-03 | Lead journey smoke script | `scripts/lead-journey-smoke.mjs` |
| C-MVP-04 | Playwright lead suite | `tests/leads/lead-loop.spec.js` |
| C-MVP-05 | Pilot ops documentation | `recovery/pilot-execution/*` |
| C-MVP-06 | Buyer API submit certified | HTTP 201 live |

---

## External Dependencies

| Dependency | Blocks |
|---|---|
| `zyvev-backend` duplicate merge PR | G-MVP-01 |
| Vercel dashboard access | G-MVP-02 |
| Pilot dealer JWT for CI | G-MVP-03 |
| Sales/admin JWT for CI | G-MVP-04 |
| Legal counsel | G-MVP-13 |

---

## Gap Count

| Severity | Open |
|---|---|
| Critical | 5 |
| High | 5 |
| Medium | 5 |
| Closed this sprint | 6 |

---

*Next review: after backend duplicate fix + dealer token probe.*
