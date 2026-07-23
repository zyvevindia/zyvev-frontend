# ADR — Sprint 2.3 Brand Landing Pages

## Status
Accepted — 2026-07-13

## Context
Sprint 2.2 delivered an empty landing registry and generic `LandingPage` engine. Sprint 2.3 must populate eight OEM brand hubs without new rendering logic.

## Decision
Register eight brand configurations via `buildBrandLandingConfig()` and `registerBrandLandingPages()`. `LandingRouter` resolves registry entries at `/brands/:brand` and renders `LandingPage` — legacy `DiscoverySeoPage` is bypassed only when a registry entry exists.

## Why no new rendering logic
- **Single renderer:** All brands share `LandingPage.jsx`
- **Catalog read-only:** `filters.brand` drives `applyLandingCatalogFilter()` — new vehicles appear automatically
- **SEO reuse:** `landingMetadata` → `buildPageMeta` → `SeoHead`
- **Schema reuse:** CollectionPage + BreadcrumbList + ItemList (no Product on brand hubs)
- **Sections:** Hero stats and internal links are generic section/config enhancements, not OEM JSX

## Consequences
- Adding Volvo = one row in `BRAND_LANDING_DEFINITIONS`
- Editorial JSON at `public/seo-data/brands/*` remains for content tooling but is not the runtime source for these eight URLs
- Sprint 2.4 price pages can reuse the same factory pattern with `type: "price"`

## Verification
`npm run landing:certify:sprint23` on production after deploy.
