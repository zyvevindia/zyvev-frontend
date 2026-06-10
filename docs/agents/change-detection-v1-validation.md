# Change Detection Agent v1 — Validation Report

**Generated:** 2026-06-10  
**Agent:** Change Detection Agent v1 (Phase 2)  
**Pipeline:** Catalog Acquisition v7.1 for live checks (frozen — unchanged)

---

## Objective

Detect catalog changes from OEM/brochure sources, generate diff dossiers, and require human approval before catalog updates. No autonomous publishing.

---

## Methodology

Ten simulated scenarios using golden dossiers as **published snapshots**, with controlled mutations as **latest acquisition snapshots**:

| # | Scenario | Vehicle |
|---|----------|---------|
| 1 | Price change | Tata Nexon EV |
| 2 | New variant | Tata Punch EV |
| 3 | Charging spec change | Hyundai Creta Electric |
| 4 | Feature addition | Mahindra BE 6 |
| 5 | Brochure replacement | MG Windsor EV |
| 6 | Range change | Tata Curvv EV |
| 7 | Battery capacity change | Mahindra XEV 9e |
| 8 | Variant removed | BYD Atto 3 |
| 9 | No change (negative) | Tata Nexon EV |
| 10 | Identical recheck (negative) | MG Windsor EV |

Field-level comparison uses strict equality (not benchmark tolerance). Variant matching uses name similarity.

---

## Results

### Confusion matrix

| | Detected change | No change |
|---|:---:|:---:|
| **Expected change** | 8 (TP) | 0 (FN) |
| **Expected no change** | 0 (FP) | 2 (TN) |

### Aggregate metrics

| Metric | Result | Target | Met |
|--------|--------|--------|-----|
| Detection accuracy | **100%** | >95% | ✓ |
| False positive rate | **0%** | <10% | ✓ |
| Average review effort | **2.3 min** | <5 min | ✓ |
| Human approval mandatory | Yes | Yes | ✓ |
| Autonomous updates | None | None | ✓ |

### Per-scenario summary

| Vehicle | Scenario | Changes | Priority | Recommendation | Review (min) |
|---------|----------|--------:|----------|----------------|-------------:|
| Tata Nexon EV | Price change | 1 | MEDIUM | REVIEW_REQUIRED | 1.9 |
| Tata Punch EV | New variant | 1 | CRITICAL | REVIEW_REQUIRED | 3.9 |
| Hyundai Creta Electric | Charging | 1 | MEDIUM | REVIEW_REQUIRED | 1.9 |
| Mahindra BE 6 | Feature | 1 | LOW | REVIEW_REQUIRED | 1.9 |
| MG Windsor EV | Brochure | 1 | LOW | REVIEW_REQUIRED | 1.9 |
| Tata Curvv EV | Range | 1 | MEDIUM | REVIEW_REQUIRED | 1.9 |
| Mahindra XEV 9e | Battery | 1 | CRITICAL | REVIEW_REQUIRED | 3.9 |
| BYD Atto 3 | Variant removed | 1 | CRITICAL | REVIEW_REQUIRED | 3.9 |
| Tata Nexon EV | No change | 0 | — | NO_CHANGE | 1.0 |
| MG Windsor EV | Identical | 0 | — | NO_CHANGE | 1.0 |

---

## Success criteria

All v1 targets met:

- Detection accuracy **100%** (>95%)
- False positives **0%** (<10%)
- Average review effort **2.3 min** (<5 min)
- Human approval remains mandatory
- No autonomous catalog updates

---

## Recommendation

### **READY FOR SCORE ENGINE**

Change Detection Agent v1 correctly identifies price, variant, charging, feature, brochure, range, and battery changes while producing zero false positives on identical snapshots.

---

## Files implemented

| Path | Purpose |
|------|---------|
| `src/agents/changeDetection/changeDetectionStatus.js` | Status lifecycle |
| `src/agents/changeDetection/changeClassification.js` | LOW / MEDIUM / HIGH severity |
| `src/agents/changeDetection/changePriority.js` | CRITICAL / HIGH / MEDIUM / LOW priority |
| `src/agents/changeDetection/changeDiffEngine.js` | Snapshot comparison engine |
| `src/agents/changeDetection/changeDetectionWorkflow.js` | Diff dossier + recommendation |
| `src/agents/changeDetection/changeDetectionAgent.js` | Orchestration |
| `src/services/changeDetectionStore.js` | Job persistence |
| `src/services/changeDetectionApi.js` | Client API |
| `src/pages/admin/ChangeDetectionPage.jsx` | Admin UI `/admin/change-detection` |
| `src/components/changeDetection/ChangeDetectionReviewDossier.jsx` | Diff dossier UI |

**Not modified:** Catalog Acquisition v7.1, extraction prompts, registry, evidence engine, Vehicle Creation Agent workflow.

---

## Artifacts

- [`change-detection-v1-validation.json`](./change-detection-v1-validation.json)
