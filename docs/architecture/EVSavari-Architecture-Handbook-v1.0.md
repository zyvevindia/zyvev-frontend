# EVSavari Architecture Handbook v1.0

**Status:** Architecture Freeze — documents production as deployed after Sprint 1 and Sprint 2.1–2.6  
**Generated:** 2026-07-12  
**Scope:** Read-only reference. Describes what exists today. Not a redesign proposal.

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Applies to | `main` + uncommitted Sprint 2 working tree (production at evsavari.com) |
| Supersedes | Ad-hoc sprint ADRs (those remain supplementary) |
| Change policy | Handbook updates require explicit architecture review |

---

# Chapter 1 — Executive Overview

## What EVSavari Is

EVSavari is India's EV research and comparison platform. The public site helps buyers discover electric cars, compare specifications, understand ownership costs, and submit purchase intent. A hidden platform layer (admin, dealer, CRM, ops, AI tooling) supports operations but is bounded by **EVSavari Lite** for the public launch.

## Two Layers

### Layer 1 — Public Website (EVSavari Lite)

Active surfaces documented in `src/config/evsavariLite.js`:

- Home, browse (`/cars`), vehicle detail (`/cars/:familySlug`)
- Compare tool and editorial compare guides
- Guides hub (ownership, charging, authority content)
- Brand landings (`/brands/:slug`) — 8 OEM hubs
- Price and use-case landings (`/best-evs/:slug`) — 10 pages
- Discovery presets (`/discover/:presetSlug`)
- Lead capture on vehicle and compare journeys

Public navigation is intentionally narrow: Home, Browse, Compare, Guides, Search.

### Layer 2 — Hidden Platform

Routes remain registered but many redirect via `LiteHiddenRedirect` (assistant, ownership tools hub, score playground). Full platform includes:

- Admin ops dashboards (`/admin/*`)
- Dealer login, signup, dashboard
- CRM surfaces (Sales dashboard, Kanban, lead timeline)
- Catalog import, media QA, SEO agent tooling
- Intelligence, trust, and certification ops modules

Reactivation is configuration and route visibility — not a rewrite.

## How Today's Architecture Supports the Roadmap

| Future capability | Extension mechanism today |
|-------------------|---------------------------|
| **SEO** | `pageMetadata` → `meta.js` → `SeoHead` → `SEO.jsx`; landing schema via `landingSchema.js` |
| **Content** | Landing registry configs, editorial JSON in `public/seo-data/`, content blocks with stable IDs |
| **Dealer Platform** | Existing dealer routes + `leadService` + routing plan in `leadSubmitApi.js` |
| **OEM Platform** | Brand landing registry pattern; add OEM = registry object |
| **CRM** | `crm/leadPipeline.js`, admin lead views — separate from public pages |
| **AI** | Content blocks (`data-content-block`), registry-driven landings, catalog intelligence hooks |
| **Mobile Apps** | Same REST API (`API_URL`), catalog and metadata as data — no mobile-specific renderer in web repo |
| **APIs** | Backend services under `src/backend/services/`; Supabase persistence |

No subsystem listed above requires a parallel architecture. Each plugs into registry, link graph, or backend service boundaries already present.

---

# Chapter 2 — Architectural Principles

### 1. Single Source of Truth

Every domain has one authoritative module: landing pages → `landingRegistry.js`; metadata → `pageMetadata.js`; internal links → `linkGraph/`; catalog families → generated dossiers + runtime resolver.

### 2. Registry-Driven Architecture

Landing pages, route families, and section types are registered — not hardcoded in JSX branches. Production landings register via `registerProductionLandings.js` imported from `LandingRouter.jsx`.

### 3. Configuration Over Duplication

Brand, price, and use-case pages share one `LandingPage.jsx`. Differences live in config arrays (`brandLandingDefinitions.js`, `priceLandingDefinitions.js`, `useCaseLandingDefinitions.js`).

### 4. Thin Pages

Route components (`Home.jsx`, `ListingPage.jsx`, `CarDetails.jsx`) compose engines. Business rules live in utils, hooks, services, and config — not in page JSX branches.

### 5. Shared Engines

One metadata engine, one schema pipeline, one link graph, one landing renderer, one compare flow. Pages consume engines; they do not reimplement them.

### 6. Shared Metadata

All public pages funnel through `buildPageMeta()` in `src/seo/meta.js`. `SeoHead` is the single Helmet adapter. Static duplicate tags were removed from `index.html` (Sprint 2.1).

### 7. Shared Schema

JSON-LD emits via `JsonLd.jsx`. Landing pages use `landingSchema.js`; vehicles use `structuredData.js` / `schema.js`. No page-type-specific schema components.

### 8. Shared Routing

React Router in `App.jsx` is the top-level router. Landing URLs delegate to `LandingRouter.jsx` + registry lookup — not separate brand/price routers.

### 9. Shared Catalog

Listing and landing pages read the same catalog via `fetchListingCatalogVariants()` and family aggregation. Landings apply filters through `applyLandingCatalogFilter()` — they do not maintain vehicle lists.

### 10. Read-Only Catalog Consumers

Landing pages and SEO pages fetch and filter catalog data. They never write catalog records. Catalog authoring flows through backend import ops.

### 11. Plugin Architecture / Extension Points

