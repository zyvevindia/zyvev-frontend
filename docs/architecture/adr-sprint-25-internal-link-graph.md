# ADR — Sprint 2.5 Internal Link Graph

## Status
Accepted — 2026-07-13

## Context
Sprint 2.3–2.4 populated brand, price, and use-case landing pages with static `internalLinks` in registry configs. Vehicle, guide, and compare pages used separate SEO link modules. This duplicated relationship logic and blocked scalable IA.

## Decision
Introduce `src/linkGraph/` as the **only** Internal Link Graph Engine. All consumers delegate:

- `landingLinkGraph.js` → `getRelatedPages(buildLandingPageContext())`
- `vehicleInternalLinks.js` → `getRelatedPages(buildVehiclePageContext())`
- `seo/internalLinks.js` → `getRelatedPages(buildGuidePageContext())`
- `compareDiscoveryLinks.js` → compare relationship slice from engine

Registry configs no longer embed `internalLinks`. Relationships are resolved from:

- Landing registry definitions (read-only)
- Compare guide manifest
- Authority guide topics
- Catalog intelligence signals (price, suitability)

## Why one engine
- **No page-specific link logic** in React components
- **One relationship model** (`LINK_RELATIONSHIP_TYPES`)
- **Matrix-driven** page-family → relationship mapping
- **Future families** (City, Dealer, OEM) = matrix + resolver config only

## Consequences
- Removed `landingSharedLinks.js` and static internal link arrays from landing configs
- Legacy SEO hub helpers (`getBestEvsGuideLinks`, etc.) read registries — not hardcoded slug pools
- Cached resolution via `getCachedLinkGroups` for performance

## Verification
`npm run landing:certify:sprint25` on production after deploy.
