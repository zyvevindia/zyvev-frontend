# Extraction reliability notes

**Context:** Operational run on Windows, Python **3.8**, `pdfplumber` + **PyMuPDF 1.24.11** (wheels), fixture PDF + Node bridge.

## Environment

| Topic | Finding |
|-------|---------|
| pip SSL | Initial failure (`SSL: CERTIFICATE_VERIFY_FAILED`) remediated with **`pip install ... --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.io`** — does **not** disable TLS verification globally. |
| pip age | Upgrading **pip / setuptools / wheel** on Py3.8 was required before PyMuPDF could install from **wheel** (earlier sdist path hit `BackendUnavailable`). |
| Python support | **Cryptography** warns Py3.8 is deprecated — plan migration to **Python 3.10+** for acquisition workstations. |
| Node → Python | Windows default **`python3`** missing; bridge updated to use **`py -3`** when `PDF_EXTRACT_PYTHON` unset. |

## Extraction behaviour (fixture PDF)

| Check | Result |
|-------|--------|
| Engine | **pdfplumber** selected (`TEXT_EXTRACTION`); tables empty as expected for plain text page. |
| Raw artifact | `_governance.reviewRequired: true`, `doNotPublish: true`, `confidenceLevel: LOW` (appropriate for non-OEM fixture). |
| Logs | stderr shows **CryptographyDeprecationWarning** only — extraction **exit 0**. |

## Reliability by concern

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Table layout drift** | High on real brochures | Curator **`MANUAL_ENTRY`** from table screenshots; optional future camelot/tabula behind flag. |
| **OCR noise** | Medium on scanned PDFs | Force `OCR_EXTRACTION` + **LOW** confidence + human review; no auto-normalize from OCR alone. |
| **Unit ambiguity** (kW vs kWh, WLTP vs ARAI) | High | `KNOWN_FLAT_MAP` + plausibility checks; reject out-of-range; never infer standard. |
| **Missing fields** | Expected | Raw JSON omits unextracted keys — **do not** fabricate in normalize step. |
| **Unsupported flat keys** | Safe | `normalizeFromFlat` records `_normalizationWarnings` / rejects unknown keys. |
| **Provenance gaps** | Blocker if misconfigured | `validateNormalizedSchema` + `acq:audit` catch missing metadata on `_normalized` artifacts. |

## Fields likely to need **manual review** most often

1. **ADAS** feature lists (brochure marketing vs structured enum).  
2. **DC/AC charge times** (multi-row tables, footnotes).  
3. **Warranty** km caps and exceptions.  
4. **NCAP** (only when official bulletin exists).  
5. **Price** (ex-showroom vs effective; city variants not in flat map).

## Recommended extraction improvements (future, bounded)

- Optional **second-pass** table crop hints per OEM template (still human-approved).  
- **Python 3.11** venv pinned in `docs` for reproducible installs.  
- Capture **page numbers** in curator `pageHint` when mapping from raw `payload.pages`.
