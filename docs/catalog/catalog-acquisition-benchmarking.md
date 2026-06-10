# Catalog Acquisition v4 — Accuracy Benchmarking & Production Hardening

Measure extraction quality before increasing automation. Accuracy over autonomy.

## Components

| Feature | Module | Description |
|---------|--------|-------------|
| Golden dataset | `docs/catalog/golden-dataset/` | 8 verified benchmark dossiers |
| Field/variant/price/feature accuracy | `benchmark/evaluateExtraction.js` | Compare extraction vs golden |
| Confidence calibration | `benchmark/confidenceCalibration.js` | Precision by 95–100, 80–94, &lt;80 bands |
| Hallucination detection | `benchmark/hallucinationDetection.js` | Flag fields with no evidence source |
| Evidence coverage | `benchmark/evidenceCoverage.js` | Source count, agreement, quality per field |
| Review metrics | `benchmark/reviewMetrics.js` | Review time, edits, approvals, rejections |
| Quality gates | `benchmark/qualityGates.js` | Block publish on integrity failures |

## Quality gates (publish blocked if)

1. Required fields missing (`brand`, `model`, `familySlug`)
2. Unresolved evidence conflicts
3. Price confidence below 80%
4. Variant count mismatch vs golden dossier (when golden exists)
5. Populated fields without evidence traceability

## CLI

```bash
# Build/regenerate golden JSON from verified dossiers + static benchmarks
npm run catalog-import:build-golden

# Run benchmark against all golden vehicles (heuristic pipeline)
npm run catalog-import:benchmark

# Single vehicle
npm run catalog-import:benchmark -- --vehicle tata-nexon-ev

# LLM provider comparison (OpenAI vs Anthropic vs Heuristic)
npm run catalog-import:llm-benchmark
```

Output: `docs/catalog/benchmark-reports/` (`aggregate.json` + per-vehicle reports).  
LLM comparison: `docs/catalog/benchmark-reports/llm/comparison.json` — see [llm-benchmark-evaluation.md](./llm-benchmark-evaluation.md).

## Admin UI

**Catalog Import Wizard** includes the **Quality & Benchmark (v4)** panel:

- Accuracy metrics vs golden dossier (when family slug matches)
- Confidence calibration table
- Hallucination flags
- Evidence coverage summary
- Publish quality gate status (blocks publish button when failing)

Review time metrics are persisted to `localStorage` (`evsavari-catalog-review-metrics`).

## API integration

`publishCatalogImport()` runs quality gates before Supabase upsert.  
`apiPublishImport()` attaches `benchmarkReport` and `reviewMetrics` to import diagnostics.

## Metrics stored

Each benchmark report includes:

```json
{
  "metrics": {
    "fieldAccuracy": 0.82,
    "variantAccuracy": 0.75,
    "priceAccuracy": 0.90,
    "featureAccuracy": 0.67
  },
  "calibration": { "bands": { "95-100": { "precision": 0.95 } } },
  "hallucination": { "criticalCount": 0 },
  "evidenceCoverage": { "averageEvidenceQuality": 72 },
  "qualityGates": { "passed": true }
}
```

## Design principles

- **No autonomous agents** in v4 — measure first
- Golden dataset is source of truth for benchmarking, not live catalog
- Heuristic/LLM extraction accuracy varies; use calibration reports to tune thresholds
- Re-run `catalog-import:benchmark` after schema or extraction changes

## Related docs

- [Catalog acquisition system](./catalog-acquisition-system.md)
- [Golden dataset](./golden-dataset/README.md)
- [Readiness audit](./catalog-acquisition-readiness-audit.md)
