# Trusted growth governance

Operational cadence for EVSavari **trusted growth & public presence** — discovery, habit formation, authority, recommendations, and conversion trust.

## Review cadence

| Review | Cadence | Owner | Surface |
|--------|---------|-------|---------|
| Trusted discovery | Weekly | growth-ops | `/admin/public-beta-ops` |
| Retention & habit | Weekly | beta-ops | `/admin/public-beta-ops` |
| Authority usefulness | Weekly | content-ops | `/admin/content-usefulness` |
| Recommendation durability | Weekly | editorial-trust | `/admin/recommendation-refinement` |
| Conversion trust | Weekly | conversion-ops | `/admin/conversion-refinement` |
| SEO authority depth | Monthly | seo-editorial | `/admin/seo-authority` |
| Media trust quality | Monthly | media-ops | `/admin/media-health` |

## Weekly snapshots

`evsavari-trusted-growth-weekly-v1` records trusted discovery quality, session ratio, habit formation, and maturity trend.

## Composite gate: `readyForDisciplinedGrowth`

Requires:

- `readyForBroaderVisibility` (public authority layer)  
- `recommendationTrustPersistence` = `strong`  
- `recommendationHabitFormation` beyond `early`  
- `practicalGuideTrustRetention` = `trusted`  

## Rollback discipline

| Trigger | Action |
|---------|--------|
| `weakPracticalDiscovery` grows | Pause outreach; fix guide entry paths |
| `weakRepeatUseFlows` elevated | Review doubt clusters before acquisition |
| `recommendationFatigueEvolution` = `elevated` | Editorial calibration; no new CTAs |
| `lowTrustAbandonmentPersistence` = `elevated` | Review compare-to-lead copy |

## Metadata

`buildTrustedGrowthMaturitySummary` export includes `releaseMeta` with `trustedDiscoveryReviewAt`, `retentionQualityReviewAt`, `recommendationDurabilityReviewAt`, `conversionTrustReviewAt`, `authorityReviewOwner`.

## Related docs

- [Trusted growth content playbook](../content/trusted-growth-content-playbook.md)
- [Public authority governance](./public-authority-governance.md)
- [Retention & authority governance](./retention-authority-governance.md)
