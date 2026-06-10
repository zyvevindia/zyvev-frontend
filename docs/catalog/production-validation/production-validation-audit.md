# Production Validation Audit

Generated: 2026-06-09

Real OEM URLs + PDFs via catalog acquisition v3/v4 pipeline. Measurement only — no code changes.

## Primary question

**Can a human publish a production-quality vehicle in under 10 minutes?**

**Answer: No**

| Evidence | Value |
|----------|-------|
| Vehicles under 10 min + gates pass | 0 / 5 |
| Avg estimated review time | 3 min |
| Quality gate pass rate | 0% |
| Avg publish readiness score | 29.4 / 100 |
| OEM PDFs acquired | 0 / 5 |

---

## Aggregate metrics

| Metric | Value |
|--------|-------|
| Vehicles tested | 5 |
| Pipeline success | 5 |
| Avg field coverage vs golden | 29.5% |
| Avg variant coverage | 56.9% |
| Avg price accuracy | 9% |
| Avg feature coverage | 0% |
| Total estimated manual corrections | 179 |

---

## Per-vehicle reports

### Tata Curvv EV (`tata-curvv-ev`)

| Metric | Value |
|--------|-------|
| OEM URL | https://www.tatamotors.com/curvv/ev |
| PDF | Not acquired |
| Pipeline time | 55.0s |
| Sources acquired | 2 |
| Fields extracted / expected | 8 / 23 |
| **Coverage %** | 34.8% |
| **Variant coverage %** | 0% |
| **Price accuracy %** | 0% |
| **Feature coverage %** | 0% |
| Review time estimate | 2–4 min |
| Manual corrections (est.) | 36 |
| **Publish readiness score** | 16 / 100 |
| Quality gates | FAIL (2) |
| Publish draft ready | No |
| Under 10 min publish | No |

Gate failures: Required field missing: model; Required field missing: familySlug

### Tata Nexon EV (`tata-nexon-ev`)

| Metric | Value |
|--------|-------|
| OEM URL | https://www.tatamotors.com/nexon/ev |
| PDF | Not acquired |
| Pipeline time | 80.6s |
| Sources acquired | 2 |
| Fields extracted / expected | 6 / 24 |
| **Coverage %** | 25% |
| **Variant coverage %** | 84.6% |
| **Price accuracy %** | 0% |
| **Feature coverage %** | 0% |
| Review time estimate | 2–4 min |
| Manual corrections (est.) | 44 |
| **Publish readiness score** | 35 / 100 |
| Quality gates | FAIL (2) |
| Publish draft ready | No |
| Under 10 min publish | No |

Gate failures: Required field missing: familySlug; Variant count 11 vs golden 13

### Mahindra BE 6 (`mahindra-be-6`)

| Metric | Value |
|--------|-------|
| OEM URL | https://www.mahindra.com/be6 |
| PDF | Not acquired |
| Pipeline time | 36.0s |
| Sources acquired | 1 |
| Fields extracted / expected | 6 / 20 |
| **Coverage %** | 30% |
| **Variant coverage %** | 33.3% |
| **Price accuracy %** | 25% |
| **Feature coverage %** | 0% |
| Review time estimate | 2–4 min |
| Manual corrections (est.) | 35 |
| **Publish readiness score** | 23 / 100 |
| Quality gates | FAIL (4) |
| Publish draft ready | No |
| Under 10 min publish | No |

Gate failures: Required field missing: brand; Required field missing: model; Required field missing: familySlug; Variant count 2 vs golden 3

### MG Windsor EV (`mg-windsor-ev`)

| Metric | Value |
|--------|-------|
| OEM URL | https://www.mgmotor.co.in/vehicles/windsor-ev |
| PDF | Not acquired |
| Pipeline time | 45.2s |
| Sources acquired | 1 |
| Fields extracted / expected | 7 / 20 |
| **Coverage %** | 35% |
| **Variant coverage %** | 100% |
| **Price accuracy %** | 0% |
| **Feature coverage %** | 0% |
| Review time estimate | 2–4 min |
| Manual corrections (est.) | 30 |
| **Publish readiness score** | 39 / 100 |
| Quality gates | FAIL (2) |
| Publish draft ready | No |
| Under 10 min publish | No |

Gate failures: Required field missing: familySlug; Variant count 5 vs golden 3

### BYD Atto 3 (`byd-atto-3`)

| Metric | Value |
|--------|-------|
| OEM URL | https://www.bydauto.co.in/atto-3 |
| PDF | Not acquired |
| Pipeline time | 92.4s |
| Sources acquired | 1 |
| Fields extracted / expected | 5 / 22 |
| **Coverage %** | 22.7% |
| **Variant coverage %** | 66.7% |
| **Price accuracy %** | 20% |
| **Feature coverage %** | 0% |
| Review time estimate | 2–4 min |
| Manual corrections (est.) | 34 |
| **Publish readiness score** | 34 / 100 |
| Quality gates | FAIL (3) |
| Publish draft ready | No |
| Under 10 min publish | No |

Gate failures: Required field missing: brand; Required field missing: model; Required field missing: familySlug

## Methodology

- Pipeline: `runEvidencePipelineV3` (acquire → extract → evidence merge → review init)
- Golden comparison: `runFullBenchmarkReport` vs `docs/catalog/golden-dataset/vehicles/`
- PDF: local `docs/catalog/validation-sources/{id}.pdf` or auto-discover from OEM HTML
- Review time: attention-field bands from `reviewTimeEstimate.js`
- Manual corrections: incorrect fields + variant gaps + attention + conflicts + hallucinations
- Publish readiness: weighted composite of field/variant/price/feature accuracy, evidence quality, gates
