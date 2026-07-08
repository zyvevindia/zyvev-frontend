# Playwright E2E — MVP-02

**Suite:** `tests/leads/lead-loop.spec.js`  
**Config:** `playwright.config.js`  
**Runner:** `@playwright/test` ^1.61.1

---

## Commands

| Command | Purpose |
|---|---|
| `npm run lead:journey:smoke` | Offline wiring + routing checks |
| `npm run lead:journey:smoke -- --live` | + production API probes |
| `npm run test:leads` | Smoke + Playwright |
| `npm run test:leads:live` | Live smoke + Playwright |
| `npx playwright test tests/leads` | Playwright only |

### Optional env vars

| Variable | Purpose |
|---|---|
| `PLAYWRIGHT_BASE_URL` | Default `https://evsavari.com` |
| `VITE_API_URL` / `LEAD_SMOKE_API_URL` | API base for request tests |
| `LEAD_SMOKE_DEALER_TOKEN` | Enables dealer inbox test |
| `LEAD_SMOKE_SALES_TOKEN` | Enables sales CRM test |

---

## Scenario Matrix

| Scenario | Test | Result (2026-07-08) |
|---|---|---|
| Buyer submits enquiry | `buyer can submit enquiry to production API` | ✅ PASS |
| Invalid phone blocked | `invalid phone is rejected` | ✅ PASS |
| Duplicate lead blocked | `duplicate lead should merge...` | ❌ **FAIL** (`merged: false`) |
| Assignment verification | `Gurgaon enquiry maps to NCR pilot desk` | ✅ PASS (unit) |
| CAPTCHA validation | Source asserts Turnstile wiring | ✅ PASS |
| Lead form UI hooks | `lead modal includes Turnstile...` | ✅ PASS |
| Vehicle page CTA | `vehicle page exposes enquiry entry point` | ✅ PASS |
| Dealer receives lead | `dealer receives assigned lead` | ⏭ SKIPPED (no token) |
| Failure recovery | Not automated | — Manual |

---

## Test Run Output

```text
npx playwright test tests/leads --reporter=list

  7 passed
  1 failed  — duplicate merge (backend gap)
  1 skipped — dealer token not set
```

---

## Evidence Artifacts

On failure, Playwright writes:

- `test-results/` — screenshots, traces
- Trace viewer: `npx playwright show-trace <trace.zip>`

---

## Gaps vs Sprint Scenarios

| Required scenario | Coverage |
|---|---|
| Buyer submits enquiry | ✅ API + UI CTA |
| Dealer receives lead | ❌ Needs `LEAD_SMOKE_DEALER_TOKEN` |
| Lead visible in CRM | ❌ Needs `LEAD_SMOKE_SALES_TOKEN` |
| Duplicate blocked | ❌ Documented failure — backend fix required |
| CAPTCHA validation | ✅ Static wiring tests; live Turnstile solve not automated |
| Assignment verification | ✅ Routing unit test only |
| Failure recovery | ❌ Not implemented |

---

## Recommendation

1. **Backend:** Fix duplicate merge → duplicate test turns green
2. **Ops:** Provide pilot dealer + sales JWTs as CI secrets
3. **CI:** Add `test:leads:live` to nightly workflow (not PR — hits production API)
4. **Future:** UI test opening modal + filling form (requires Turnstile test keys or mock)

---

## Certification Verdict

**Playwright E2E:** **PARTIAL PASS** — core buyer API path certified; dealer/CRM/duplicate scenarios open.
