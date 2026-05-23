# Public beta stabilization governance

Learning + refinement + stability discipline for controlled public beta.

## Weekly beta review (Monday)

1. `/admin/public-beta-ops` — cockpit + weekly summary + stability trend
2. `/admin/trust-feedback` — doubt clusters and friction score
3. `/admin/behavioral-intelligence` — completion and bounce pairs
4. Export stabilization bundle CSV if friction > 45

## Recommendation calibration (Wednesday)

1. Review calibration queues on public beta ops + recommendation maturity
2. Tune copy/caveats before score threshold changes
3. Log changes in catalog governance — no silent score drift

## Trust feedback review

- Triage `mostDoubtedComparePairs` within 48h when count ≥ 3
- Cross-check `overconfident_but_distrusted` with editorial picks
- Escalate P1 if `guidance_confusion_spike` + declining beta stability

## Compare QA workflow

1. Top 5 traffic pairs from weekly summary
2. Manual compare: trust explain, guidance strip, CTA clarity
3. `npm run post-launch:smoke` after compare copy changes

## Content authority review

- Follow `docs/seo/authority-cluster-roadmap.md`
- One cluster deepened per bi-weekly cycle
- No new URLs without sitemap + `seo:qa` pass

## Media QA

- `docs/operations/media-beta-polish-checklist.md`
- Block beta expansion if `mediaRegressionAlert` active

## Rollback discipline

1. Revert frontend copy deploy first (fast)
2. Catalog rollback via staged publish — not production DB edits
3. Document incident in ops audit log

## Production incident escalation

| Severity | Trigger | Action |
|----------|---------|--------|
| P1 | Beta stability declining + trust decay | Pause compare highlights |
| P2 | Compare latency alert ≥ 3 events | Profile trust-layer payload |
| P3 | Single pair doubt spike | Editorial compare review |

## Metadata

- `releaseMeta` on public beta ops export
- `betaStabilizationOps` weekly snapshots (browser localStorage until backend)
- `exportMeta.reviewOwner`: beta-ops
