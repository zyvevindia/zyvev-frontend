# Real-world learning governance

Disciplined beta operations for acquisition quality, trust learning, and controlled scaling.

## Review cadence

| Workflow | Cadence | Owner | Admin |
|----------|---------|-------|-------|
| Acquisition review | Weekly | Growth ops | Public beta ops |
| Trust learning | Weekly | Editorial trust | Trust feedback, rec. refinement |
| Recommendation calibration | Weekly | Editorial trust | Recommendation refinement |
| Authority content | Bi-weekly | SEO editorial | Content usefulness |
| Conversion quality | Weekly | Conversion ops | Conversion refinement |
| Media trust visuals | Weekly | Media ops | Media health |

## Scaling readiness gates

Expand acquisition only when **all** are true for two consecutive weekly reviews:

1. `platformLearningEffectively` — Yes
2. `trafficQualityHealthy` — Yes
3. `trustStabilityAcceptable` — Yes
4. `recommendationQualityImproving` — Yes
5. `authorityUsefulnessCompounding` — Yes

## Processes

### Acquisition

- Use session-level channel labels only (UTM + referrer host).
- No fingerprinting, no cross-site tracking, no dark patterns.
- Review best vs weak sources in public beta ops before budget changes.

### Trust learning

- Tune thresholds in existing ops modules only.
- Document calibration in export `reviewOwner` and `learningQualityReviewAt`.

### Rollback

- Revert threshold changes via git.
- Hold acquisition if `acquisitionVolatility` is high.

## Metadata

Exports must include:

- `generatedAt`
- `reviewOwner`
- `learningQualityReviewAt`
- `scalingReadinessReviewAt`

## Validation before scale

```bash
npm run build
npm run seo:qa
npm run media:verify
npm run post-launch:smoke
```

See `docs/launch/real-world-learning-readiness-report.md` after each sprint closeout.
