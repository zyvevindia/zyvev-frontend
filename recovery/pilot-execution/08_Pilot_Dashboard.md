# Pilot Dashboard — MVP-02

**Purpose:** Daily and weekly KPI tracking for Delhi NCR pilot  
**Update frequency:** Daily (ops lead), weekly (CEO review)

---

## Daily Dashboard

| Metric | Target (Week 1) | Actual | Source |
|---|---|---|---|
| Leads submitted | — | | Admin leads count |
| Leads assigned | 100% | | Admin filter by `assignedDealerId` |
| Leads in fallback queue | 0 | | `fallback-ops-queue` count |
| Avg time to first contact | < 4 hrs | | Dealer status `contacted` timestamp |
| Dealer response rate (24h) | > 80% | | Dealer dashboard |
| Duplicate leads (same phone) | 0 | | **Currently failing** — track manually |
| API submit errors | 0 | | Sentry / smoke |
| Turnstile blocks (legit users) | < 5% | | Support tickets |

---

## Funnel (Weekly)

```text
Visitors (GA)     →  _____
Vehicle page views →  _____
Lead form opens   →  _____  (launch telemetry)
Leads submitted   →  _____  (API 201)
Leads assigned    →  _____
Contacted         →  _____
Interested        →  _____
Won               →  _____
Lost              →  _____
```

**Telemetry sources:**

- Form open/submit: `trackLaunchLeadFormOpen`, `trackLaunchLeadFormSubmit` in `src/launch/launchTelemetry.js`
- Buyer events: `BUYER_EVENTS.LEAD_SUBMITTED` in `LeadInquiryModal.jsx`

---

## Dealer Scorecard (Per Pilot Dealer)

| Dealer ID | City | Leads received | Contacted | Won | Avg response (hrs) | Quality notes |
|---|---|---|---|---|---|---|
| pilot-ncr-01 | Gurgaon/Noida | | | | | |
| pilot-delhi-01 | Delhi | | | | | |

---

## System Health Panel

| Check | Command / URL | Status |
|---|---|---|
| Site up | `https://evsavari.com` | |
| Catalog | `/catalog/published/manifest.json` | |
| API | `https://evsavari-api.onrender.com/cars?limit=1` | |
| Lead smoke | `npm run lead:journey:smoke -- --live` | |
| Playwright | `npx playwright test tests/leads` | |

---

## Weekly Review Template

### Week of: ___________

**Leads**

- Total submissions:
- Conversion to contacted:
- Conversion to won:
- Top vehicle:
- Top city:

**Issues**

- P0/P1 incidents:
- Open engineering gaps:
- Dealer feedback:

**Decisions**

- [ ] Continue pilot
- [ ] Pause lead generation
- [ ] Onboard dealer #2

**Actions next week**

1.
2.
3.

---

## Red Flags (Auto-Escalate)

- `lead:journey:smoke --live` fails on submit (not duplicate)
- Zero leads for 48h with active traffic
- >3 duplicate phones same day
- Dealer reports zero inbox leads while admin shows assignments

---

*Populate Actual column daily. Evidence files: `recovery/pilot-execution/00_Master_Pilot_Report.md`*