- `registerLandingPage()` — new landing URLs
- `registerLandingSectionComponent()` — new section types
- `registerLandingSchemaExtension()` — new schema types
- `LINK_RELATIONSHIP_MATRIX` + resolvers — new link relationships
- `LANDING_SECTION_EXTENSION_SLOTS` — news, videos, charging, AI summary slots

### 12. Layer Separation

Public (Lite) vs platform (admin/dealer/ops) is documented in `evsavariLite.js` and enforced via redirects — not deleted routes.

### 13. Zero Duplicated Business Logic

Internal links previously lived in `internalLinks.js`, `vehicleInternalLinks.js`, and config arrays. Sprint 2.5 consolidated resolution into `getRelatedPages()`. Adapters remain thin.

---

# Chapter 3 — Overall System Diagram

```
                              ┌─────────────────────────────────────┐
                              │           Users / Crawlers           │
                              └──────────────────┬──────────────────┘
                                                 │
                                                 ▼
                              ┌─────────────────────────────────────┐
                              │         React Router (App.jsx)         │
                              │  Home · Browse · Vehicle · Compare   │
                              │  Guides · Admin · Dealer · Tools     │
                              └──────────────────┬──────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
         ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
         │  LandingRouter   │      │   Page Components │      │  LiteHiddenRedirect│
         │  (brands,        │      │   CarDetails,     │      │  (platform routes  │
         │   best-evs)      │      │   ListingPage,    │      │   → /cars)         │
         └────────┬─────────┘      │   ComparePage,    │      └──────────────────┘
                  │                │   DiscoverySeo    │
                  ▼                └────────┬──────────┘
         ┌──────────────────┐               │
         │   LandingPage    │               │
         │  (one engine)    │               │
         └────────┬─────────┘               │
                  │                         │
    ┌─────────────┼─────────────┬───────────┼───────────┬─────────────┐
    │             │             │           │           │             │
    ▼             ▼             ▼           ▼           ▼             ▼
┌────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐  ┌─────────┐  ┌──────────┐
│Section │  │ Catalog  │  │ Link    │  │ SEO   │  │ Schema  │  │  Media   │
│Registry│  │ Hook +   │  │ Graph   │  │ Head  │  │ JsonLd  │  │ vehicle  │
│        │  │ Filter   │  │ Engine  │  │ meta  │  │         │  │ Media.js │
└────────┘  └────┬─────┘  └────┬────┘  └───┬───┘  └────┬────┘  └────┬─────┘
                 │             │           │           │            │
                 ▼             │           │           │            ▼
         ┌──────────────┐      │           │           │     ┌─────────────┐
         │ Catalog      │      │           │           │     │ Cloudinary  │
         │ Resolver +   │      │           │           │     │ + local     │
         │ Generated    │      │           │           │     │ /images/cars│
         │ Dossiers     │      │           │           │     └─────────────┘
         └──────┬───────┘      │           │           │
                │              │           │           │
                ▼              ▼           ▼           ▼
         ┌─────────────────────────────────────────────────────────────┐
         │                     Lead Engine (public)                       │
         │  LeadForm · LeadInquiryModal · leadSubmitApi · Turnstile       │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
                                        ▼
         ┌─────────────────────────────────────────────────────────────┐
         │              Backend API (src/backend/)                        │
         │  leadService · vehicleService · authService · catalogImport   │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
                                        ▼
         ┌─────────────────────────────────────────────────────────────┐
         │           Supabase (PostgreSQL) + Cloudinary CDN               │
         │  leads · vehicles · variants · media · sessions · users       │
         └─────────────────────────────────────────────────────────────┘
```

**Note:** Persistence is **Supabase/PostgreSQL**, not MongoDB. Schema migrations live in `src/backend/schema/migrations/`.

---

# Chapter 4 — Repository Structure

## Top-Level

| Path | Ownership | Purpose |
|------|-----------|---------|
| `src/` | Frontend application | React app, engines, pages, components |
| `public/` | Static + generated SEO assets | `seo-data/`, sitemaps, images, robots |
| `scripts/` | Build, cert, ops automation | Sitemap build, content generate, sprint certs |
| `docs/` | Architecture & release evidence | ADRs, handbooks, certification reports |
| `tests/` | E2E (Playwright) | Lead loop, smoke journeys |
| `reports/` | Local audit output | Media completeness (not always committed) |

## `src/` Major Folders

| Folder | Owner domain | Role |
|--------|--------------|------|
| `src/landing/` | Landing Framework (Sprint 2.2–2.6) | Registry, router, sections, landing SEO/schema |
| `src/linkGraph/` | Internal Link Graph (Sprint 2.5) | Relationship matrix, resolvers, cache |
| `src/seo/` | Technical SEO (Sprint 2.1+) | Metadata, canonical, sitemap helpers, adapters |
| `src/components/` | UI | SEO, media, leads, catalog cards, admin shells |
| `src/pages/` | Route targets | Thin page compositions |
| `src/utils/` | Shared logic | Catalog, media, routing, formatting |
| `src/media/` | Media resolution | Cloudinary, manifests, availability |
| `src/backend/` | Server-side modules | Services, catalog generated dossiers, Supabase |
| `src/crm/` | CRM pipeline | Lead pipeline state (platform) |
| `src/intelligence/` | Catalog intelligence | Filters, scores (discovery + landings) |
| `src/content/` | Editorial generation | Authority topics, generated manifest |
| `src/config/` | Product boundaries | Lite config, launch profiles, media constants |
| `src/security/` | Lead security | Turnstile integration |
| `src/ops/` | Admin ops | Catalog health, freshness, analytics ops |

