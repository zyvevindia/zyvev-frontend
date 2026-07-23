# ADR — Sprint 2.4 Price & Use-Case Landing Pages

## Status
Accepted — 2026-07-13

## Context
Sprint 2.3 proved the landing registry with eight brand hubs. Sprint 2.4 must add ten `/best-evs/:slug` pages (four price segments, six use cases) without new rendering or routing architecture.

## Decision
Register price and use-case configurations via `buildBestEvsLandingConfig()`, `registerPriceLandingPages()`, and `registerUseCaseLandingPages()`. All entries flow into the single `landingRegistry`. `LandingRouter` at `/best-evs/:useCase` resolves registry hits and renders `LandingPage`; legacy `DiscoverySeoPage` remains fallback for editorial slugs not in the registry.

## Why no new rendering logic or routing
- **Single renderer:** Price and use-case pages share `LandingPage.jsx` with brands
- **Single registry:** No `priceRegistry.js` or `useCaseRegistry.js`
- **Catalog read-only:** `filters.priceRange` and `filters.intelligenceFilterIds` drive `applyLandingCatalogFilter()`
- **SEO/schema reuse:** `landingMetadata`, `landingCanonical`, `landingSchema` unchanged
- **Grouped config only:** `priceLandingDefinitions.js`, `useCaseLandingDefinitions.js`, `buildBestEvsLandingConfig.js`

## Consequences
- Adding "Under ₹25 lakh" = one row in `PRICE_LANDING_DEFINITIONS`
- Editorial JSON for legacy `/best-evs/*` slugs (e.g. `large-family`) unchanged — registry bypass only when configured
- Sprint 2.5 internal link graph can extend `landingLinkGraph.js` without `LandingPage` changes

## Verification
`npm run landing:certify:sprint24` on production after deploy.
