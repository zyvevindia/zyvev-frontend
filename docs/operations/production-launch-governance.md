# Production launch governance

Cadence for **production UX**, **performance stability**, **recommendation durability**, and **trusted public launch**.

## Review cadence

| Review | Cadence | Owner | Surface |
|--------|---------|-------|---------|
| Production UX quality | Weekly | content-ops | `/admin/content-usefulness` |
| Performance & stability | Weekly | platform-ops | `/admin/public-beta-ops` |
| Recommendation durability | Weekly | editorial-trust | `/admin/recommendation-refinement` |
| Conversion trust | Weekly | conversion-ops | `/admin/conversion-refinement` |
| Authority content quality | Weekly | seo-editorial | `/admin/seo-authority` |
| Media & visual quality | Monthly | media-ops | `/admin/media-health` |

## Weekly snapshots

`evsavari-production-launch-weekly-v1` — production quality maturity, launch confidence, perceived speed, stability health.

## Launch gates

### `readyForPublicProductionLaunch`

Requires:

- `readyForDisciplinedExpansion` (from public experience / trusted scaling stack)  
- `productionStabilityHealthy` = true  
- `perceivedSpeedQuality` ≠ `slow`  
- `productionLaunchConfidence` = `confident`  

### Weekly production review

1. Platform quality stable?  
2. Recommendations remaining useful?  
3. Authority usefulness compounding?  
4. Performance healthy?  
5. Ready for public production launch?  

## Rollback discipline

| Trigger | Action |
|---------|--------|
| `regressionEarlyWarning` non-empty | Pause acquisition; fix compare/media regressions first |
| `compareLatencyAlert` | Profile compare render; no framework migration |
| `weakRecommendationDurability` = weak | Editorial calibration on flagged pairs |
| `mediaRegressionAlert` | Manifest/OEM image pass before marketing push |

## Metadata

`releaseMeta` on `productionLaunch` bundle:

- `performanceReviewAt`  
- `recommendationQualityReviewAt`  
- `publicQualityReviewAt`  
- `trustQualityReviewAt`  
- `authorityReviewOwner` (content-ops)  

## Related

- [Production-quality content playbook](../content/production-quality-content-playbook.md)
- [Public experience governance](./public-experience-governance.md)
- [Production launch readiness report](../launch/production-launch-readiness-report.md)
