# EVSavari authority compounding strategy

Controlled public beta — usefulness-first SEO, not volume scaling.

## Principles

- No thin-content generation, AI article farms, or keyword stuffing.
- Authority grows through **practical ownership guidance** that supports compare decisions.
- Every compare page should have **contextual guide support** where realism flags exist.

## Priority clusters

1. Apartment charging reality (`/guides/ownership-society-rwa`)
2. EV ownership practicality & running cost (`/guides/ownership-running-cost`, `/ownership/running-cost`)
3. Beginner EV guidance (`/discover/under-15-lakh`)
4. City vs highway usage (`/discover/city-driving`, `/discover/highway-evs`)
5. Charging behavior expectations (`/charging-guides/home-charging`)
6. Family EV practicality (`/discover/family-friendly`)
7. Long-distance suitability (`/guides/ownership-highway-ownership`)

## Linking discipline

- **Compare → guide**: `buildCompareAuthorityLinks()` in compare utility rail (2–4 links max).
- **Guide → compare**: `buildGuideToCompareDiscoveryLinks()` for contextual return paths.
- **Ownership ↔ charging**: cross-link society/RWA guides with home-charging guides when apartment risk is flagged.

## Review cadence

| Signal | Admin view | Action |
|--------|------------|--------|
| Weak authority cluster score | SEO authority / content usefulness | Editorial pass on existing guide |
| Compare lacking support | SEO authority `comparePagesLackingSupportContent` | Add contextual rail links only |
| Low usefulness feedback | Content usefulness | Tighten copy, do not add pages |
| Authority quality trend flat | Public beta ops maturity | Hold acquisition expansion |

## Metrics (existing ops)

- `authorityQualityTrend`, `authorityDepthTrend` — `seoAuthorityOps.js`
- `guideUsefulnessTrend` — usefulness feedback buffer
- `ownershipContentGaps`, `chargingContentGaps` — cluster completeness

## Export

Weekly: export SEO authority + content usefulness reports from admin before editorial review.
