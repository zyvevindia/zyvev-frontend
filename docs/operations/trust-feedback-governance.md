# Trust feedback governance

Operational discipline for recommendation doubt signals, trust decay, and compare guidance calibration during public beta.

## Principles

- Doubt signals are **directional**, not verdicts — they prioritize editorial review, not automatic downgrades.
- User-facing affordances stay **calm and optional** — no alarmist modals or “wrong recommendation” framing.
- All scoring remains **deterministic** and explainable in ops exports.

## Review cadence

| Activity | Cadence | Dashboard | Owner |
|----------|---------|-----------|-------|
| Doubt cluster triage | Weekly | `/admin/trust-feedback` | Trust ops |
| Trust decay review | Weekly | `/admin/public-beta-ops` | Product ops |
| Compare realism QA | Per pair change | `/admin/compare-calibration` | Editorial |
| Guidance copy review | Monthly | Compare trust + ownership guidance | Editorial |
| High-doubt compare escalation | Within 48h of spike | Trust feedback + maturity | Trust ops |

## Recommendation doubt review

1. Open **Trust feedback** — sort by doubt count and trust friction score.
2. Cross-check **Recommendation maturity** for the same pair.
3. If `overconfident_but_distrusted` — reduce compare emphasis until catalog or copy is corrected.
4. Log resolution in catalog governance; do not delete buffer events.

## Trust decay escalation

| Level | Trigger | Action |
|-------|---------|--------|
| P3 | Single pair doubt ≥ 2 in buffer | Add to compare calibration queue |
| P2 | `guidance_confusion_spike` or abandon-after-guidance ≥ 3 | Review guidance copy; pause paid traffic to pair |
| P1 | Friction score > 60 + declining maturity trend | Cockpit review; freeze recommendation highlight |

## Compare realism QA

- Validate immature pairs with `unrealistic_compare_separation` or `compare_realism_disagreement`.
- Confirm suitability lines match catalog intelligence.
- Re-run `npm run post-launch:smoke` after editorial changes.

## Metadata on exports

Trust feedback exports include:

- `generatedAt` — audit timestamp
- `exportMeta.reviewOwner` — default trust-ops
- Volatility and friction scores for week-over-week comparison

## Operational review ownership

- **Trust ops** — doubt clusters, friction, decay alerts
- **Editorial** — copy, caveats, compare picks
- **Catalog ops** — ownership/charging data fixes behind distrust
