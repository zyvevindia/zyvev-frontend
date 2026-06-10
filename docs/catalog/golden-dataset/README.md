# Golden Dataset

Manually verified benchmark dossiers for catalog acquisition accuracy evaluation.

## Vehicles

| ID | Model | Verification |
|----|-------|--------------|
| `tata-nexon-ev` | Tata Nexon EV | EVSavari verified dossier |
| `tata-curvv-ev` | Tata Curvv EV | Manual review |
| `tata-punch-ev` | Tata Punch EV | EVSavari verified dossier |
| `mg-windsor-ev` | MG Windsor EV | Manual review |
| `mahindra-be-6` | Mahindra BE 6 | Manual review |
| `mahindra-xev-9e` | Mahindra XEV 9e | Manual review |
| `byd-atto-3` | BYD Atto 3 | Manual review |
| `hyundai-creta-electric` | Hyundai Creta Electric | Ops benchmark (review quarterly) |

## Structure

Each dossier in `vehicles/*.json` contains:

- **vehicle** — brand, model, body type, family slug
- **fields** — scalar benchmark values (pricing, battery, range, charging, safety)
- **features** — feature flags for feature-accuracy benchmarking
- **variants** — variant name, price, battery, range, charging

Schema: `schema.json`  
Index: `manifest.json`

## Regenerate

Nexon and Punch are derived from `src/data/catalog/verified/`. Others are maintained manually.

```bash
npm run catalog-import:build-golden
```

This also mirrors JSON to `public/catalog/golden-dataset/` for the admin benchmark dashboard.

## Usage

```bash
npm run catalog-import:benchmark
npm run catalog-import:benchmark -- --vehicle tata-nexon-ev
```

Reports are written to `docs/catalog/benchmark-reports/`.
