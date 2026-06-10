# Vehicle Creation Agent v1 — Validation Report

**Generated:** 2026-06-09  
**Engine:** Vehicle Creation Agent v1 on Catalog Acquisition v7.1 (frozen)  
**Scope:** Measurement only — no code, acquisition, extraction, or prompt changes.

---

## Objective

Measure VCA v1 effectiveness on 10 real Indian EVs using the full workflow:

```
OEM URL + Brochure URL/PDF
  → Vehicle Creation Agent v1
  → Review dossier (attention-only default)
  → Human review simulation (approve / reject)
  → Publish (benchmark quality gates)
```

---

## Methodology

| Metric | Source |
|--------|--------|
| Review time | `buildReviewDossier().estimatedReviewMinutes` |
| Manual corrections | Golden benchmark delta: wrong fields + features + prices + variant gaps + attention + conflicts + critical hallucinations |
| Conflicts | `pipeline.diagnostics.conflictCount` |
| Recommendation | VCA dossier: `READY` / `REVIEW_REQUIRED` / `BLOCKED` |
| Publish success | Benchmark `qualityGates.passed` |
| Recommendation accuracy | Actual vs expected: **READY** = gates pass + corrections ≤ 10 + zero attention; **REVIEW_REQUIRED** = gates pass with residual work; **BLOCKED** = gates fail |
| Human review simulation | Approve when VCA ≠ BLOCKED and benchmark gates pass; reject otherwise |
| Total effort estimate | Review minutes + 0.5 min per correction |

Sources: verified entries in `public/catalog/source-registry.json`; local PDFs from `docs/catalog/validation-sources/` where available.

---

## Per-vehicle results

| Vehicle | Minutes | Corrections | Conflicts | Recommendation | Publish Success |
|---------|--------:|------------:|----------:|----------------|-----------------|
| Tata Nexon EV | 5.3 | 40 | 0 | REVIEW_REQUIRED | Yes |
| Tata Punch EV | 2.5 | 27 | 0 | READY | No |
| Tata Curvv EV | 2.0 | 17 | 0 | READY | No |
| Mahindra BE 6 | 2.0 | 19 | 0 | READY | Yes |
| Mahindra XEV 9e | 2.0 | 18 | 0 | READY | Yes |
| MG Windsor EV | 2.4 | 19 | 0 | REVIEW_REQUIRED | Yes |
| MG ZS EV | 2.5 | — | 0 | READY | No |
| Hyundai Creta Electric | 2.8 | 19 | 0 | REVIEW_REQUIRED | Yes |
| BYD Atto 3 | 2.0 | 18 | 0 | READY | Yes |
| Citroen eC3 | 2.0 | — | 0 | READY | No |

*Corrections unavailable for MG ZS EV and Citroen eC3 (no golden dossier).*

### Recommendation accuracy (8 golden-benchmarked vehicles)

| Accurate | Inaccurate |
|----------|------------|
| Nexon EV, Windsor EV, Creta Electric | Punch EV (false READY), Curvv EV (false READY), BE 6 (false READY), XEV 9e (false READY), Atto 3 (false READY) |

**Recommendation accuracy: 37.5%** (3 / 8)

---

## Aggregate metrics

| Metric | Result | Target | Met |
|--------|-------:|-------:|-----|
| Average review time | **2.6 min** | < 10 min | ✓ |
| Average manual corrections | **22.1** | < 10 | ✗ |
| Average conflict count | **0** | — | ✓ |
| Publish success rate | **60%** (6 / 10) | > 80% | ✗ |
| Recommendation accuracy | **37.5%** | — | ✗ |
| Avg total effort (review + corrections) | **13.7 min** | < 10 min | ✗ |

### Human review simulation

| Outcome | Count | Vehicles |
|---------|------:|----------|
| Approve → publish | 6 | Nexon, BE 6, XEV 9e, Windsor, Creta, Atto 3 |
| Reject (gates fail) | 4 | Punch, Curvv, ZS EV, Citroen eC3 |

---

## Primary question

> Is Vehicle Creation Agent v1 achieving human onboarding under 10 minutes, fewer than 10 manual corrections, and publish success above 80%?

### Answer: **PARTIALLY**

| Criterion | Result | Verdict |
|-----------|--------|---------|
| Human onboarding time < 10 min | 2.6 min avg dossier review; **13.7 min** avg total effort | **Partial** — UI scan is fast; end-to-end is not |
| Fewer than 10 manual corrections | **22.1 avg** (range 17–40) | **No** |
| Publish success > 80% | **60%** (6 / 10) | **No** |

**Evidence:**

- All 10 vehicles complete the VCA workflow; dossier review stays under 6 minutes per vehicle.
- Zero conflicts fleet-wide — v7.1 conflict resolution is stable.
- Manual correction load remains ~2× the target; Nexon alone requires 40 corrections despite passing publish gates.
- 4 / 10 vehicles fail benchmark publish gates (Punch, Curvv, ZS EV, Citroen eC3).
- 5 / 8 benchmarked vehicles receive a false **READY** recommendation; the dossier attention-only filter surfaces 0–2 items while golden delta shows 17–40 corrections.

---

## Recommendation

### **B. Needs workflow improvements**

Criteria for **A** (avg review < 10 min, avg corrections < 10, publish > 80%) are **not met**.

### Top five causes preventing the target

1. **Attention-only dossier blind spot** — Default dossier hides benchmark mismatches. Five vehicles show **READY** with 0 attention items but 17–40 golden corrections. Operators cannot see true publish effort in the default view.

2. **Dossier vs benchmark gate divergence** — `checkPublishQualityGates` runs without golden dossier. Four vehicles show dossier gates **pass** while benchmark gates **fail** (Punch, Curvv, ZS EV, Citroen eC3), producing false READY signals.

3. **Residual field/pricing/feature gaps from acquisition** — Average 22.1 corrections driven by pricing (starting/top variant), charging specs (AC/DC kW, times), features, and NCAP — not surfaced as attention items in the VCA dossier.

4. **Variant matrix gaps on non-priority vehicles** — Punch (5 variants, gates fail) and Curvv (2 vs golden 3) still block publish despite v7.1 trim recovery on priority families (Nexon, Windsor, Creta).

5. **Missing golden coverage** — MG ZS EV and Citroen eC3 have no golden dossier, so corrections and recommendation accuracy cannot be validated; both fail publish gates while showing READY.

---

## Conclusion

Vehicle Creation Agent v1 delivers a **fast review UI** (2.6 min average) and **zero conflicts**, but does **not** yet achieve sub-10-minute **full onboarding** or sub-10 **manual corrections**. Publish success at 60% is below the 80% bar.

**Do not proceed to Change Detection Agent** until workflow improvements address false READY signals and surface benchmark deltas in the review dossier.

---

## Artifacts

- Machine-readable results: [`vehicle-creation-validation.json`](./vehicle-creation-validation.json)
- Registry: `public/catalog/source-registry.json`
- VCA modules: `src/agents/vehicleCreation/`
