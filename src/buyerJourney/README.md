# EVSavari Buyer Journey Engine

The Buyer Journey Engine shifts EVSavari from **Vehicle → Buyer** to **Buyer → Vehicle**. Buyers describe their needs; the engine returns vehicles grouped by fit quality — not ranked lists or numeric scores.

## Vehicle → Buyer vs Buyer → Vehicle

| Vehicle → Buyer | Buyer → Vehicle |
|-----------------|-----------------|
| Start from a vehicle page | Start from buyer inputs |
| Explain who the EV suits | Find EVs that suit the buyer |
| Compare two known models | Recommend from the full tier-1 catalog |

This module is the deterministic foundation for buyer-first recommendations. Phase 15 adds conversational AI on top — it does not replace this engine.

## Buyer input model

`BuyerJourneyInput` captures six fields:

| Field | Examples |
|-------|----------|
| `budgetRange` | `10-15L`, `15-20L`, `20-30L`, `30L+` |
| `dailyDistanceRange` | `<30`, `30-60`, `60-100`, `100+` |
| `familySize` | `single`, `couple`, `family`, `largeFamily` |
| `chargingAccess` | `homeCharging`, `apartmentCharging`, `publicCharging` |
| `usagePattern` | `city`, `mixed`, `highway` |
| `priority` | `runningCost`, `familyPracticality`, `highwayCapability`, `premiumExperience`, `value`, `easeOfOwnership` |

## Recommendation buckets

Vehicles are grouped into four buckets — **never ranked** inside or across buckets:

| Bucket | Fit signal |
|--------|------------|
| `strongMatches` | Excellent/good anchor fit with aligned top-fit profiles |
| `goodAlternatives` | Moderate fit — workable with trade-offs |
| `worthConsidering` | Contextual matches via secondary fit or compare intelligence |
| `weakFits` | Limited/insufficient fit for this buyer profile |

Within each bucket, vehicles are ordered **alphabetically** — not as #1, #2, #3.

## Module layout

| File | Purpose |
|------|---------|
| `types.js` | Input, bucket, explanation, and guidance types |
| `constants.js` | Input enums and archetype mapping tables |
| `resolveBuyerArchetypes.js` | Deterministic input → archetype resolver |
| `buildBuyerRecommendations.js` | Bucket assignment from fit + profiles |
| `buildBuyerRecommendationExplanation.js` | Per-vehicle headline, summary, strengths, trade-offs |
| `buildBuyerJourneyGuidance.js` | Who should focus / consider alternatives |
| `buildBuyerJourney.js` | Full journey orchestrator |
| `buyerJourneyRegistry.js` | `getBuyerJourney`, `listBuyerJourneys` (lazy) |
| `index.js` | Public exports |

## Data sources (read-only)

- `src/recommendations/` — archetype fits and recommendation profiles
- `src/compareIntelligence/` — contextual alternatives
- `src/score2/` — score profiles (via recommendation layer)

This module does **not** modify those systems.

## What the Buyer Journey Engine is not

- **Not UI** — no pages or components in Phase 14E
- **Not rankings** — no overall winner, stars, or percentages
- **Not AI chat** — deterministic rules only
- **Not score changes** — reads Score 2.0 output read-only

## Future usage

| Phase | Use |
|-------|-----|
| **15** | AI Buyer Assistant |

## Development

```bash
node scripts/buyer-journey-smoke.mjs
```

Smoke output validates three editorial buyer scenarios: family/value mixed usage, city apartment commuter, and premium highway buyer.
