# Landing Page Framework (Sprint 2.2)

Architecture-only generic landing page engine for EVSavari. **No landing page content** is registered in Sprint 2.2 — the registry is intentionally empty.

## Flow

```
landingRegistry (config)
        │
        ▼
LandingRouter (route family + slug)
        │
   registry hit? ──yes──► LandingPage.jsx
        │
        no + legacy children ──► DiscoverySeoPage / IntelligenceDiscoveryPage (unchanged)
        │
        no + no children ──► LandingNotFound
        │
        ▼
LandingPageLayout + sectionRegistry
        │
   ┌────┴────┬────────────┐
   ▼         ▼            ▼
SeoHead   useLandingCatalog   JsonLd
          (filter → catalog)
```

## Single sources of truth

| Concern | Implementation |
|---------|----------------|
| Engine | `src/landing/LandingPage.jsx` |
| Registry | `src/landing/landingRegistry.js` |
| Routing | `src/landing/LandingRouter.jsx` + `landingRouteConfig.js` |
| Layout | `src/landing/layout/LandingPageLayout.jsx` |
| Filters | `src/landing/filters/landingFilter.js` → `catalogFilters` + `discoveryRanking` |
| Metadata | `src/landing/seo/landingMetadata.js` → `pageMetadata` / `meta` → `SeoHead` |
| Canonical | `src/landing/seo/landingCanonical.js` → `seo/canonical.js` |
| Schema | `src/landing/seo/landingSchema.js` → `schema.js` / `structuredData.js` |
| Sections | `src/landing/sections/sectionRegistry.js` |

## Route families (prepared)

| Route | Param | Fallback (today) |
|-------|-------|------------------|
| `/brands/:brand` | `brand` | `DiscoverySeoPage` (brand) |
| `/best-evs/:useCase` | `useCase` | `DiscoverySeoPage` (best-evs) |
| `/discover/:presetSlug` | `presetSlug` | `IntelligenceDiscoveryPage` |

When a registry entry exists for a slug, `LandingPage` takes over automatically — no route or JSX changes required.

## Adding a landing page (future sprints)

```js
import { registerLandingPage, LANDING_ROUTE_FAMILIES } from "../landing";

registerLandingPage({
  id: "brand-tata",
  type: "brand",
  routeFamily: LANDING_ROUTE_FAMILIES.BRANDS,
  slug: "tata",
  title: "Tata Electric Vehicles in India",
  description: "...",
  filters: { brand: "Tata" },
  hero: { title: "Tata EVs", subtitle: "..." },
  sections: [
    { id: "hero", enabled: true },
    { id: "vehicleGrid", enabled: true },
    { id: "cta", enabled: true },
  ],
});
```

## Extension points (empty in 2.2)

- `registerLandingSectionComponent(id, Component)` — news, videos, charging, dealer CTA, AI summary, editorial
- `registerLandingSchemaExtension(type, builder)` — FAQ, Video, Review, AggregateRating
- `registerLandingLinkResolver(domain, fn)` — vehicles, compare, guides, ownership, charging, finance, cities, brands, dealer

## Certification

```bash
npm run landing:certify:sprint22
npm run seo:foundation
```

## Out of scope (Sprint 2.2)

- No Tata/Mahindra/price/use-case pages
- No SEO content generation
- No changes to lead flow, media, catalog architecture, admin, compare, vehicle pages, or navigation
