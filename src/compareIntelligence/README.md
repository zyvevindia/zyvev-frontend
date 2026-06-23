# EVSavari Compare Intelligence

Compare Intelligence transforms EV comparison from specification tables into **buyer-centric trade-offs**. It reads Score 2.0 profiles and recommendation intelligence read-only — it does not modify scores, rankings, or compare UI.

## Philosophy

- **Trade-offs, not winners** — comparisons explain where each vehicle suits different buyer priorities.
- **No rankings** — no overall winner, leaderboard position, or numeric score.
- **Constructive language** — advantages and trade-offs help buyers decide; they do not declare one vehicle “better”.
- **Lazy generation** — profiles materialize on lookup from live intelligence data, not hardcoded JSON.

## Module layout

| File | Purpose |
|------|---------|
| `types.js` | Comparison profile and outcome types |
| `constants.js` | Dimension keys, archetype comparison defs, vehicle name map |
| `resolveVehicleName.js` | Human-readable vehicle labels |
| `buildVehicleComparisonProfile.js` | Full comparison profile orchestrator |
| `buildDimensionComparisons.js` | Eight buyer-centric dimension comparisons |
| `buildTradeOffAnalysis.js` | Relative advantages and balanced trade-off lines |
| `buildComparisonNarrative.js` | Headline, summary, key differences |
| `buildArchetypeComparison.js` | Per-archetype preferred vehicle (tie allowed) |
| `comparisonRegistry.js` | `getVehicleComparisonProfile`, `listComparisonProfiles` (lazy) |
| `index.js` | Public exports |

## Dimensions compared

1. Ownership economics  
2. Charging practicality  
3. Highway capability  
4. Family practicality  
5. Service support  
6. Purchase value  
7. Premium appeal  
8. City suitability  

Each dimension returns `advantage`, `tie`, or `tradeOff` — never an overall winner.

## Archetype comparison

For all seven buyer archetypes, Compare Intelligence returns `{ preferredVehicle, rationale }`. `preferredVehicle` may be `"tie"` when neither vehicle clearly outpaces the other.

## What Compare Intelligence is not

- **Not UI** — no compare page changes in Phase 14D.
- **Not Score 2.0** — does not modify `src/score2/`.
- **Not recommendation engine changes** — reads `src/recommendations/` read-only.
- **Not rankings** — no `#1`, no numeric scores, no declared overall winner.

## Future usage

| Phase | Use |
|-------|-----|
| **14E** | Buyer Journey Engine |
| **15** | AI Buyer Assistant |

## Development

```bash
node scripts/comparison-smoke.mjs
```

Smoke output validates comparison profiles for four editorial pairs: Nexon vs Curvv, Nexon vs BE 6, BYD Seal vs Ioniq 5, and Comet vs Tiago.
