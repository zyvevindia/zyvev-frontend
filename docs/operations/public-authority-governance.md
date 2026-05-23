# Public authority governance

Cadence and gates for operating EVSavari as a **trusted public EV ownership intelligence** platform.

## Review cadence

| Review | Cadence | Owner | Surface |
|--------|---------|-------|---------|
| Authority content | Weekly | content-ops | `/admin/content-usefulness` |
| Trusted discovery | Bi-weekly | growth-ops | `/admin/public-beta-ops` |
| Recommendation durability | Weekly | editorial-trust | `/admin/recommendation-refinement` |
| Conversion trust | Weekly | conversion-ops | `/admin/conversion-refinement` |
| SEO authority depth | Monthly | seo-editorial | `/admin/seo-authority` |
| Media trust polish | Monthly | media-ops | `/admin/media-health` |
| Adoption maturity | Weekly | beta-ops | `/admin/public-beta-ops` |

## Weekly snapshots

`evsavari-public-authority-weekly-v1` (browser buffer) records:

- Authority usefulness score  
- Trusted session ratio  
- Public authority maturity  
- Trusted discovery quality  

## Composite gate: `readyForBroaderVisibility`

Requires (from `buildPublicAuthorityMaturitySummary`):

- Retention quality healthy  
- Public authority maturity beyond early building  
- Recommendation persistence strong or stability durable  
- Trusted discovery healthy  
- SEO authority compounding healthy  

## Rollback discipline

| Trigger | Action |
|---------|--------|
| `publicAuthorityMaturity` stalls while traffic rises | Pause outreach; review weak authority clusters |
| `trustedDiscoveryQuality` declines | Pause community promotion |
| `recommendationFatigueTrend` elevated | Editorial calibration; no new CTAs |
| `weakTrustPersistenceBeforeLead` elevated | Review compare-to-lead copy and doubt clusters |

## Metadata

Export bundles include `releaseMeta` with `authorityReviewAt`, `trustedDiscoveryReviewAt`, `recommendationDurabilityReviewAt`, `conversionTrustReviewAt`.

## Related docs

- [Public authority operations playbook](../content/public-authority-operations-playbook.md)
- [Trusted discovery playbook](../growth/trusted-discovery-playbook.md)
- [Retention & authority governance](./retention-authority-governance.md)
