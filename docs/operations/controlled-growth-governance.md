# Controlled growth governance

## Traffic expansion discipline

- One channel increment per week; document in growth playbook
- Require `safeToScaleTraffic === true` on public beta ops before paid/amplified pushes
- Roll back channel if high-bounce acquisition sources appear in growth report

## Beta observation cadence

| Day | Activity |
|-----|----------|
| Monday | Public beta ops + weekly summary |
| Wednesday | Recommendation refinement queue |
| Friday | Conversion refinement + trust feedback |

## Recommendation calibration

- Human calibration queue from `/admin/recommendation-refinement`
- Threshold changes require editorial sign-off — no silent score drift
- Volatility trend `rising` → freeze compare highlight changes

## Trust review

- Doubt clusters within 48h when count ≥ 3 per pair
- Trust stability healthy check on public beta ops

## SEO authority review

- Follow `docs/seo/trusted-authority-expansion-roadmap.md`
- `seo:qa` must pass before new internal link campaigns

## Conversion review

- `/admin/conversion-refinement` weekly
- No urgency modals, countdowns, or manipulative CTA changes

## Rollback

1. Revert frontend deploy (copy/CTA)
2. Reduce traffic to last stable channel mix
3. Log in ops audit with `releaseMeta.phase`

## Escalation

| Level | Trigger |
|-------|---------|
| P1 | `safeToScaleTraffic` false + declining stability 2 weeks |
| P2 | Recommendation volatility rising + elevated doubt |
| P3 | Single weak compare pair — refinement queue only |

## Metadata

- `releaseMeta` on `buildControlledGrowthBundle` exports
- `exportMeta.reviewOwner` per report type (beta-ops, editorial-trust, conversion-ops)
- `calibrationReviewAt` on recommendation refinement exports
