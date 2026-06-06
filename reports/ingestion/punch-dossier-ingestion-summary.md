# Tata Punch EV Verified Dossier — Ingestion Summary

**Requested:** `Tata_Punch_EV_Dossier_v1(3).xlsx`  
**Ingested from:** `Tata_Punch_EV_Dossier_v1.xlsx` (v1(3) not found on disk)  
**Family slug:** `tata-punch-ev`

## Verification

| Field | Value |
|-------|-------|
| verificationSource | Verified Dossier |
| verificationOwner | Nitin Sharma |
| dossierVersion | v1.0 |

## Counts

| Category | Count |
|----------|------:|
| Variants ingested | 6 |
| Charging records ingested | 6 |
| Safety records ingested | 6 |

### Variants

| Name | Slug |
|------|------|
| Smart | `smart` |
| Smart+ 30 kWh | `smart-plus-30-kwh` |
| Smart+ 40 kWh | `smart-plus-40-kwh` |
| Adventure | `adventure` |
| Empowered | `empowered` |
| Empowered+ | `empowered-plus` |

## Media status

| Field | Value |
|-------|-------|
| verificationStatus | **verified** (URLs present in FAMILY_MASTER) |
| heroImage | Cloudinary URL from dossier |
| compareImage | Cloudinary URL from dossier |
| listingImage | Cloudinary URL from dossier |

If media URLs are absent on re-ingest, existing catalog media is preserved and status becomes `pending_verification` (no placeholders).

## Validation (latest run)

| Command | Result |
|---------|--------|
| `npm run build` | **PASS** |
| `npm run tier1:qa` | **PASS** |
| `npm run compare:trust-audit` | **PASS** |
| `npm run post-launch:smoke` | **PARTIAL** — `backend:persistence-smoke` Supabase `fetch failed` |

## Artifacts

- `src/data/catalog/verified/tataPunchEvVerified.js`
- `scripts/ingest-punch-dossier.mjs`
- JSON: `reports/ingestion/punch-dossier-ingestion-2026-06-05.json`

Re-ingest: `node scripts/ingest-punch-dossier.mjs` or set `PUNCH_DOSSIER_PATH` to `Tata_Punch_EV_Dossier_v1(3).xlsx` when available.