## `public/`

| Path | Type |
|------|------|
| `public/seo-data/` | Generated editorial JSON (157+ pages) |
| `public/sitemaps/` | Generated XML sitemaps |
| `public/images/cars/` | Local WebP vehicle assets (selected families) |

## `scripts/`

| Pattern | Purpose |
|---------|---------|
| `build-sitemaps.mjs` | Sitemap generation |
| `generate-content.mjs` | SEO content batch |
| `sprint-*-certification.mjs` | Production certification harnesses |

---

# Chapter 5 — Runtime Architecture

## Request Flow (Public Page)

1. **Browser** requests URL (e.g. `/brands/tata`).
2. **React Router** (`App.jsx`) matches route → `BrandDiscoveryPage` in `discoveryRoutes.jsx`.
3. **LandingRouter** reads `routeFamily=brands`, slug from params, calls `resolveLandingConfig()`.
4. On registry hit → **LandingPage** renders:
   - `buildLandingPageMeta(config)` → **SeoHead**
   - `buildExtendedLandingSchemas()` → **JsonLd**
   - `useLandingCatalog(filters)` → catalog fetch + filter
   - `resolveLandingInternalLinks()` → **getRelatedPages()**
   - **LandingSectionRenderer** maps enabled sections from config
5. User interaction (compare, lead) stays within existing compare/lead flows.

## Routing

| Layer | Module | Responsibility |
|-------|--------|----------------|
| App router | `App.jsx` | All URL patterns, lazy loading, Lite redirects |
| Landing router | `LandingRouter.jsx` | Registry lookup for `/brands/*`, `/best-evs/*` |
| Vehicle router | `CarsSlugRouter.jsx` | Family slug normalization |
| Legacy | `LegacyCarRedirect.jsx` | Old URL compatibility |

## Rendering

- **Landings:** Config-driven sections only (`LandingPage.jsx`).
- **Vehicle:** `CarDetails.jsx` — single detail renderer.
- **Browse:** `ListingPage.jsx` — catalog grid + filters.
- **Compare:** `ComparePage.jsx` — session compare + editorial guides via `DiscoverySeoPage`.
- **Guides:** `DiscoverySeoPage.jsx` / `SeoGuidesHub.jsx` — editorial JSON from `public/seo-data/`.

## Catalog

- **Source:** Generated dossiers in `src/backend/catalog/generated/` + runtime fetch via `vehicleDetailResolver.js`.
- **Aggregation:** `aggregateModelFamilies()` for family-level cards.
- **Landing filter:** `src/landing/filters/landingFilter.js` applies brand, price, intelligence filters.
- **Read-only** at page layer.

## SEO (runtime)

- Page components call `build*PageMeta()` from `pageMetadata.js`.
- `SeoHead` → `SEO.jsx` (react-helmet-async) sets title, description, canonical, OG, Twitter, robots.
- `JsonLd` injects structured data scripts.

## Media (runtime)

- `VehicleImage.jsx` resolves URL chain via `vehicleMedia.js`.
- Priority: local WebP → Cloudinary catalog URLs → brand fallback → placeholder SVG.
- Gallery on detail pages uses `resolveDetailGalleryItems()`.

## Leads (runtime)

- `LeadForm` / `LeadInquiryModal` collect buyer intent.
- `submitBuyerLead()` POSTs to `${API_URL}/leads` with routing metadata and optional Turnstile token.
- Admin/CRM views consume same lead records via backend.

## Admin / CRM / Auth

- **Auth:** Supabase Auth + `PrivateRoute` for admin paths.
- **Admin:** Lazy-loaded ops pages under `/admin/*`.
- **Dealer:** `/dealer/login`, `/dealer/signup`, protected dashboard.
- **CRM:** Sales dashboard, Kanban — platform layer, not Lite nav.

## Compare

- Interactive compare: `/compare` — client session state, canonical always hub URL.
- Editorial guides: `/compare/:slug` — `DiscoverySeoPage` + JSON content.

## Search / Filtering

- Browse search/filter on `ListingPage.jsx`.
- Landing filters via intelligence IDs and price ranges in registry config.
- No separate search engine — catalog query + client filters.

---

# Chapter 6 — Landing Framework

## Core Components

| Component | File | Role |
|-----------|------|------|
| **LandingPage** | `LandingPage.jsx` | Sole landing renderer; no type branches |
| **LandingRouter** | `LandingRouter.jsx` | Slug → registry → LandingPage |
| **Registry** | `landingRegistry.js` | `registerLandingPage`, `resolveLandingConfig` |
| **Route config** | `landingRouteConfig.js` | Maps route families to URL param keys |
| **Section registry** | `sectionRegistry.js` | Maps section IDs to components |
| **Section renderer** | `LandingSectionRenderer.jsx` | Renders one section from config |
| **Catalog hook** | `useLandingCatalog.js` | Fetch + filter families |
| **Landing SEO** | `landingMetadata.js` | Delegates to `pageMetadata` / `meta.js` |
| **Landing schema** | `landingSchema.js` | CollectionPage, BreadcrumbList, FAQ, ItemList |
| **Link adapter** | `landingLinkGraph.js` | `getRelatedPages(buildLandingPageContext())` |

## Production Registry (18 pages)

Registered in `registerProductionLandings.js`:

