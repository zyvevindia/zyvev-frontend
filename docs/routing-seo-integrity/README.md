# Routing & SEO Integrity

Canonical vehicle detail URLs use **`/cars/:slug`**. Legacy **`/car/:slug`** paths redirect client-side to the canonical route.

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/cars/:slug` | `CarDetails` | Canonical vehicle detail |
| `/car/:slug` | `LegacyCarRedirect` | Redirect to `/cars/:slug` |
| `/cars` | `ListingPage` | Browse / filter listing |

Route order in `App.jsx`: `/cars/:slug` is registered **before** `/cars` so slugs are not captured by the listing route.

## Utilities

- `src/utils/vehicleRoutes.js` — slug normalization, `vehicleDetailPath()`, `canonicalVehicleUrl()`, legacy alias map
- `src/utils/vehicleDetailResolver.js` — `fetchVehicleBySlug()` with deterministic slug candidate chain + ObjectId fallback
- `src/utils/routeObservability.js` — dev-friendly redirect / lookup logging
- `src/components/routing/LegacyCarRedirect.jsx` — `/car/:slug` → `/cars/:slug`

## SEO

- `CarDetails` sets canonical and Open Graph URLs via `canonicalVehicleUrl(slug)` → `https://evsavari.com/cars/{slug}`
- Tier-1 catalog `seo.canonicalPath` should be `/cars/{slug}` (see backend `build-catalog.mjs`)

## Deploy (Vercel)

`vercel.json` rewrites all paths to `/index.html` for SPA deep links (e.g. refresh on `/cars/tata-nexon-ev-empowered-lr`).

## Verification

```bash
# Frontend
npm run build

# Backend slug audit (from zyvev-backend)
node scripts/audit-catalog-slugs.js
```

Manual checks:

1. Open `/cars/tata-nexon-ev-empowered-lr` — detail page loads
2. Open `/car/tata-nexon-ev-empowered-lr` — redirects to `/cars/...`
3. Hard refresh on a detail URL — no 404 from Vercel

## Legacy slug aliases

Defined in `LEGACY_SLUG_ALIASES` (`vehicleRoutes.js`). Add entries only when a published URL must map to a renamed slug (no fuzzy matching).
