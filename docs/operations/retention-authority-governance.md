# Retention & authority governance

Operational cadence for EVSavari’s retention, community discovery, authority usefulness, and recommendation durability — without architecture changes or dashboard sprawl.

## Review cadence

| Review | Cadence | Owner | Surface |
|--------|---------|-------|---------|
| Retention quality | Weekly | beta-ops | `/admin/public-beta-ops` |
| Authority usefulness | Weekly | content-ops | `/admin/content-usefulness` |
| Recommendation durability | Weekly | editorial-trust | `/admin/recommendation-refinement` |
| Community discovery | Bi-weekly | growth-ops | `/admin/public-beta-ops` |
| Conversion retention | Weekly | conversion-ops | `/admin/conversion-refinement` |
| SEO authority depth | Monthly | seo-editorial | `/admin/seo-authority` |
| Media trust polish | Monthly | media-ops | `/admin/media-health` |

## Metadata (export bundles)

Reports include `releaseMeta` timestamps:

- `retentionQualityReviewAt`
- `authorityReviewOwner` / `content-ops`
- `recommendationDurabilityReviewAt`
- `communityDiscoveryReviewAt`
- `conversionRetentionReviewAt`

Weekly snapshots: `evsavari-retention-authority-weekly-v1` (browser buffer until backend persistence).

## Trust-retention calibration

1. Compare completion and doubt rates inform recommendation refinement only — no new scoring engines.  
2. Return-user trust uses session buffer: repeat compare, guide revisits, trusted session ratio.  
3. Community signals are channel-level only (WhatsApp, LinkedIn, community) — no PII.  

## Scaling readiness gates

Proceed with broader acquisition or community outreach only when `buildRetentionAuthorityMaturitySummary` reports:

- `retentionQualityHealthy`
- `retentionAuthorityReady` (composite gate)
- `recommendationDurabilityHealthy` or `recommendationDurabilityConfidence` = `confident`
- `communityDiscoveryMaturity` ≠ `early` (when promoting shares)

## Rollback discipline

| Trigger | Action |
|---------|--------|
| `retentionQualityEvolution` = `declining` | Pause acquisition experiments; review doubt clusters |
| `weakTrustPersistence` = `weak` | Editorial calibration queue first |
| `recommendationFatigueDetection` = `elevated` | Reduce compare messaging density; no new CTAs |
| `weakShareJourneys` with falling trusted ratio | Pause community templates |

## Related playbooks

- [Community distribution playbook](../growth/community-distribution-playbook.md)
- [Trusted authority retention playbook](../content/trusted-authority-retention-playbook.md)
- [Adoption growth governance](./adoption-growth-governance.md)
