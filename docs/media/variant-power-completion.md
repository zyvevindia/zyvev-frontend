# Variant Power Completion Sprint

**Date:** 2026-06-08  
**Scope:** Golden fleet catalog data only (`public/catalog/golden-dataset/vehicles/*.json`)

## Goal

Populate the **Power** column in Variant Details for all vehicles whose dossiers had `fields.powerPs: null`, achieving full fleet coverage for Price, Battery, ARAI Range, Real World Range, Charging, and Power.

## Coverage

| Metric | Before | After |
| ------ | ------ | ----- |
| Vehicles with `fields.powerPs` | 8 / 25 | 25 / 25 |
| Variant table fully populated | 8 / 25 | **25 / 25** |
| Power column gaps | 17 vehicles | **0** |

## Vehicles enriched (17)

| Vehicle | `fields.powerPs` | `fields.powerKw` | Variant notes |
| ------- | ---------------- | ---------------- | ------------- |
| BMW iX1 | 313 | 230 | Family-level (all variants) |
| BYD Atto 3 | 204 | 150 | Family-level |
| Hyundai Creta Electric | 171 | 126 | 42 kWh → 135 PS; 51 kWh → 171 PS |
| Hyundai Ioniq 5 | 229 | 168 | RWD → 217 PS; AWD → 325 PS |
| Hyundai Kona Electric | 136 | 100 | Family-level |
| Mahindra BE 6 | 286 | 210 | 59 kWh → 231 PS; 79 kWh → 286 PS |
| Mahindra XEV 9e | 286 | 210 | 79 kWh variants → 286 PS |
| Mahindra XUV400 | 150 | 110 | Family-level |
| Maruti Suzuki e Vitara | 174 | 128 | 49 kWh → 144 PS; 61 kWh → 174 PS |
| Mercedes-Benz EQA | 190 | 140 | Family-level |
| Mercedes-Benz EQB | 190 | 140 | 250 → 190 PS; 350 4MATIC → 292 PS |
| MG Comet EV | 42 | 31 | Family-level |
| MG Windsor EV | 136 | 100 | Family-level |
| MG ZS EV | 177 | 130 | Family-level |
| Tata Curvv EV | 167 | 123 | 45 kWh → 150 PS; 55 kWh → 167 PS |
| Tata Harrier EV | 238 | 175 | RWD → 238 PS; QWD → 396 PS (cumulative) |
| Tata Tiago EV | 75 | 55 | 19.2 kWh → 61 PS; 24 kWh → 75 PS |

## OEM sources

Power values were taken from manufacturer India specifications (brochures, official spec pages, or press kits) cross-checked with CarDekho / Autocar India where noted in each dossier's `populationMeta.powerEnrichment.source`.

## Propagation

`goldenDossierToMarketplaceVariants()` already inherits `row.powerPs ?? fields.powerPs` into `catalogMeta.performance` and `specifications.powerBhp`. Variant-level overrides are set where motor output differs by battery pack or drivetrain (e.g. Harrier QWD, Curvv 45 vs 55 kWh).

## Audit

```bash
node scripts/audit-variant-power-completion.mjs
```

Machine-readable output: `docs/media/variant-power-completion.json`

Apply script (re-run safe): `scripts/apply-variant-power-completion.mjs`

## Sample — Tata Harrier EV

After enrichment, Variant Details show:

- **RWD variants:** 238 PS, DC 120 kW • 25 min, real-world range estimate from ARAI claim
- **QWD variants:** 396 PS, same charging profile

## Out of scope

No changes to score engine, SEO, platform agents, routing, UX layouts, or variant comparison UI components.
