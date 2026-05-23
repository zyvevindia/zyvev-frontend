# Live platform governance

Cadence for **live operations**, **real traffic readiness**, **recommendation durability**, and **production stability**.

## Review cadence

| Review | Cadence | Owner | Surface |
|--------|---------|-------|---------|
| Live platform health | Weekly | platform-ops | `/admin/public-beta-ops` |
| Real traffic readiness | Weekly | growth-ops | `/admin/public-beta-ops` |
| Production UX & content freshness | Weekly | content-ops | `/admin/content-usefulness` |
| Recommendation durability under scale | Weekly | editorial-trust | `/admin/recommendation-refinement` |
| Conversion quality under traffic | Weekly | conversion-ops | `/admin/conversion-refinement` |
| Performance & media | Weekly | platform-ops | `/admin/media-health` |

## Weekly snapshots

`evsavari-live-platform-weekly-v1` — live production maturity, launch confidence, platform stability under traffic.

## Launch gates

### `readyForBroaderPublicLaunch`

Requires:

- `readyForPublicProductionLaunch` (production stack)  
- `readyForBroaderPublicTraffic` (market validation)  
- `platformStableUnderRealTraffic` = true  
- `recommendationsStableUnderUsage` = true  

### Live platform review (weekly)

1. Platform healthy under traffic?  
2. Recommendations stable under usage?  
3. Repeat-user quality healthy?  
4. Authority content fresh?  
5. Operational stability healthy?  

## Rollback & escalation

| Trigger | Action |
|---------|--------|
| `regressionEarlyWarning` | Pause traffic experiments; platform-ops triage |
| `compareLatencyAlert` | Compare performance review (no framework rewrite) |
| `distrustRecurringUnderGrowth` | Editorial calibration on flagged pairs |
| `weakPracticalContentFreshness` = stale | Content freshness pass before SEO push |
| `mediaRegressionAlert` | Media manifest review before campaigns |

Escalate to **live-platform-ops** when stability and trust signals diverge for two consecutive weeks.

## Metadata

`releaseMeta` on `livePlatform` bundle:

- `liveTrafficReviewAt`  
- `performanceReviewAt`  
- `recommendationQualityReviewAt`  
- `trustQualityReviewAt`  
- `authorityReviewOwner` (content-ops)  

## Related

- [Live authority operations playbook](../content/live-authority-operations-playbook.md)
- [Production launch governance](./production-launch-governance.md)
- [Live platform readiness report](../launch/live-platform-readiness-report.md)
