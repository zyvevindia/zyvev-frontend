# Catalog data quality roadmap (Alpha Platform Stable v1)

Operational standards for catalog accuracy, compare integrity, and SEO content — aligned with the stabilized frontend (v1).

## Goals

1. **Truthful buyer UX** — Prices, range, and scores match catalog source of truth.
2. **No broken media** — Zero dead CDN hosts; Cloudinary-first delivery.
3. **Compare integrity** — Full vehicle names, stable scores, no duplicate editorial.
4. **SEO safety** — Static JSON and live API merges do not emit invalid media refs.

## Missing image handling

| Tier | Family | Policy |
|------|--------|--------|
| Tier-1 | `productionFamilies.js` slugs | Must have Cloudinary `compare-thumb` + `listing-thumb`; hero optional for compare fallback |
| Non–tier-1 | All others | Placeholder allowed; block non-production `/hero` Cloudinary paths to prevent 404 |
| API-only CDN URL | Legacy `cdn.evsavari.com` | Rewritten at runtime; purge from API in backlog |
| Gallery | Detail page | Each URL through `getSafeImage()`; broken thumbs skipped |

**Frontend behavior:** Missing compare image → “EV image coming soon” (no `<img>` request). Missing listing image → `/fallback-ev.svg` after chain exhaustion.

## Stale pricing policy

- **Source of truth:** API `startingPrice` / `price` on variant documents.
- **Display:** `formatIndianPrice` / `formatIndianPriceCompact` on cards; never invent price.
- **Homepage filters:** Price bands filter on aggregated family `startingPrice` (min variant).
- **Roadmap:** Add `priceUpdatedAt` visibility in admin QA; flag families where API price &gt; 90 days stale (backend).

## Confidence scoring

**EVSavari Score** (compare cards):

1. `car.evScores.composite`
2. `car.evIntelligence.scores.composite`
3. `car.catalogMeta.compareValueScore`

Round to integer; hide gauge if none present (no fake score).

**Catalog meta signals** (`pickListingSignals`, trust panels) — max 2 chips on listing cards; sourced from `catalogMeta` only.

## Catalog validation

**Build-time:**

- `npm run content:generate` — registry duplicate paths/titles
- `npm run build:sitemaps` — URL counts and robots

**Runtime:**

- `normalizeCar` — slug warnings via `productionLog`
- `sanitizeCarImageFields` — strips invalid media on every row
- `safeFetchJson` / `safeFetchJsonWithRetry` — homepage catalog load

**Recommended CI / ops:**

- `npm run launch:validate` with production `VITE_API_URL`
- `npm run deploy:smoke` against `https://evsavari.com`
- Media QA page (`/admin` MediaQa) — tier-1 Cloudinary probe

## Fallback hierarchy

### Images (by role)

**Compare:**

1. API `compareThumbnail`
2. API `image` / `listingThumbnail`
3. API `heroImage` (tier-1 Cloudinary `/hero` only)
4. Manifest `compare-thumb` → `listing-thumb` → `hero`
5. Placeholder (no network)

**Listing / homepage:**

1. API `listingThumbnail` / `image`
2. Manifest listing assets
3. `/fallback-ev.svg`

**Detail hero:**

1. Selected color image
2. `heroImage` / gallery
3. `getSafeImage` → SVG

### Data (homepage)

1. `GET {API_URL}/cars?...`
2. On failure: error banner + retry (no fake empty catalog)
3. `aggregateModelFamilies` → section cards

## Compare data integrity

| Rule | Implementation |
|------|----------------|
| Full display names | `resolveFullDisplayName` + `preserveOemCasing`; SEO merge via `applyCompareDisplayName` |
| No short trim-only titles | `combineSeoBaseWithCatalogName` when API name is trim (e.g. “Mg Play”) |
| Hook order | `compareSeoPage` `useMemo` before loading/error returns in `DiscoverySeoPage` |
| Image role | `CompareVehicleCard` → `resolveCatalogImageUrl(car, "compare")` only |
| Max 3 vehicles | `compareCarsStorage` + hub UX |
| Editorial once | `CompareGuideEditorialSections` below fold; no duplicate hero copy |

**Test URLs:**

- `/compare` — hub, empty state, 1–3 cars from storage
- `/compare/comet-ev-vs-tiago-ev` — SEO guide + live catalog merge
- Mobile 768px — score column below highlights, 88px gauge

## SEO content validation

- Static payloads: `public/seo-data/*.json` + `content-manifest.json`
- Compare slugs: `recommendationLogic.compareSlugs` or `rankedVehicles[].slug`
- `fetchCatalogCarsForCompareSlugs` + `mergeRankedWithCatalogCars` — order preserved
- Canonical URLs via `buildCompareGuideMeta` / `SeoHead`
- No media fields required in SEO JSON; images come from catalog API + tier-1 manifest

