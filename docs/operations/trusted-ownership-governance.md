# Trusted ownership intelligence — governance

Operational discipline for ownership realism, charging practicality, user suitability, and recommendation maturity on EVSavari.

## Principles

- **Deterministic scoring** — all ownership and suitability scores derive from catalog intelligence, not speculative AI.
- **Directional confidence** — copy and scores avoid fake precision; caveats when data is estimated.
- **Usage patterns only** — suitability profiles reflect driving/charging patterns, never demographics.
- **Human-governed** — ops dashboards flag weak clusters; editorial review before copy or score promotion.

## Review cadence

| Area | Cadence | Owner | Output |
|------|---------|-------|--------|
| Ownership realism | Weekly | Catalog ops | `/admin/ownership-intelligence` export |
| Charging practicality | Bi-weekly | Catalog ops | Charging flags + apartment risk list |
| Recommendation maturity | Weekly | Trust ops | `/admin/recommendation-maturity` |
| Compare realism QA | Per compare-pair change | Editorial | Compare calibration + realism pages |
| Trust copy | Monthly | Editorial | `compareTrustCopy.js` + guidance strip review |
| Behavioral learning | Weekly | Product ops | `/admin/behavioral-intelligence` trends |

## Ownership realism review process

1. Load **Ownership intelligence** admin — sort by lowest `ownershipRealismScore`.
2. Review flags: `weak_apartment_practicality`, `weak_highway_practicality`, `overconfident_ownership_copy`.
3. Confirm caveats match catalog data (home charging, range, service notes).
4. Escalate NEEDS_REVIEW / LOW_CONFIDENCE vehicles to catalog governance before marketing emphasis.

## Charging practicality review

1. Review `apartment_charging_risk` and `charging_confidence_low` flags.
2. Cross-check `chargingPracticality` labels in catalog meta vs ops scores.
3. Do not promote long-trip copy when `unrealistic_long_trip_recommendation` is set.

## Recommendation QA discipline

- Immature compare pairs (large score gap, duplicate strengths) require editorial sign-off.
- High-traffic + weak maturity pairs get priority in compare calibration.
- `recommendation_doubted` and `compare_abandon_after_guidance` spikes trigger trust review within 48h.

## Stale intelligence detection

- Weekly snapshots in `ownershipRealismOps` and `recommendationMaturityOps` localStorage (ops browser).
- Regression when `maturityTrend === realism_regression` or trusted % drops >10 pts week-over-week.
- Catalog freshness escalations block TRUSTED promotion until resolved.

## Release stabilization

Before public beta expansion:

1. `npm run build`
2. `npm run media:verify`
3. `npm run seo:qa`
4. `npm run post-launch:smoke`
5. Review `trusted-ownership-intelligence-report.md`

## Escalation workflow

1. **P3** — Single vehicle LOW_CONFIDENCE → catalog ticket.
2. **P2** — Compare pair immature + rising traffic → compare calibration + copy review.
3. **P1** — Trust decay alerts (abandon > completion, elevated doubt) → freeze compare CTA emphasis until resolved.

## Metadata on exports

All ops exports include:

- `generatedAt` — audit timestamp
- `exportMeta.confidenceLevel` — report-level confidence
- Per-row `auditAt` where applicable (recommendation maturity)
- `privacyNote` on behavioral exports — session buffer only, no fingerprinting
