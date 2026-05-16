# Lead Quality Signals (Dealer-Safe)

## What dealers see

- Buyer name, phone, email (from form)
- Vehicle of interest
- Message / inquiry type
- Optional high-level intent summary (when enabled for admin handoff)

## What dealers do not see

- Anonymous `sessionId` or behavioral event stream
- Internal compare abandonment rates
- SEO page view counts
- Any “score” or ranking of buyer seriousness

## Ops-only metrics

Run weekly:

```bash
cd zyvev-backend
node scripts/report-lead-quality.js 7
node scripts/audit-lead-source-continuity.js --db
```

## Interpreting compare-assisted leads

**Strong intent:** compare source + two vehicles named + lead submitted within same session window (ops correlation).

**Exploratory:** SEO guide source, single vehicle, no ownership flags — nurture with education.

## Interpreting SEO-originated leads

Buyer discovered via guides (city driving, budget, charging, etc.). First response should acknowledge **use case** from guide topic, not generic brochure.

## Ownership panel engagement

If intent summary notes ownership uncertainty:

- Expect questions on battery, resale, charging at home
- Avoid dismissing with discount-only offers

## Continuity audit

If `audit-lead-source-continuity.js` reports gaps:

- `missing_sourcePage` — fix frontend `sourcePage` on submit
- `session_without_intent_context` — check `BEHAVIORAL_INTELLIGENCE_ENABLED` at submit time
- `possible_pii_in_intent_context` — **stop** and run privacy review (should never occur)