- **8 brand** — `/brands/{tata,mahindra,mg,hyundai,byd,kia,bmw,mercedes-benz}`
- **4 price** — `/best-evs/{under-10-lakh,under-15-lakh,under-20-lakh,premium}`
- **6 use case** — `/best-evs/{city,family,highway,long-range,fast-charging,budget}`

## Section Stack (Sprint 2.6)

Default enabled order for production landings:

```
hero → intro → vehicleGrid → buyingGuide → faq → relatedPages → cta
```

Stable `data-content-block` IDs defined in `contentBlocks.js` for future AI consumption.

## Content Blocks

| Block ID | Section | Source |
|----------|---------|--------|
| `hero` | HeroSection | `config.hero` |
| `intro` | IntroSection | `config.intro` |
| `vehicleGrid` | VehicleGridSection | Catalog hook output |
| `buyingGuide` | BuyingGuideSection | `config.buyingAdvice` |
| `faq` | FaqSection | `config.faq` |
| `relatedPages` | InternalLinksSection | Link graph groups |
| `cta` | CtaSection | `config.ctaLabel/Href` |

## Adding Future Page Types (Configuration Only)

| Page type | Required changes |
|-----------|------------------|
| **Brand** | Add object to `brandLandingDefinitions.js` |
| **Price** | Add object to `priceLandingDefinitions.js` |
| **Use case** | Add object to `useCaseLandingDefinitions.js` |
| **City** | New route family in `landingRouteConfig.js` + definitions + matrix row |
| **Dealer** | Registry entry + `DEALER` relationship resolver (stub exists) |
| **Charging** | Section slot `CHARGING` + config |
| **Finance** | `FINANCE` relationship type (stub in link graph) |

No new JSX page type. No second landing renderer.

---

# Chapter 7 — SEO Architecture

## Metadata Pipeline

```
Page context (props, config, vehicle)
        ↓
pageMetadata.js  — buildHomePageMeta, buildVehiclePageMeta,
                   buildListingPageMeta, buildGuidePageMeta, …
        ↓
meta.js  — buildPageMeta, formatPageTitle (+ EVSavari suffix)
        ↓
SeoHead.jsx  — metaToSeoProps
        ↓
SEO.jsx  — react-helmet-async (title, meta, link canonical, OG, Twitter)
```

Landing pages: `buildLandingPageMeta(config)` in `landingMetadata.js` → same pipeline.

Year-aware landing titles: `seoConstants.js` → `formatLandingSeoTitle()`.

## Canonical Pipeline

- `src/seo/canonical.js` — URL builders per page type.
- `landingCanonical.js` — landing-specific canonical from registry path.
- Vehicle: `canonicalVehicleUrl()` in `vehicleRoutes.js`.
- Compare tool: always hub canonical (session not indexed).

## Schema Pipeline

```
Page data
    ↓
structuredData.js / schema.js / landingSchema.js
    ↓
JsonLd.jsx  — application/ld+json script tags
```

Landing pages emit: **CollectionPage** (with embedded ItemList), **BreadcrumbList**, **FAQPage** (when configured). Vehicle pages emit **Product** (vehicle), **BreadcrumbList**, optional FAQ. No duplicate Product schema on landings.

## Helmet / Static HTML

`index.html` retains favicon, theme-color, viewport — **not** duplicate title/description/OG (removed Sprint 2.1). Runtime SEO is entirely via Helmet.

## Structured Data Types in Use

| Type | Where |
|------|-------|
| WebPage / CollectionPage | Landings, hubs |
| ItemList | Guide rankings, landing vehicle grids (embedded in CollectionPage) |
| BreadcrumbList | Landings, vehicle, guides |
| FAQPage | Landings, guides, vehicle (when FAQ configured) |
| Product | Vehicle detail |
| Article | Editorial compare/ownership guides |
| Organization | Site-wide schema helpers |

## Robots

- Default: `index, follow` via `buildPageMeta`.
- Per-page overrides via registry `seo.robots` when needed.

## Sitemap Generation

```
scripts/build-sitemaps.mjs
    ↓
public/sitemap.xml + public/sitemaps/*.xml
    ↓
public/sitemap-manifest.json
```

Runs on `prebuild`. Includes static, cars, compare, ownership, reviews, seo-pages.

## Content Generation

```
scripts/generate-content.mjs
    ↓
public/seo-data/*.json
public/seo-data/content-manifest.json
src/content/generated/manifest.js
```

157 registry entries in generated batch (as of production build).

## Search Console

- Verification and readiness scripts: `scripts/verify-gsc-readiness.mjs`, ops docs.
- Sitemap URL: `https://evsavari.com/sitemap.xml`

---

# Chapter 8 — Internal Link Graph

## Purpose

One engine resolves all internal link groups. Pages never embed static link arrays in JSX or duplicate relationship logic.

## Flow

```
Page context (landing / vehicle / guide / compare)
        ↓
getRelatedPages(context)          ← src/linkGraph/index.js
        ↓
relationshipMatrix.js             ← which relationship types apply
        ↓
resolveRelationships.js           ← registry-driven resolvers per type
        ↓
rankRelationships.js              ← score, dedupe, group
        ↓
cache.js                          ← memoized link groups
        ↓
UI adapters (landingInternalLinks, vehicleInternalLinks,
             internalLinks, compareDiscoveryLinks)
```

## Relationship Matrix

`LINK_RELATIONSHIP_MATRIX` maps page family → relationship types:

