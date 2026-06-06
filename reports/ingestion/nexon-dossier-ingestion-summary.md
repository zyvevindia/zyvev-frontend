# Tata Nexon EV Verified Dossier — Ingestion Summary

**Workbook:** `Tata_Nexon_EV_Dossier_v1.xlsx`  
**Generated:** 2026-06-05  
**Family slug:** `tata-nexon-ev`

## Verification metadata

| Field | Value |
|-------|-------|
| verificationSource | Verified Dossier |
| verificationOwner | Nitin Sharma |
| dossierVersion | v1 |

## Ingestion counts

| Category | Count |
|----------|------:|
| Variants ingested | 13 |
| Charging records ingested | 13 |
| Safety records ingested | 13 |
| Media records ingested | 3 |

### Variants (trimmed names, no collapse)

1. Creative+ MR → `creative-plus-mr`
2. Fearless MR → `fearless-mr`
3. Fearless+ MR → `fearless-plus-mr`
4. Fearless+ S MR → `fearless-plus-s-mr`
5. Empowered MR → `empowered-mr`
6. Creative 45 → `creative-45`
7. Fearless 45 → `fearless-45`
8. Empowered LR → `empowered-lr`
9. Empowered+ 45 → `empowered-plus-45`
10. Empowered+ 45 Red Dark → `empowered-plus-45-red-dark`
11. Empowered+ A 45 → `empowered-plus-a-45`
12. Empowered+ A 45 Dark → `empowered-plus-a-45-dark`
13. Empowered+ A 45 Red Dark → `empowered-plus-a-45-red-dark`

### Media (Cloudinary — FAMILY_MASTER)

- **heroImage:** `https://res.cloudinary.com/dznvmumze/image/upload/v1780678387/heroImage_y5qmzt.jpg`
- **compareImage:** `https://res.cloudinary.com/dznvmumze/image/upload/v1780678042/compaeImage.jpg`
- **listingImage:** `https://res.cloudinary.com/dznvmumze/image/upload/v1780678067/listingImage.jpg`

### Charging intelligence (per variant)

- CCS2 connector
- Portable charging cable: Yes (all variants)
- AC 3.3 kW and 7.2 kW times (MR vs LR battery groups)
- DC 50 kW (MR) / 60 kW (LR) 10–80% times
- Fast charging: supported (all variants)

### Safety intelligence (per variant)

- Bharat NCAP 5 Star + child safety 5 Star
- 6 airbags, ESC, ISOFIX, Hill Assist (all variants)
- TPMS / 360° camera / ADAS matrix vary by trim (workbook values preserved)
- Full ADAS feature matrix on Empowered+ A 45 / Dark / Red Dark trims

## Files touched

- `src/data/catalog/verified/tataNexonEvVerified.js` — verified overlay + tier1 builder
- `src/data/catalog/verified/applyVerifiedCatalogOverlay.js` — Nexon overlay registration
- `src/backend/catalog/tier1CatalogDefinitions.js` — `buildTataNexonTier1Definition()`
- `scripts/ingest-nexon-dossier.mjs` — repeatable dossier ingestion
- `scripts/lib/loadCatalogForAudit.mjs` — verification + media fields for audits

## Validation results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run build` | **PASS** | Vite production build succeeded |
| `npm run tier1:qa` | **PASS** | Structural tier-1 QA (5-family cohort) |
| `npm run compare:trust-audit` | **PASS** | Report written, exit 0 |
| `npm run post-launch:smoke` | **PARTIAL** | Failed at `backend:persistence-smoke` — `TypeError: fetch failed` (Supabase network); all prior smoke steps passed including tier1:qa and compare:trust-audit |

## Re-run ingestion

```bash
node scripts/ingest-nexon-dossier.mjs
```

Set `NEXON_DOSSIER_PATH` to override workbook location.
