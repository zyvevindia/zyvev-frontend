# EVSavari UX Sprint 1 — Wave B Implementation

Generated: 2026-06-10  
Build: `npm run build` — **passed**  
Platform agents / Score Engine core: **not modified** (read-only `scoreVehicle` consumption)

---

## Recommendation

**READY_FOR_WAVE_C**

All four Wave B issues shipped. Unified filter sources, score badges on cards, and homepage discovery tiles are live. Next audit items (mobile compare cards, pagination, accessibility pass) remain in Wave C scope.

---

## Summary

| Issue | Status |
|-------|--------|
| 1 — Body-type filters | ✅ Done |
| 2 — Unified price filters | ✅ Done |
| 3 — EVSavari score on cards | ✅ Done |
| 4 — Homepage category tiles | ✅ Done |

---

## Issue 1 — Body-type filter

**Files changed**

- `src/intelligence/bodyTypeCatalog.js` *(new)*
- `src/intelligence/filterDefinitions.js`
- `src/intelligence/familyIntelligence.js`
- `src/intelligence/catalogFilters.js`
- `src/components/discovery/CatalogFilterSelects.jsx`
- `src/pages/Home.jsx`
- `src/pages/ListingPage.jsx`

**Before**

- `BODY_TYPE_TAXONOMY` existed but was unused in UI.
- No body-type filtering on Home or `/cars`.

**After**

- Seven body types exposed: Hatchback, Sedan, SUV, Compact SUV, Coupe SUV, MPV, Luxury SUV.
- Classification via `classifyFamilyBodyType()` on catalog metadata + name heuristics + price refinement.
- **Home:** body-type dropdown in filter bar.
- **`/cars`:** body-type dropdown + **Body type** chip group in `EvDiscoveryFilters` (desktop and mobile share the same chip row).
- URL param `?body=suv` on listing; synced with chips (dropdown clears body chips and vice versa).

---

## Issue 2 — Unified price filters

**Files changed**

- `src/intelligence/catalogPriceFilters.js` *(new)*
- `src/intelligence/catalogFilters.js`
- `src/intelligence/filterMatcher.js`
- `src/utils/modelFamily.js`
- `src/components/discovery/CatalogFilterSelects.jsx`
- `src/pages/Home.jsx`
- `src/pages/ListingPage.jsx`

**Before**

- Home: Below ₹10L / ₹10–20L / Above ₹20L (legacy `low` / `mid` / `high`).
- Listing: no price dropdown; only “Under ₹15 lakh” intelligence chip.
- Duplicate logic in `filterFamilies` and `filterEnrichedFamilies`.

**After**

- Single source: `CATALOG_PRICE_RANGES` in `catalogPriceFilters.js`:

  | ID | Label |
  |----|-------|
  | `under_10` | Under ₹10 lakh |
  | `10_15` | ₹10–15 lakh |
  | `15_20` | ₹15–20 lakh |
  | `20_30` | ₹20–30 lakh |
  | `above_30` | Above ₹30 lakh |

- Shared `filterCatalogFamilies()` pipeline for Home and Listing.
- Legacy aliases (`low`, `mid`, `high`) normalized automatically.
- Listing URL: `?price=10_15` (shareable).
- Premium tile links to `/cars?price=above_30`.
- Home API fetch sends only `brand` + debounced `search` (price filtered client-side for consistency).

---

## Issue 3 — EVSavari score on cards

**Files changed**

- `src/components/catalog/CatalogScoreBadge.jsx` *(new)*
- `src/styles/catalog-ux-wave-b.css`
- `src/components/CompactCarCard.jsx` — homepage cards
- `src/components/CarCard.jsx` — listing / search results
- `src/utils/modelFamily.js` — passes `evSavariScores` through `familyToListingCard`

**Before**

- Cards showed psychology signal chips only; no numeric EVSavari score.

**After**

- Compact badge after price: **score + grade** (e.g. `88` `A`, `74` `B+`).
- Uses pre-enriched `evSavariScores` when present; otherwise calls `scoreVehicle()` (no Score Engine changes).
- Visible on Home carousels and `/cars` listing grid.

---

## Issue 4 — Homepage category tiles

**Files changed**

- `src/components/home/HomeCategoryTiles.jsx` *(new)*
- `src/styles/catalog-ux-wave-b.css`
- `src/pages/Home.jsx`

**Before**

- No use-case entry points below hero; discovery required footer/guides.

**After**

- Six tiles linking to score-ranked discovery:

  | Tile | Destination |
  |------|-------------|
  | Family EVs | `/discover/family-friendly` |
  | City EVs | `/discover/city-driving` |
  | Highway EVs | `/discover/highway-evs` |
  | Budget EVs | `/discover/under-15-lakh` |
  | Premium EVs | `/cars?price=above_30` |
  | Fast Charging | `/discover/fastest-charging` |

- **Desktop:** 2×3 grid.
- **Mobile (≤768px):** horizontal scrollable cards.

---

## Screens tested (code + build validation)

| Screen | Checks |
|--------|--------|
| Homepage `/` | Category tiles; price + body dropdowns; score badges on cards |
| Listing `/cars` | Price + body dropdowns; smart filter chips including body type; score on `CarCard` |
| Listing `/cars?price=10_15&body=suv` | URL-driven filters |
| Mobile layout | Category tile scroll; filter bar wraps (`auto-fit` grids) |
| Build | `npm run build` ✅ |

---

## Files changed (complete list)

| File | Role |
|------|------|
| `src/intelligence/catalogPriceFilters.js` | Unified price bands |
| `src/intelligence/bodyTypeCatalog.js` | Body type taxonomy + classification |
| `src/intelligence/catalogFilters.js` | Shared filter pipeline |
| `src/intelligence/filterDefinitions.js` | Body-type intelligence chips |
| `src/intelligence/filterMatcher.js` | Delegates to catalog filters |
| `src/intelligence/familyIntelligence.js` | `taxonomyTags.bodyType` |
| `src/utils/modelFamily.js` | Shared filtering + score passthrough |
| `src/components/discovery/CatalogFilterSelects.jsx` | Price + body `<select>` |
| `src/components/catalog/CatalogScoreBadge.jsx` | Compact score UI |
| `src/components/home/HomeCategoryTiles.jsx` | Discovery tiles |
| `src/components/CompactCarCard.jsx` | Home score badge |
| `src/components/CarCard.jsx` | Listing score badge |
| `src/pages/Home.jsx` | Tiles + unified filters |
| `src/pages/ListingPage.jsx` | Unified filters + URL sync |
| `src/styles/catalog-ux-wave-b.css` | Score badge + tile styles |

---

## Wave C preview (from audit)

- Mobile compare spec card layout
- Catalog pagination beyond 50 variants
- Homepage `View All` → React Router `<Link>`
- Accessibility pass on filters
- Lazy-load Home bundle

---

*See also [`ux-sprint-1-audit.md`](./ux-sprint-1-audit.md), [`ux-wave-a-implementation.md`](./ux-wave-a-implementation.md).*
