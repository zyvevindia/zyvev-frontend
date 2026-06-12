# Catalog Phase 6.5 — Dead Code & Drift Audit

Generated: 2026-06-11T09:31:34.057Z

## Summary

| Metric | Value |
|--------|-------|
| Files audited | 10 |
| Active references (runtime) | 5 |
| Rollback-only assets | 4 |
| Unused tooling candidates | 8 |
| Drift measurements | 39 |
| Vehicles with manual comparison | 9 |

## Dependency graph

```
Golden JSON (public/catalog/golden-dataset/)
  ├─► generate-verified-dossiers.mjs ──► src/data/catalog/generated/*
  ├─► generate-tier1-definitions.mjs ──► src/backend/catalog/generated/*
  │
  ├─► [RUNTIME — generated primary since 6A]
  │     buildVerifiedDossierVariants.js ──► generated/index.js (first)
  │                                      └─► tata*EvVerified.js (rollback)
  │     backend-seed-tier1.mjs ──► generated/index.js (first)
  │                            └─► tier1CatalogDefinitions.js (rollback)
  │
  ├─► [RUNTIME — still active manual]
  │     normalizeCar.js ──► applyVerifiedCatalogOverlay.js
  │                      └─► buildTata*VerifiedOverlay (tata*EvVerified.js)
  │     vehicleRoutes.js ──► resolveDossierSlug.js
  │     vehicleDetailResolver.js ──► buildVerifiedDossierVariants.js
  │                               └─► resolveDossierSlug.js
  │
  └─► [TOOLING — manual references]
        scripts/backend-seed-tier1.mjs (fallback import)
        scripts/backend-compare-validate.mjs
        scripts/backend-catalog-ops-smoke.mjs
        scripts/lib/loadCatalogForAudit.mjs
        scripts/lib/mediaAuditV1.mjs
        scripts/sync-*-verified-backend-catalog.mjs
        scripts/validate-verified-dossier-productionization.mjs
        scripts/build-golden-dataset.mjs
        scripts/ingest-*-dossier.mjs
```

## Classifications

### `src/data/catalog/verified/buildVerifiedDossierVariants.js` — **ACTIVE**
Runtime cutover layer (generated first, manual rollback).
Runtime consumers: `src/utils/vehicleDetailResolver.js`

### `src/data/catalog/verified/applyVerifiedCatalogOverlay.js` — **ACTIVE**
Tata overlay enrichment in normalizeCar pipeline.
Runtime consumers: `src/data/catalog/verified/applyVerifiedCatalogOverlay.js`, `src/utils/normalizeCar.js`

### `src/data/catalog/verified/resolveDossierSlug.js` — **ACTIVE**
Variant slug alias resolution for routes and detail pages.
Runtime consumers: `src/data/catalog/verified/resolveDossierSlug.js`, `src/utils/vehicleDetailResolver.js`, `src/utils/vehicleRoutes.js`

### `src/data/catalog/verified/nexonSlugAliases.js` — **ACTIVE**
Nexon dossier slug aliases.
Runtime consumers: `src/data/catalog/verified/resolveDossierSlug.js`, `src/data/catalog/verified/tataNexonEvVerified.js`

### `src/data/catalog/verified/punchSlugAliases.js` — **ACTIVE**
Punch dossier slug aliases.
Runtime consumers: `src/data/catalog/verified/resolveDossierSlug.js`, `src/data/catalog/verified/tataPunchEvVerified.js`

### `src/data/catalog/verified/tiagoSlugAliases.js` — **ACTIVE**
Tiago dossier slug aliases.
Runtime consumers: `src/data/catalog/verified/resolveDossierSlug.js`, `src/data/catalog/verified/tataTiagoEvVerified.js`

### `src/data/catalog/verified/tataNexonEvVerified.js` — **ROLLBACK_ONLY**
Manual Nexon dossier; overlays still active at runtime.
Runtime consumers: `src/backend/catalog/tier1CatalogDefinitions.js`, `src/data/catalog/verified/applyVerifiedCatalogOverlay.js`, `src/data/catalog/verified/buildVerifiedDossierVariants.js`, `src/data/catalog/verified/resolveDossierSlug.js`

### `src/data/catalog/verified/tataPunchEvVerified.js` — **ROLLBACK_ONLY**
Manual Punch dossier; overlays still active at runtime.
Runtime consumers: `src/backend/catalog/tier1CatalogDefinitions.js`, `src/data/catalog/verified/applyVerifiedCatalogOverlay.js`, `src/data/catalog/verified/buildVerifiedDossierVariants.js`, `src/data/catalog/verified/resolveDossierSlug.js`

### `src/data/catalog/verified/tataTiagoEvVerified.js` — **ROLLBACK_ONLY**
Manual Tiago dossier; overlays still active at runtime.
Runtime consumers: `src/backend/catalog/tier1CatalogDefinitions.js`, `src/data/catalog/verified/applyVerifiedCatalogOverlay.js`, `src/data/catalog/verified/buildVerifiedDossierVariants.js`, `src/data/catalog/verified/resolveDossierSlug.js`

### `src/backend/catalog/tier1CatalogDefinitions.js` — **ROLLBACK_ONLY**
Manual tier1 seed definitions (11 families); generated primary since Phase 6A.


## Drift statistics (generated vs manual)

| Field | Drift count |
|-------|-------------|
| `variantCount` | 13 |
| `pricing` | 5 |
| `range` | 3 |
| `battery` | 2 |
| `charging` | 1 |
| `power` | 0 |
| `torque` | 0 |
| `media` | 15 |

Drift is documented only — not a failure.

## Safe deletion candidates

- `scripts/ingest-nexon-dossier.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/ingest-punch-dossier.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/sync-nexon-verified-backend-catalog.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/sync-punch-verified-backend-catalog.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/sync-tiago-verified-backend-catalog.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/backend-seed-nexon-ev.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/validate-nexon-variant-visibility.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.
- `scripts/validate-verified-dossier-productionization.mjs` — Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.

## Requires migration before deletion

- **src/data/catalog/verified/tataNexonEvVerified.js** → src/data/catalog/generated/* (blockers: buildTataNexonVerifiedOverlay still ACTIVE in normalizeCar)
- **src/data/catalog/verified/tataPunchEvVerified.js** → src/data/catalog/generated/* (blockers: buildTataPunchVerifiedOverlay still ACTIVE in normalizeCar)
- **src/data/catalog/verified/tataTiagoEvVerified.js** → src/data/catalog/generated/* (blockers: buildTataTiagoVerifiedOverlay still ACTIVE in normalizeCar)
- **src/backend/catalog/tier1CatalogDefinitions.js** → src/backend/catalog/generated/* (blockers: backend-compare-validate.mjs uses getTier1Definition(); backend-catalog-ops-smoke.mjs iterates TIER1_CATALOG_DEFINITIONS; loadCatalogForAudit.mjs reads manual definitions)
- **scripts/backend-compare-validate.mjs** → loadGeneratedTier1Definition from generated/index.js
- **scripts/lib/loadCatalogForAudit.mjs** → generated tier1 index
- **scripts/lib/mediaAuditV1.mjs** → golden media or generated dossier media

## Requires wrappers (keep for now)

- `src/data/catalog/verified/buildVerifiedDossierVariants.js` — Keep as cutover wrapper until manual rollback path is removed in Phase 7.

## Commands

```bash
npm run catalog:phase65-audit
```
