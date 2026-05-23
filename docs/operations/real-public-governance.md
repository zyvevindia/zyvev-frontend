# Real public operations governance

Cadence for **live public operations**, **traffic discipline**, and **production execution**.

## Review cadence

| Review | Cadence | Owner | Surface |
|--------|---------|-------|---------|
| Live platform health | Weekly | platform-ops | `/admin/public-beta-ops` |
| Disciplined traffic | Weekly | growth-ops | `/admin/public-beta-ops` |
| Recommendation trust under traffic | Weekly | editorial-trust | `/admin/recommendation-refinement` |
| Authority content cadence | Weekly | content-ops | `/admin/content-usefulness` |
| Conversion under traffic | Weekly | conversion-ops | `/admin/conversion-refinement` |
| Media & performance | Weekly | platform-ops | `/admin/media-health` |

## Weekly snapshots

`evsavari-real-public-weekly-v1` — live production maturity, broader launch confidence, platform stability.

## Gates

### `readyForBroaderPublicLaunch`

Requires:

- `readyForBroaderPublicLaunch` (live platform stack)  
- `readyForWiderPublicTraffic` (market validation)  
- `publicPlatformHealthPersistence` = `persistent`  
- `recommendationsStableUnderTraffic` = true  

### Weekly operational review

1. Platform healthy under live traffic?  
2. Recommendations stable under usage?  
3. Authority content fresh?  
4. Repeat-user quality healthy?  
5. Operational stability healthy?  

## Rollback & escalation

| Trigger | Action |
|---------|--------|
| `regressionEarlyWarning` | Pause wider traffic; platform-ops triage |
| `distrustRecurringUnderUsage` | Editorial calibration on flagged pairs |
| `weakPracticalContentFreshness` = stale | Content cadence pass before promotion |
| Two-week trust/performance divergence | Escalate to real-public-ops lead |

## Metadata

`releaseMeta` on `realPublicOperations` bundle:

- `operationalEscalationReviewAt`  
- `liveTrafficReviewAt`  
- `recommendationQualityReviewAt`  
- `trustQualityReviewAt`  
- `authorityReviewOwner` (content-ops)  

## Related

- [Real public operations playbook](../content/real-public-operations-playbook.md)
- [Live platform governance](./live-platform-governance.md)
- [Real public readiness report](../launch/real-public-readiness-report.md)
