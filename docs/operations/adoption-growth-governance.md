# Adoption growth governance

Authority distribution, retention, and controlled scaling for EVSavari public beta.

## Cadence

| Workflow | Frequency | Owner |
|----------|-----------|-------|
| Authority content | Bi-weekly | Content ops |
| Recommendation durability | Weekly | Editorial trust |
| Retention quality | Weekly | Market ops |
| Trust-assisted conversion | Weekly | Conversion ops |
| Acquisition quality | Weekly | Growth ops |

## Scaling readiness gates

Broader acquisition allowed when **all** are true for two consecutive weekly reviews:

1. Users adopting EVSavari as a trusted research platform — Yes
2. Authority usefulness compounding — Yes
3. Recommendation durability healthy — Yes
4. Retention quality stable — Yes
5. Ready for broader acquisition — Ready

## Escalation

| Level | Trigger | Action |
|-------|---------|--------|
| P2 | Retention trend declining two weeks | Pause paid acquisition |
| P3 | Weak authority retention paths > 5 | Editorial sprint on top guides |

## Rollback

- Revert threshold tuning via git only.
- Hold traffic if `adoptionMaturityTrend` is not maturing.

## Metadata

Exports must include: `adoptionReviewAt`, `authorityReviewOwner`, `trustRetentionReviewAt`, `operationalReadinessAt`.
