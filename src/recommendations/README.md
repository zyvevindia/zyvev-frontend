# EVSavari Buyer Archetypes

Buyer archetypes describe **who is shopping** and **what they prioritise**. They are editorial context labels — not vehicle rankings, scores, or compare outcomes.

## What archetypes are

Each `BuyerArchetype` captures a reusable buyer context:

- Daily distance band
- Budget band
- Family and highway needs
- Charging situation
- Primary purchase priority

Archetypes help EVSavari explain recommendations in human terms without turning buyers into leaderboard positions.

## What archetypes are not

- **Not rankings** — no archetype implies a vehicle is “#1” or “best overall”.
- **Not scores** — archetypes do not replace Score 2.0 tiers or EV Intelligence.
- **Not compare logic** — archetypes do not power head-to-head winner selection.

## Module layout

| File | Purpose |
|------|---------|
| `types.js` | `BuyerArchetype` and supporting range types |
| `constants.js` | Archetype IDs and shared enums |
| `archetypes.js` | Canonical archetype definitions |
| `archetypeRegistry.js` | `getBuyerArchetype`, `listBuyerArchetypes` |
| `buildArchetypeNarrative.js` | Short editorial narratives per archetype |
| `buildArchetypeFit.js` | Deterministic archetype ↔ vehicle fit engine |
| `fitConstants.js` | Fit tiers, primary dimensions, confidence labels |
| `fitRegistry.js` | `getArchetypeFit`, `listVehicleFits` (lazy) |
| `buildRecommendationNarrative.js` | Headline, summary, why-it-fits, considerations |
| `recommendationRegistry.js` | `getRecommendationNarrative`, `listVehicleRecommendations` (lazy) |
| `buildBuyerRecommendationProfile.js` | Normalized single-archetype recommendation profile |
| `buildVehicleRecommendationProfiles.js` | All seven profiles for one vehicle |
| `selectTopArchetypes.js` | Top / secondary / weak fit selection |
| `buildBuyerGuidance.js` | Who should buy / who should look elsewhere |
| `buildRecommendationExplanation.js` | Primary recommendation, trade-offs, confidence |
| `recommendationProfileRegistry.js` | Full vehicle recommendation bundle (lazy) |

## Phase map

| Phase | Capability |
|-------|------------|
| **14C.4** | Buyer recommendation profiles — normalized per-archetype objects |
| **14C.5** | Top fit selection — strongest and weakest buyer matches |
| **14C.6** | Buyer guidance — who should buy / look elsewhere + structured explanations |

## Future usage

| Phase | Use |
|-------|-----|
| **14D** | Compare Intelligence |
| **15** | AI Buyer Assistant |
| **16** | Conversational Recommendation Engine |

## Development

```bash
node scripts/archetype-smoke.mjs
node scripts/fit-engine-smoke.mjs
node scripts/recommendation-smoke.mjs
```

Smoke output validates fit tiers, narratives, top-fit buckets, buyer guidance, and explanation blocks for tier-1 vehicles.
