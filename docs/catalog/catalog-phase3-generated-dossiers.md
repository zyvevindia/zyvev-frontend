# Catalog Phase 3 — Generated Verified Dossiers

Generated: 2026-06-11T08:41:34.675Z

## Summary

- Generated dossier modules: **25**
- Vehicles audited: **25**
- Manual dossier families: **3**
- Total mismatches: **0**

## Dependency map

### Manual verified (runtime, preserved)

- `tata-nexon-ev`
- `tata-punch-ev`
- `tata-tiago-ev`

### Generated output (parallel, not runtime)

- `src/data/catalog/generated/*.js`
- `src/data/catalog/generated/index.js`

### Runtime consumers (unchanged)

- buildVerifiedDossierVariants.js → hasVerifiedDossier / buildVerifiedDossierMarketplaceVariants
- vehicleDetailResolver.js (legacy verified branch)
- applyVerifiedCatalogOverlay.js → normalizeCar
- tier1CatalogDefinitions.js → Supabase seed
- resolveDossierSlug.js → vehicleRoutes.js

## Per-vehicle comparison

| Family | Manual | Generated variants | Mismatches | Status |
|--------|--------|-------------------|------------|--------|
| `tata-nexon-ev` | yes | 13 | 0 | manual-vs-generated |
| `tata-punch-ev` | yes | 6 | 0 | manual-vs-generated |
| `tata-curvv-ev` | — | 3 | 0 | generated-only |
| `mg-windsor-ev` | — | 3 | 0 | generated-only |
| `mahindra-be-6` | — | 3 | 0 | generated-only |
| `mahindra-xev-9e` | — | 3 | 0 | generated-only |
| `byd-atto-3` | — | 3 | 0 | generated-only |
| `hyundai-creta-electric` | — | 3 | 0 | generated-only |
| `mg-comet-ev` | — | 3 | 0 | generated-only |
| `hyundai-ioniq-5` | — | 2 | 0 | generated-only |
| `kia-ev6` | — | 2 | 0 | generated-only |
| `mahindra-xuv400` | — | 4 | 0 | generated-only |
| `byd-seal` | — | 3 | 0 | generated-only |
| `bmw-ix1` | — | 2 | 0 | generated-only |
| `mercedes-eqa` | — | 2 | 0 | generated-only |
| `mercedes-eqb` | — | 2 | 0 | generated-only |
| `volvo-ex40` | — | 2 | 0 | generated-only |
| `mini-cooper-se` | — | 2 | 0 | generated-only |
| `citroen-ec3` | — | 4 | 0 | generated-only |
| `mg-zs-ev` | — | 3 | 0 | generated-only |
| `maruti-e-vitara` | — | 3 | 0 | generated-only |
| `hyundai-kona-electric` | — | 1 | 0 | generated-only |
| `tata-tigor-ev` | — | 4 | 0 | generated-only |
| `tata-tiago-ev` | yes | 4 | 0 | manual-vs-generated |
| `tata-harrier-ev` | — | 8 | 0 | generated-only |

## Hidden precedence (documented, not removed)

### manual-verified-dossier-runtime

- **Location:** `src/data/catalog/verified/buildVerifiedDossierVariants.js`
- **Consumers:**
  - vehicleDetailResolver.js (legacy branch)
  - applyVerifiedCatalogOverlay.js
  - tier1CatalogDefinitions.js
- **Phase 3:** Still active at runtime — generated dossiers are parallel only.

### normalize-car-overlay

- **Location:** `src/utils/normalizeCar.js → applyVerifiedCatalogOverlay`
- **Description:** Manual overlay applied during normalizeCar for Tata families.
- **Phase 3:** Unchanged — not wired to generated dossiers yet.

### slug-alias-resolvers

- **Location:** `src/data/catalog/verified/*SlugAliases.js, resolveDossierSlug.js`
- **Phase 3:** Manual slug maps remain; generated uses golden slugify rules.

### golden-runtime-authority

- **Location:** `vehicleDetailResolver.js + compareGuideCatalog.js`
- **Phase 3:** Production variant data uses golden JSON directly; verified JS is legacy parallel.

