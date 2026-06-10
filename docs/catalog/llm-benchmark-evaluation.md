# LLM Benchmark Evaluation

Measure catalog extraction quality across OpenAI, Anthropic, and heuristic baseline using identical inputs.

**Measurement only** — no new catalog features or agents.

## Run

```bash
npm run catalog-import:build-golden
npm run catalog-import:llm-benchmark
```

Requires API keys in environment:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CATALOG_OPENAI_MODEL=gpt-4o-mini          # optional
CATALOG_ANTHROPIC_MODEL=claude-3-5-haiku-latest  # optional
```

Single vehicle or provider subset:

```bash
npm run catalog-import:llm-benchmark -- --vehicle tata-nexon-ev
npm run catalog-import:llm-benchmark -- --providers openai,heuristic
```

## Metrics (all 8 golden dossiers)

| Metric | Description |
|--------|-------------|
| Field Accuracy | Scalar fields vs golden |
| Price Accuracy | Vehicle + variant prices |
| Variant Accuracy | Variant name matching |
| Feature Accuracy | Feature flags |
| Coverage | Populated fields / total schema fields |
| Hallucination Rate | Flagged fields / populated fields |
| Gate Pass Rate | Production quality gate pass % |
| Review Time Estimate | From attention field count (2–15 min bands) |

## Outputs

| File | Description |
|------|-------------|
| `docs/catalog/benchmark-reports/llm/comparison.json` | Full comparison + cost + recommendation |
| `docs/catalog/benchmark-reports/llm/comparison.md` | Human-readable report |
| `docs/catalog/benchmark-reports/llm/{provider}-{vehicle}.json` | Per-run detail |
| `public/catalog/benchmark-reports/llm-comparison.json` | Admin dashboard feed |

## Dashboard

`/admin/catalog/benchmark` — provider comparison table, cost analysis, recommended default provider.

## Cost projections

Based on actual token usage per run (when LLM APIs return usage):

- Cost per vehicle onboarding
- Cost per 100 vehicles
- Monthly refresh (25 vehicles default)

Pricing tables: `src/catalogAcquisition/benchmark/costAnalysis.js`

## Recommendation

Weighted composite score:

- Accuracy (40%)
- Variant handling (25%)
- Cost (20%)
- Latency (15%)

Plus gate pass bonus and hallucination penalty.

Set production default via `CATALOG_AI_PROVIDER=openai|anthropic`.

## Related

- [Catalog acquisition benchmarking](./catalog-acquisition-benchmarking.md)
- [Golden dataset](./golden-dataset/README.md)