## Environment requirements (production)

| Variable | Requirement |
|----------|-------------|
| `VITE_API_URL` | HTTPS public API (e.g. `https://evsavari-api.onrender.com`); must not be `localhost` in production builds |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dznvmumze` (never `evsavari`) |

Misconfigured `VITE_API_URL` logs `[EVSavari] Production build has VITE_API_URL pointing at localhost` and shows a explicit homepage error.

## v1 known risks / backlog

1. **API purge** — Remove `cdn.evsavari.com` strings from database API responses.
2. **Custom CDN** — Re-enable only after DNS + TLS + origin mapping to Cloudinary is verified.
3. **Non–tier-1 compare images** — Placeholder until assets uploaded or API supplies valid Cloudinary URLs.
4. **Price freshness** — No UI staleness indicator yet.
5. **Gallery 404s** — Speculative `exterior-*.jpg` manifest entries not requested at runtime by design.

## Compare scoring philosophy

EVSavari Score on compare cards is **descriptive, not predictive**:

- Prefer live intelligence (`evScores`, `evIntelligence`) when attached to compare rows.
- Fall back to editorial `catalogMeta.compareValueScore` only when intelligence is absent.
- Never fabricate a score — gauge hidden when all sources are null.
- Scores are rounded integers 0–100; no decimal precision implied.
- Compare **recommendation** (`recommendationLogic`, best-value heuristic) is separate from the score circle — do not treat score as sole “winner” without editorial context.

Pills (“This EV is better at”) come from `strongestAdvantages` → `comparePicks` → `pros` → suitability insights — max 4 pills, deduped by label text.

## Confidence metadata rules

| Signal | Source | Display cap |
|--------|--------|-------------|
| Listing chips | `catalogMeta` trust/listing signals | 2 on cards |
| Ownership chips | `ownershipReality` derivations | 2 on detail |
| Compare strength/tradeoff | `comparePicks` / narrative | 1 line each |
| EVSavari Score | See above | 1 gauge or hidden |

Do not surface confidence labels without `catalogMeta` or intelligence backing.

## Freshness policy

| Data type | Source of truth | Staleness handling (v1) |
|-----------|-----------------|-------------------------|
| Price | API variant/family | Display as-is; no “stale” badge yet |
| Range / battery | API `specifications` | Same |
| SEO compare copy | `public/seo-data/*.json` | Regenerated on `npm run content:generate` |
| Images | Cloudinary + API URLs | Runtime sanitization; no TTL |

**Ops backlog:** `priceUpdatedAt`, `mediaUpdatedAt` on catalog records (backend).

## Source hierarchy

**Images (compare):** API `compareThumbnail` → `image` / `listingThumbnail` → `heroImage` (tier-1 only) → manifest `compare-thumb` → `listing-thumb` → `hero` → placeholder (no request).

**Images (listing):** API listing fields → manifest → `/fallback-ev.svg`.

**Vehicle names:** `fullDisplayName` → `resolveFullDisplayName` (SEO `displayName` + catalog name merge) → `preserveOemCasing`.

**Catalog list:** `GET /cars` API → `normalizeCar` → `aggregateModelFamilies`.

**Compare SEO vehicles:** `rankedVehicles` stubs + `fetchCatalogCarsForCompareSlugs` merge (API wins over stub when present).

## API reliability (buyer surfaces)

| Surface | Fetch helper | Retry | User message |
|---------|--------------|-------|--------------|
| Homepage | `safeFetchJsonWithRetry` | Yes | `catalogUnavailableMessage` + cold-start copy |
| Listing | `safeFetchJsonWithRetry` | Yes | Listing error state |
| Detail | `safeFetchJsonWithRetry` probe + resolver | Yes | `detailUnavailableMessage` |
| Compare SEO | `fetchCatalogCarsForCompareSlugs` | Yes | Retry button on partial state |
| Leads | `safeFetchJson` | No auto-retry | Inline form error |

Diagnostics: `logApiRequest` in `src/utils/apiDiagnostics.js` — deduped `console.warn` on failure, duration logged in dev.

## Ownership

| Area | Primary files |
|------|----------------|
| Media pipeline | `src/media/`, `src/utils/imageUrl.js`, `src/utils/vehicleMedia.js` |
| API fetch | `src/utils/safeFetch.js`, `src/utils/apiDiagnostics.js` |
| Compare UX | `src/components/compare/`, `src/utils/compareGuideCatalog.js` |
| Homepage catalog | `src/pages/Home.jsx`, `src/utils/modelFamily.js` |
| Detail | `src/pages/CarDetails.jsx`, `src/components/car/DetailHero.jsx` |
| SEO compare | `src/pages/DiscoverySeoPage.jsx`, `public/seo-data/` |
| Tier-1 audit | `docs/operations/tier1-catalog-audit.md` |