- **brand** → price segments, use cases, vehicles, buying guides, ownership, compare
- **price** → brands, vehicles, use cases, guides
- **use_case** → brands, price segments, vehicles, guides
- **vehicle** → brand hub, rivals, compare guides, authority guides
- **guide** → related guides, hubs, landings
- **compare** → related comparisons, vehicles

Future types stubbed: `FINANCE`, `DEALER`, `OEM`, `CITY`, `EDITORIAL`, `NEWS`, `VIDEO`, `REVIEW`.

## Resolvers

`RELATIONSHIP_RESOLVERS` in `resolveRelationships.js` — read-only, pull from:

- Landing registry definitions
- Compare guide manifest
- Authority guide topics
- Catalog intelligence signals (price, suitability scores)

## Adapters (Thin)

| Adapter | Delegates to |
|---------|--------------|
| `landingLinkGraph.js` | `buildLandingPageContext` |
| `vehicleInternalLinks.js` | `buildVehiclePageContext` |
| `internalLinks.js` | `buildGuidePageContext` |
| `compareDiscoveryLinks.js` | compare slice from engine |

## Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Brand Page  │     │ Vehicle Page│     │ Guide Page  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │ getRelatedPages │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │    Matrix       │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │   Resolvers     │
                  │ (registry data) │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │  Rank + Dedupe  │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │  Link Groups UI │
                  └─────────────────┘
