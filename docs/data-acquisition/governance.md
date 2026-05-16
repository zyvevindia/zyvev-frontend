# Data Acquisition Governance

## Local Python environment (acquisition workstations)

- Prefer **Python 3.10+**; 3.8 may work with wheels but triggers dependency deprecation warnings.  
- If `pip install` fails with **SSL certificate verify failed**, use host-scoped trust (does **not** disable TLS globally):

```bash
py -3 -m pip install --upgrade pip setuptools wheel \
  --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.io
py -3 -m pip install -r services/pdf-extraction/python/requirements.txt \
  --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.io
```

- On Windows, leave **`PDF_EXTRACT_PYTHON` unset** to use the Node bridge default **`py -3`**, or set it to your `python.exe` path.

## Principles

1. **Compliance first:** Only ingest where OEM/policy allows; persist `sourceUrl` or audited `localAssetPath`.
2. **No silent publish:** Acquisition scripts **never write** Tier-1 `variants/*.json`.
3. **No guesses:** Absent authoritative values remain omitted; humans add fields explicitly with `MANUAL_ENTRY`.
4. **Provenance:** Every normalized leaf exposes `confidenceLevel`, `extractionMethod`, `reviewStatus`, `extractedAt`, `sourceType`, optional `sourceId`.
5. **Human gates:** Automated harvest → curator mapping → reviewer approval.

## Approved `sourceType`

- `OEM_WEBSITE` — sanctioned static collateral only
- `OEM_BROCHURE`
- `OEM_PDF`
- `GOVERNMENT_DATASET` — datasets with usable license/terms
- `PUBLIC_CHARGING_DATA` — compliant public charging references

Anything else stays off-registry until policy extends.

## Prohibited

| Pattern | Reason |
|---------|--------|
| Aggressive scraping / crawler farms | OEM ToS & legal exposure |
| Generative hallucination chains | destroys trust KPIs |
| Auto-merge to production Tier-1 | violates QA doctrine |
| Storing shopper PII in acquisition artifacts | privacy scope violation |

## Extraction confidence

| Level | Use when |
|-------|----------|
| HIGH | verbatim table row / datasheet figure |
| MEDIUM | deterministic text parse corroborated |
| LOW | OCR noise / heuristic alignment |
| UNKNOWN | tooling failure partial capture |

## `extractionMethod`

- `TABLE_EXTRACTION`
- `TEXT_EXTRACTION`
- `OCR_EXTRACTION` (controlled fallback only)
- `MANUAL_ENTRY` (explicit curator keystroke)

Every method still requires reviewer approval unless policy states otherwise.

## Review workflow statuses

| Status | Meaning |
|--------|---------|
| `pending_review` | awaiting analyst |
| `approved` | may enter staging archive / editorial merge backlog |
| `rejected` | blocked with rationale |
| `needs_manual_check` | registry lacks URL/asset or conflicting evidence |

## Publication safety checklist

Run before catalog editors merge deltas:

```bash
cd zyvev-backend
npm run acq:audit
npm run acq:diff <slug> --draft ./staging/approved/<file>.json
```

Block release if audit reports `missing_provenance`, `orphan_source_reference`, conflicts, invalid units.

## Conflict policy

Normalizer writes `_normalizationWarnings` when duplicate paths or plausible-range checks trigger. Blocking issues must resolve before enqueue; non-blocking flagged in reviewer notes.
