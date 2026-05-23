# Unified production governance — EVSavari

Operational discipline for public beta: catalog trust, behavioral learning, media ops, and release stabilization.

---

## Media ingestion discipline

1. Source assets must be OEM press, dealer-approved packs, or documented CC-BY-SA editorial (temporary only).
2. Upload to Cloudinary under `evsavari/catalog/families/{family}/{role}` (extensionless for hero/listing/compare/og).
3. Run `npm run media:verify` — production-critical roles must probe OK before publish.
4. Use `/admin/media-staging` for review queue; **no auto-publish** without ops approval.
5. Replace editorial seeds with OEM packs when available (`docs/operations/tier1-cloudinary-seed.json`).

---

## Recommendation calibration discipline

1. Compare scores use deterministic `scoringEngine` + catalog intelligence — no paid placement.
2. Status bands: TRUSTED / GOOD / NEEDS_REVIEW / LOW_CONFIDENCE (`catalogIntelligenceOps`, `recommendationRealismOps`).
3. Do not ship compare pairs with contradictory strengths or unrealistic score gaps without editorial review.
4. Wording must use directional language when confidence is low (`compareTrustCopy.js`).

---

## Trust-review cadence

| Cadence | Action |
|---------|--------|
| Daily (beta) | `/admin/public-beta-ops` — decay alerts, stability score |
| Weekly | Export CSV from catalog-intelligence, behavioral-intelligence, media-staging |
| Weekly | Record snapshots (auto on dashboard refresh) |
| Pre-release | `npm run post-launch:smoke` + `media:verify` |

---

## Compare QA cadence

1. `/admin/compare-quality` — pair STRONG/NEEDS_REVIEW
2. `/admin/compare-calibration` — editorial calibration queue
3. Spot-check mobile compare for broken images and trust copy

---

## Stale-catalog review cadence

1. `/admin/catalog-freshness` — escalations
2. `/admin/catalog-intelligence` — stale pricing/spec flags
3. Backend freshness metadata must be updated with price/spec changes

---

## Weekly behavioral review

1. `/admin/behavioral-intelligence` — engagement quality, bounce pairs, weak clusters
2. Buffer-only analytics — no fingerprinting, no cross-site tracking
3. Investigate `high_bounce_compare` and `weak_conversion_compare` spikes

---

## Release stabilization process

1. `npm run build`
2. `npm run media:verify`
3. `npm run seo:qa`
4. `npm run post-launch:smoke`
5. `npm run media:staging-audit` (if media changed)
6. Review `docs/launch/unified-production-intelligence-report.md`

---

## Rollback guidance

| Issue | Action |
|-------|--------|
| Broken Cloudinary assets | Revert manifest family slug or re-upload; verify with `media:verify` |
| Compare trust regression | Disable affected pair in editorial queue; fix catalog meta |
| Analytics spike false positive | Clear usage buffer key (ops only, documented) |
| Beta instability | Roll back last deploy; keep admin dashboards on previous build |

---

## Operational escalation rules

| Severity | Trigger | Owner |
|----------|---------|-------|
| P0 | Production compare 404 images for tier-1 | Media ops + frontend |
| P1 | `brokenCoreAssetCount > 0` on verify | Media ops |
| P2 | `trustDecayAlertCount` elevated 2+ weeks | Product + editorial |
| P3 | LOW_CONFIDENCE catalog > 30% vehicles | Catalog ops |

---

## Metadata requirements

Exports from admin dashboards include:

- `exportMeta.reportType`, `exportMeta.version`, `exportMeta.generatedAt`
- `exportMeta.confidenceLevel` where applicable
- Weekly snapshots: `week`, `at` ISO timestamps
- Privacy note on behavioral exports: session-scoped buffer only

---

## Related commands

```bash
npm run media:verify
npm run media:staging-audit
npm run media:upload-tier1
npm run post-launch:smoke
```