```

---

# Chapter 9 — Media Architecture

## Resolution Stack

| Layer | Module |
|-------|--------|
| Component | `VehicleImage.jsx` — chain iteration, lazy load |
| Resolver | `vehicleMedia.js` — role-based URL resolution |
| Cloudinary | `media/cloudinary.js` — catalog asset URLs |
| Local manifest | `media/localCarMediaManifest.js` — `/images/cars/{family}/` |
| Family manifest | `media/familyMediaManifest.js` — production family map |
| Availability | `media/catalogMediaAvailability.js` — suppress bad URLs |
| Brand fallback | `media/brandFallback.js` — OEM logos and siblings |

## Image Roles

`listing`, `compare`, `front`, `rear`, `side`, `interior`, `dashboard` — mapped in manifests and gallery config.

## Fallback Chain

1. Local WebP (if family provisioned in local manifest)
2. Cloudinary catalog role URL
3. Brand sibling media
4. `LOCAL_FALLBACK_EV` SVG placeholder (suppressed in gallery when unprovisioned)

## Gallery (Detail Pages)

`resolveDetailGalleryItems()` — skips angles not provisioned for partial local families; filters placeholder SVGs from chains.

## Cloudinary

Configured via `CLOUDINARY_URL` / env. Backend `vehicleMediaService.js` maps roles to stored assets.

## Future Media Operations

- Admin **Media QA** and **Media Health** pages exist under `/admin/*`.
- Catalog import pipeline can attach media metadata.
- No second media resolver — extend manifests and `vehicleMedia.js` only.

---

# Chapter 10 — Lead Architecture

## Public Lead Flow

```
User (vehicle / compare / modal CTA)
        ↓
LeadForm / LeadInquiryModal
        ↓
Client validation + Turnstile (if enabled — leadTurnstile.js)
        ↓
leadSubmitApi.submitBuyerLead()
        ↓
buildLeadRoutingPlan() — city, brand, dealer assignment metadata
        ↓
POST ${API_URL}/leads
        ↓
backend/services/leadService.js → Supabase `leads` table
```

## Components

| File | Role |
|------|------|
| `LeadForm.jsx` | Primary form UI |
| `LeadInquiryModal.jsx` | Modal wrapper |
| `LeadGenerationCtaStrip.jsx` | Vehicle page CTA |
| `WhatsAppLeadCta.jsx` | WhatsApp channel (future-weight) |
| `leadSubmitApi.js` | API client |
| `leadRouting.js` | Routing plan builder |
| `leadTurnstile.js` | Cloudflare Turnstile gate |

## Duplicate Suppression

Handled server-side in lead API (merge responses); client resubmit flows tested in Playwright lead-loop tests.

## Admin / CRM Boundary

| Surface | Path | Role |
|---------|------|------|
| Leads list | Admin / CRM pages | Read, assign, timeline |
| `LeadTimeline.jsx` | CRM component | Activity view |
| `leadPipeline.js` | CRM state | Pipeline stages |
| Dealer dashboard | `/dealer/*` | Dealer-scoped leads (platform) |

Public pages do not import CRM modules.

## Future (Hooks Present, Not Lite-Primary)

- OTP verification — extend `leadSubmitApi` + backend
- WhatsApp — `WhatsAppLeadCta.jsx` exists
- Dealer AI — consumes lead + catalog context via API; no new lead engine

---

# Chapter 11 — Hidden Platform

## Lite Boundary

`src/config/evsavariLite.js` classifies routes:

- **ACTIVE** — public marketplace
- **HIDDEN** — redirect to `/cars` via `LiteHiddenRedirect`
- **FUTURE** — registered but not promoted

Hidden examples: `/assistant`, `/ownership`, `/tools`, `/playground/*`.

## Admin (`/admin/*`)

Ops dashboards: catalog health, media QA, launch status, traffic intelligence, SEO agent, catalog import wizard, dealer applications, editorial lead quality, etc. Loaded lazily; require auth.

## Dealer Platform

- `/dealer/login`, `/dealer/signup`, `/dealer/dashboard`
- Separate from public nav; uses Supabase auth + dealer role

## CRM

- `SalesDashboard`, `KanbanBoard`, `Leads.jsx`
- Pipeline in `src/crm/leadPipeline.js`

## AI / Assistant

- Routes exist but Lite redirects `/assistant` paths
- Intelligence modules in `src/intelligence/` feed discovery and catalog scores
- Admin SEO Agent page for ops — not public buyer AI

## Ownership Tools

- TCO, EMI, cost-per-km calculators — routes registered, Lite-hidden
- Ownership guide **content** is public via `/ownership-guides/:slug`

## Playground

- Score2, assistant experiments — hidden from Lite

## Reactivation Path

Remove or narrow `LiteHiddenRedirect` routes in `App.jsx` and update `ROUTE_INVENTORY` status — no architectural rewrite.

---

# Chapter 12 — AI Readiness

## Why No Redesign Is Required

| AI use case | Consumes today |
|-------------|----------------|
| **Dealer AI** | Lead API + catalog + dealer registry (future) |
| **OEM AI** | Brand landing configs + catalog families |
| **Buying AI** | Content blocks + FAQ + buyingAdvice sections |
| **Editorial AI** | `public/seo-data/` manifest + authority topics |
| **Search AI** | Catalog intelligence filters + family aggregation |
| **Content AI** | Registry configs (intro, buyingAdvice, faq) — not HTML scrape |
| **Recommendation AI** | Intelligence scores + link graph relationships |

## Content Blocks (Sprint 2.6)

Machine-readable block IDs on landing DOM:

`hero | intro | vehicleGrid | buyingGuide | faq | relatedPages | cta`

Registry configs are the semantic source; HTML is presentation.

## Extension Slots

`LANDING_SECTION_EXTENSION_SLOTS`: `news`, `videos`, `charging`, `ownership`, `dealerCta`, `aiSummary`, `editorial` — register via `registerLandingSectionComponent()` without changing `LandingPage.jsx`.

---

# Chapter 13 — Extension Points

| Extension | API / Location | Adds |
|-----------|----------------|------|
| Landing page | `registerLandingPage(config)` | New URL + filters + content |
| Section type | `registerLandingSectionComponent(id, component)` | New landing block |
| Schema type | `registerLandingSchemaExtension(type, builder)` | New JSON-LD |
| Link relationship | Matrix row + `RELATIONSHIP_RESOLVERS` entry | New link group |
| Landing filter | `landingFilter.js` intelligence IDs | New catalog slice |
| Metadata | `pageMetadata.js` builder function | New page family meta |
| Editorial page | `generate-content.mjs` registry | New guide URL |
| Catalog family | Generated dossier in `backend/catalog/generated/` | New vehicle |
| Ops module | New lazy admin route in `App.jsx` | Internal tooling |

---

# Chapter 14 — Dependency Rules

## Allowed (downstream consumption)

```
LandingPage → Catalog hook (read-only)
LandingPage → Link graph
LandingPage → landingMetadata → meta.js
LandingPage → landingSchema → JsonLd
LandingPage → Section registry

Link graph → Landing registry (read-only)
Link graph → Content manifests (read-only)
Link graph → Catalog intelligence (read-only signals)

Pages → SeoHead → pageMetadata → meta.js
Pages → vehicleMedia (read-only)

Lead UI → leadSubmitApi → backend leadService
```

## Forbidden

```
Landing → Vehicle page internals (CarDetails sections)
Vehicle → Landing registry (no landing imports in CarDetails except SEO meta)
Link graph → React components (engine is data-only)
Catalog generated dossiers → Landing configs (configs filter catalog; catalog doesn't know landings)
SEO.jsx → Page-specific branches (use pageMetadata builders)
Second landing renderer (BrandPage.jsx, PricePage.jsx, etc.)
Page components → Hardcoded internal link lists
Metadata → Duplicate Helmet outside SeoHead/SEO pipeline
```

## Layer Direction

```
UI Pages / Landing
       ↓
Engines (SEO, Link Graph, Media, Catalog utils)
       ↓
Backend services / Supabase
```

Reverse imports (backend → React) are forbidden.

---

# Chapter 15 — Single Source of Truth

| Subsystem | Authoritative module |
|-----------|---------------------|
| **Landing registry** | `src/landing/landingRegistry.js` |
| **Landing production defs** | `src/landing/config/*LandingDefinitions.js` |
| **Landing routes** | `src/landing/landingRouteConfig.js` |
| **Section types** | `src/landing/sections/sectionRegistry.js` |
| **Content block IDs** | `src/landing/contentBlocks.js` |
| **Metadata** | `src/seo/pageMetadata.js` + `src/seo/meta.js` |
| **Landing metadata adapter** | `src/landing/seo/landingMetadata.js` |
| **Schema (shared)** | `src/utils/structuredData.js`, `src/seo/schema.js` |
| **Landing schema** | `src/landing/seo/landingSchema.js` |
| **Canonical** | `src/seo/canonical.js`, `src/landing/seo/landingCanonical.js` |
| **Link graph** | `src/linkGraph/index.js` |
| **Relationship matrix** | `src/linkGraph/relationshipMatrix.js` |
| **Catalog dossiers** | `src/backend/catalog/generated/*.js` |
| **Catalog runtime fetch** | `src/utils/vehicleDetailResolver.js` |
| **Vehicle media** | `src/utils/vehicleMedia.js` |
| **Local media manifest** | `src/media/localCarMediaManifest.js` |
| **App routing** | `src/App.jsx` |
| **Lite boundary** | `src/config/evsavariLite.js` |
| **Launch profiles** | `src/config/launchProfiles.js` |
| **SEO editorial content** | `public/seo-data/` + `content-manifest.json` |
| **Sitemaps** | `scripts/build-sitemaps.mjs` → `public/sitemap*.xml` |
| **Leads (API)** | `src/backend/services/leadService.js` |
| **Lead submit (client)** | `src/services/leadSubmitApi.js` |
| **Authentication** | Supabase Auth + `src/backend/services/authService.js` |
| **Compare (interactive)** | `src/pages/ComparePage.jsx` + compare session utils |
| **Compare (editorial)** | `public/seo-data/` compare guides |
| **Admin** | `src/App.jsx` admin route tree + `src/pages/admin/*` |
| **CRM pipeline** | `src/crm/leadPipeline.js` |

---

# Chapter 16 — Architecture Inventory

| System | Count | Notes |
|--------|------:|-------|
| Landing engines / renderers | **1** | `LandingPage.jsx` |
| Landing routers | **1** | `LandingRouter.jsx` (within React Router) |
| Landing registries | **1** | `landingRegistry.js` |
| Metadata engines | **1** | `pageMetadata.js` + `meta.js` |
| Schema engines | **1** | `structuredData.js` / `schema.js` / `landingSchema.js` (layers, not duplicates) |
| Helmet adapters | **1** | `SeoHead` → `SEO.jsx` |
| Routing systems | **1** | React Router in `App.jsx` |
| Catalog engines | **1** | Generated dossiers + runtime resolver (single catalog truth) |
| Link graph engines | **1** | `src/linkGraph/` |
| Media resolution engines | **1** | `vehicleMedia.js` (+ component `VehicleImage.jsx`) |
| Lead submission systems | **1** | `leadSubmitApi.js` → `leadService.js` |
| Compare engines (interactive) | **1** | `ComparePage.jsx` |
| Vehicle detail renderers | **1** | `CarDetails.jsx` |
| Admin portals | **1** | `/admin/*` tree (many pages, one portal) |
| CRM systems | **1** | `crm/leadPipeline.js` + sales views |
| Dealer portals | **1** | Dealer dashboard route group |

**No parallel implementations** of the above exist in the repository. Legacy adapters (`internalLinks.js`, etc.) delegate to the link graph — they are not second engines.

---

# Chapter 17 — Future Roadmap

How planned sprints attach to frozen architecture:

| Sprint | Focus | Plugs into |
|--------|-------|------------|
| **Sprint 3 — Content** | Editorial depth, authority expansion | `public/seo-data/`, landing `intro`/`buyingAdvice`/`faq` configs, content blocks |
| **Sprint 4 — Authority** | E-E-A-T, hub expansion | Guide manifests, `internalLinks` via link graph, schema extensions |
| **Sprint 5 — Dealer** | Dealer listings, lead routing | Dealer registry, `DEALER` resolver, existing lead API |
| **Sprint 6 — OEM** | OEM hubs beyond brand | `brandLandingDefinitions` pattern or `OEM` route family |
| **Sprint 7 — AI** | Buyer/dealer assistants | `aiSummary` section slot, content blocks, catalog intelligence API |
| **Sprint 8 — Mobile** | Native apps | Same backend + catalog JSON; no web renderer fork |
| **Sprint 9 — Marketplace** | Listings commerce | Catalog + lead engine; new registry type `marketplace` |
| **Sprint 10 — Enterprise APIs** | Partner API | `src/backend/services/` export layer; no change to page layer |

**City, charging, finance pages:** Matrix rows and resolver stubs exist in link graph; landing route families can be added via config following brand/price pattern.

---

# Chapter 18 — New Developer Guide

## Read These 20 Files First

| # | File | Why |
|---|------|-----|
| 1 | `src/App.jsx` | Full route map, Lite redirects, lazy loading |
| 2 | `src/config/evsavariLite.js` | Public vs platform boundary |
| 3 | `src/landing/LandingPage.jsx` | Landing engine entry |
| 4 | `src/landing/LandingRouter.jsx` | How URLs become landings |
| 5 | `src/landing/landingRegistry.js` | Registry API |
| 6 | `src/landing/config/registerProductionLandings.js` | What is registered in prod |
| 7 | `src/landing/types.js` | Config shape, section IDs |
| 8 | `src/landing/sections/sectionRegistry.js` | Section pluggability |
| 9 | `src/linkGraph/index.js` | Link graph API |
| 10 | `src/linkGraph/relationshipMatrix.js` | Who links to whom |
| 11 | `src/seo/pageMetadata.js` | All page meta builders |
| 12 | `src/seo/meta.js` | Title/description/canonical rules |
| 13 | `src/components/SEO/SeoHead.jsx` | Metadata → Helmet |
| 14 | `src/landing/seo/landingSchema.js` | Landing structured data |
| 15 | `src/components/SEO/JsonLd.jsx` | Schema injection |
| 16 | `src/pages/discoveryRoutes.jsx` | Landing + legacy discovery wiring |
| 17 | `src/pages/CarDetails.jsx` | Vehicle page composition |
| 18 | `src/utils/vehicleMedia.js` | Image resolution |
| 19 | `src/services/leadSubmitApi.js` | Lead submission contract |
| 20 | `src/backend/schema/README.md` | Database tables and Supabase setup |

Then skim: `buildBrandLandingConfig.js`, `resolveRelationships.js`, `useLandingCatalog.js`.

---

# Chapter 19 — Forbidden Patterns

| Pattern | Why forbidden |
|---------|---------------|
| **Second metadata engine** (`BrandSeo.jsx`, duplicate Helmet) | Canonical/title drift, duplicate OG tags |
| **Second landing renderer** (`BrandLandingPage.jsx`) | Breaks certification, duplicates catalog/SEO wiring |
| **Brand-specific JSX branches** in `LandingPage.jsx` | Defeats registry; use config |
| **Duplicate routing** for same URL | SEO canonical conflicts |
| **Duplicate schema generators** per page type | Rich result conflicts, invalid JSON-LD |
| **Multiple catalogs** | Price/range drift across pages |
| **Hardcoded internal links** in components | Bypasses link graph; stale anchors |
| **Business logic in presentational components** | Untestable, duplicates filters |
| **Duplicate filter logic** outside `landingFilter.js` / intelligence | Inconsistent rankings |
| **Duplicate registries** | Registration order bugs, TDZ issues (seen in Sprint 2.3 fix) |
| **Parallel link modules** (`brandLinks.js`) | Removed Sprint 2.5 — must not return |
| **Page-specific link logic** | Use `getRelatedPages()` only |
| **Importing landing into vehicle internals** | Wrong dependency direction |
| **Committing secrets** (`.env.vercel.*`) | Security |
| **Static SEO in index.html** | Duplicates Helmet (removed) |

---

# Chapter 20 — Architecture Certification

| Area | Status | Evidence |
|------|--------|----------|
| One Landing Framework | **PASS** | Single `LandingPage.jsx`; 18 registry entries |
| One Landing Router | **PASS** | `LandingRouter.jsx` |
| One Metadata Engine | **PASS** | `pageMetadata` → `meta` → `SeoHead` |
| One Schema Pipeline | **PASS** | `JsonLd` + `landingSchema` / `structuredData` |
| One Link Graph | **PASS** | `src/linkGraph/getRelatedPages` |
| One Catalog Source | **PASS** | Generated dossiers + single resolver |
| One Routing System | **PASS** | `App.jsx` React Router |
| One Vehicle Detail Renderer | **PASS** | `CarDetails.jsx` |
| One Compare Engine | **PASS** | `ComparePage.jsx` |
| One Media Resolver | **PASS** | `vehicleMedia.js` |
| One Lead Submit Path | **PASS** | `leadSubmitApi.js` |
| One Admin Portal | **PASS** | `/admin/*` tree |
| One CRM Pipeline | **PASS** | `crm/leadPipeline.js` |
| No parallel SEO components | **PASS** | Grep: no `BrandSeo.jsx` etc. |
| No forbidden link modules | **PASS** | Sprint 2.5 cert |
| Content blocks for AI | **PASS** | `contentBlocks.js` + DOM IDs |
| Lite boundary documented | **PASS** | `evsavariLite.js` |
| Production Sprint 2.6 certified | **PASS** | `dpl_DFXoZ7SXChr3uunRc2kVS6Hf6eZt` |

---

# Final Section — Architecture Health

## Overall Architecture Health Score: **92 / 100**

| Dimension | Score | Notes |
|-----------|------:|-------|
| Single-engine discipline | 98 | Frozen and certified |
| Extension readiness | 95 | Registry, matrix, section slots |
| Documentation | 85 | ADRs exist; handbook now centralizes |
| Git hygiene | 70 | Sprint 2 prod uncommitted at handbook time |
| Test coverage of architecture | 80 | Cert scripts strong; unit tests sparse |
| Platform/Lite clarity | 90 | `evsavariLite.js` explicit |

## Strengths

- Registry-driven landings scale to new brands/segments without JSX forks
- Link graph eliminated duplicated internal link logic
- SEO/schema pipelines are unified and cert-tested
- Content blocks prepare landings for AI without HTML scraping
- Lite boundary preserves full platform for reactivation
- Catalog remains single source for all vehicle data on site

## Risks

- **Uncommitted Sprint 2 baseline** — production and git history diverge until stabilization commits land
- **Generated file noise** — prebuild regenerates 150+ JSON files; easy to commit accidental timestamps
- **Tracked test-results** — some Playwright artifacts still in git index despite `.gitignore`
- **Local env files** — `.env.vercel.*` untracked but present locally

## Technical Debt

- Compare/guide metadata not yet year-stamped (Sprint 2.6 scope was landings + home/browse/vehicle)
- Some platform routes registered but Lite-hidden — document when reactivating
- Heading hierarchy on compare/vehicle pages may skip levels (cosmetic SEO, not architectural)

## Future Readiness

Architecture supports Dealer, OEM, City, Finance, AI, and Mobile extensions via registry + matrix + backend services **without redesign**. Score: **95/100**.

## Architectural Confidence

**High.** Sprint 2.1–2.6 certifications passed on production. Frozen rules are enforced in code structure, not merely documented. Recommended next step: git stabilization commits (human-approved) — not architecture changes.

---

*End of EVSavari Architecture Handbook v1.0*

*This document describes the system as it exists. It does not authorize changes. Await approval before repository stabilization commits or Sprint 3 work.*
