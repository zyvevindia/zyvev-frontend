# Catalog Phase 7B — Retirement Audit

Generated: 2026-06-11T12:01:39.649Z

## Summary

| Metric | Value |
|--------|-------|
| Vehicles audited | 25 |
| Runtime manual dossier imports | 0 |
| Runtime tier1CatalogDefinitions imports | 0 |
| Fallback execution sites | 0 |
| Retired files still on disk | 0 |
| Retired scripts still on disk | 0 |
| Active-code manual references | 0 |
| Dead exports detected | 0 |
| Generated verified dossier coverage | 25 |
| Generated tier1 coverage | 25 |

## Retirement status

Manual verified dossiers and tier1CatalogDefinitions retired. Golden JSON is the sole human-edited catalog source; runtime uses generated artifacts only.

## Deleted manual sources

- `src/data/catalog/verified/tataNexonEvVerified.js` — deleted
- `src/data/catalog/verified/tataPunchEvVerified.js` — deleted
- `src/data/catalog/verified/tataTiagoEvVerified.js` — deleted
- `src/backend/catalog/tier1CatalogDefinitions.js` — deleted

## Deleted legacy scripts

- `scripts/ingest-nexon-dossier.mjs` — deleted
- `scripts/ingest-punch-dossier.mjs` — deleted
- `scripts/sync-nexon-verified-backend-catalog.mjs` — deleted
- `scripts/sync-punch-verified-backend-catalog.mjs` — deleted
- `scripts/sync-tiago-verified-backend-catalog.mjs` — deleted
- `scripts/backend-seed-nexon-ev.mjs` — deleted
- `scripts/validate-nexon-variant-visibility.mjs` — deleted
- `scripts/validate-verified-dossier-productionization.mjs` — deleted

## Remaining manual references (active code)

None.

## Canonical edit path

`public/catalog/golden-dataset/vehicles/*.json` → regenerate via `npm run catalog:generate-verified` / `catalog:generate-tier1` / `catalog:generate-seo`.

## Commands

```bash
npm run catalog:phase7b-audit
```
