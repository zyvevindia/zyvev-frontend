# Controlled beta operations governance

Operational discipline for EVSavari controlled public beta — calibration, content, trust, stability.

## Ownership

| Area | Primary owner | Review cadence |
|------|---------------|----------------|
| Recommendation calibration | Editorial trust | Weekly |
| Authority content | SEO editorial | Bi-weekly |
| Trust conversion | Conversion ops | Weekly |
| Media quality | Media ops | Weekly |
| Beta scaling | Beta ops | Weekly snapshot |

## Workflows

### Recommendation calibration

1. Open `/admin/recommendation-refinement`.
2. Review **most unstable compare pairs**, **high-confidence but distrusted**, **requires editorial calibration**.
3. Tune thresholds in maturity/realism ops only — no new scoring engines.
4. Log review in export metadata (`calibrationReviewAt`, `reviewOwner`).

### Authority content review

1. Open `/admin/seo-authority` and `/admin/content-usefulness`.
2. Address `weakTrustContentClusters`, `ownershipContentGaps`, `chargingContentGaps`.
3. Improve compare ↔ guide linking before creating new URLs.
4. Follow `docs/seo/authority-compounding-strategy.md`.

### Trust-conversion review

1. Open `/admin/conversion-refinement`.
2. Review weak trust-to-lead journeys and high doubt before lead.
3. Refine calm CTA copy only — no urgency modals or manipulative patterns.

### Media quality review

1. Run `npm run media:verify`.
2. Open `/admin/media-health` — OEM replacement, social coverage, visual hotspots.
3. Replace manifest assets; do not change Cloudinary architecture.

### Beta scaling discipline

1. Open `/admin/public-beta-ops` → operational maturity block.
2. Confirm: safe to expand acquisition, recommendation maturity healthy, trust volatility acceptable, authority depth improving.
3. If any **Caution/Review**, hold paid acquisition.

## Escalation

| Severity | Trigger | Action |
|----------|---------|--------|
| P1 | Compare latency alert + trust decay | Pause acquisition; perf triage |
| P2 | Media regression alert | Manifest fix within 48h |
| P3 | Editorial calibration queue > 10 | Schedule calibration sprint |

## Rollback discipline

- Revert threshold changes via git; never hot-patch production scoring in browser.
- Weekly snapshots in localStorage are advisory until backend persistence ships.

## Release stabilization

Before expanding traffic:

1. `npm run build`
2. `npm run seo:qa`
3. `npm run media:verify`
4. `npm run post-launch:smoke`
5. Export public beta ops + controlled beta operations report

## Metadata

All ops exports should include:

- `generatedAt`
- `reviewOwner`
- `stabilityReviewAt` (public beta / maturity bundles)
