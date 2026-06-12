# Catalog Phase 6A — Runtime Cutover

Generated: 2026-06-11T09:17:50.188Z

## Summary

| Metric | Value |
|--------|-------|
| Vehicles audited | 25 |
| Generated verified dossier usage | 25 |
| Generated tier1 usage | 25 |
| Manual fallback count | 0 |
| Mismatch count | 0 |
| Manual runtime drift (documented) | 18 |

## Fields compared

- `variantCount`
- `battery`
- `range`
- `charging`
- `power`
- `torque`
- `media`
- `pricing`

## Runtime consumers switched

- **buildVerifiedDossierVariants.js**: hasVerifiedDossier / buildVerifiedDossierMarketplaceVariants prefer generated dossiers; manual rollback on missing generated.
- **backend-seed-tier1.mjs**: Seeds from src/backend/catalog/generated/index.js first; tier1CatalogDefinitions.js manual fallback.
- **vehicleDetailResolver.js**: Unchanged import surface — consumes buildVerifiedDossierVariants cutover layer.

## Rollback preserved

- `src/data/catalog/verified/*`
- `src/backend/catalog/tier1CatalogDefinitions.js`

## Fleet audit

Generated runtime matches golden canonical (0 mismatches).

Manual-vs-generated drift is documented separately and does not fail the cutover audit.

## Commands

```bash
npm run catalog:phase6a-audit
npm run catalog:generate-verified
npm run catalog:generate-tier1
```
