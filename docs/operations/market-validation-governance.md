# Market validation governance

Real-user retention and authority growth discipline for controlled public beta.

## Review cadence

| Area | Cadence | Owner | Admin |
|------|---------|-------|-------|
| Retention quality | Weekly | Market ops | Public beta ops |
| Authority usefulness | Bi-weekly | SEO editorial | Content usefulness |
| Recommendation durability | Weekly | Editorial trust | Recommendation refinement |
| Trust-retention calibration | Weekly | Editorial trust | Trust feedback |
| Acquisition quality | Weekly | Growth ops | Public beta ops |
| Conversion quality | Weekly | Conversion ops | Conversion refinement |

## Scaling readiness gates

Expand traffic when **all** hold for two consecutive weekly reviews:

1. Users returning because trust is improving — Yes
2. Authority usefulness compounding — Yes
3. Recommendation quality stabilizing — Yes
4. Retention quality healthy — Yes
5. Platform learning effectively — Yes

## Workflows

### Retention review

1. Open `/admin/public-beta-ops` — market validation & learning maturity.
2. Review return-user trust, repeat compare quality, high-return pairs.
3. Export weekly snapshot with `retentionQualityReviewAt` metadata.

### Recommendation durability

1. Open `/admin/recommendation-refinement`.
2. Confirm recommendations improving, review persistent distrust and weak recovery pairs.
3. Threshold tuning only — no new scoring engines.

### Authority content

1. `/admin/content-usefulness` + `/admin/seo-authority`.
2. Follow `docs/seo/market-authority-expansion-plan.md`.

## Rollback discipline

- Revert threshold changes via git.
- Hold acquisition if retention maturity trend declines two weeks in a row.

## Metadata

Exports include: `retentionQualityReviewAt`, `recommendationDurabilityReviewAt`, `reviewOwner`, `scalingReadinessReviewAt`.
