# Operational intelligence execution block — final report

**Executed:** 2026-05-16  
**Scope:** Environment stabilization, PDF extraction E2E, provenance/review/diff validation, gap refinement, soft-launch re-check.  
**Git push:** not performed.

---

## 1. Python environment status

| Item | Status |
|------|--------|
| **pip SSL** | Remediated using **`--trusted-host`** for `pypi.org`, `files.pythonhosted.org`, `pypi.io` (no global SSL disable). |
| **pip / setuptools / wheel** | Upgraded on **Python 3.8** so resolver can use **binary wheels**. |
| **pdfplumber** | Installed (0.11.5 with dependency set). |
| **PyMuPDF** | Installed **1.24.11** (`cp38-abi3-win_amd64` wheel). |
| **Runtime check** | `extract_brochure.py` **exit 0** on fixture PDF; text captured. |
| **Follow-up** | Plan **Python ≥3.10** for acquisition machines (cryptography deprecates 3.8). |

---

## 2. Extraction success / failure

| Step | Result |
|------|--------|
| **Fixture PDF** | Created `data-acquisition/fixtures/punch-pipeline-fixture.pdf` (**not OEM** — labeled in file text and `fixtures/README.md`). |
| **Python extract** | **Success** — raw JSON under `staging/extracted/` with pdfplumber `pages[]`, empty `tables[]`. |
| **Node bridge** (`extract-oem-pdf.js`) | **Success** after defaulting Windows to **`py -3`** (`services/pdf-extraction/index.js`). |
| **Real Tata OEM PDF** | **Not in workspace** — registry updated to fixture path for **E2E only**; replace with licensed brochure for production intelligence. |

---

## 3. Real brochure ingestion status

| Milestone | Status |
|-----------|--------|
| Register source | **Done** — `tata-punch-ev-empowered-lr-oem-slot` now has `localAssetPath`, `extract_ok`, `pending_review`. |
| Extract | **Done** (fixture). |
| Normalize + provenance + queue + diff | **Validated** — curator `enqueue-file` aligned to Tier-1 → **`changeCount: 0`** on comparable diff set; queue artifacts **removed** after validation. |
| **Licensed OEM brochure** | **Pending operator asset** — no IP hosted in repo. |

---

## 4. Provenance validation

- Normalized enqueue path emits **`value` + `metadata`** (`sourceType`, `confidenceLevel`, `extractionMethod`, `reviewStatus`, `extractedAt`, `sourceId`).  
- **`npm run acq:audit`** → **`ok: true`**, 0 errors / 0 warnings after registry update.

---

## 5. Diff-detection quality

- **`detect-variant-diffs.js`** against **Punch Empowered LR** curated draft: **0 changes** on tracked comparable paths — output is **interpretable** (empty `changes` = parity on normalized subset).  
- Prior run with partial flat specs correctly surfaced **`published_only`** gaps (e.g. safety fields absent from flat map).

---

## 6. Extraction reliability findings

See **`EXTRACTION-RELIABILITY-NOTES.md`**: table drift, OCR, unit ambiguity, Py3.8 deprecation warnings, recommendation for curator-first workflow on ADAS/warranty/NCAP.

---

## 7. Tier-1 intelligence gaps

**Updated:** `TIER-1-COVERAGE-GAP-LIST.md` (refinement section 2026-05-16).  
Headline remains: **charging time consistency**, **NCAP**, **serviceCost** parity, **ADAS** depth, **charging FAQ**.

---

## 8. Soft-launch readiness

| Command | Result |
|---------|--------|
| `npm run ops:seo` | **`health: "ok"`**, canonical **0** errors, sitemap freshness **ok**. |
| `npm run ops:dashboard` | OK (aggregated snapshot). |
| `audit-soft-launch-readiness.js` | **`launchReady: true`**, **`totalErrors: 0`**. |

---

## 9. Operational bottlenecks discovered

1. **Legacy Python 3.8** — works today; migrate for long-term.  
2. **Corporate SSL** — may require `--trusted-host` or corporate cert bundle on other machines.  
3. **OEM PDF custody** — must live **outside git** or under explicit license; fixture only proves code path.  
4. **`py` vs `python3`** on Windows — mitigated in Node bridge.

---

## 10. Recommended next execution block

1. Obtain **licensed Tata Punch or Nexon PDF**; `register-source` + `extract-pdf` + human table map.  
2. Editorial merge to Tier-1 **after** `approve` + diff sign-off (still no auto-write).  
3. **GSC** URL inspection for priority SEO URLs (`seo-indexing-priorities.md`).  
4. **Python 3.10+ venv** doc + optional `requirements-lock.txt` for ops reproducibility.

---

## Code / asset changes (this block)

- `services/pdf-extraction/index.js` — Windows **`py -3`** launcher default; `PDF_EXTRACT_PYTHON` override still supported.  
- `data-acquisition/fixtures/punch-pipeline-fixture.pdf` + `fixtures/README.md` — pipeline test only.  
- `services/source-registry/sources.json` — **Tata Punch LR** slot: `localAssetPath` → `data-acquisition/fixtures/punch-pipeline-fixture.pdf` (replace with licensed brochure), `extract_ok`, `pending_review`.
