# EVSavari Tier-1 Data Acquisition

Governed, provenance-aware intake for Tier-1 EV intelligence. **Human review gates every publish.**

Implementation lives under `zyvev-backend`:

- `services/source-registry/` — JSON registry (`sources.json`)
- `services/pdf-extraction/` — brochure PDF helpers (Python)
- `services/spec-normalization/` — flat extractor keys → Tier-1-shaped structs + provenance
- `services/review-queue/` — file-based approvals
- `services/acquisition-diffs/` — deltas vs published catalog
- `services/data-acquisition/` — staging roots, audits, staged publish manifests
- `data-acquisition/staging/` — local artifacts (`*.json` ignored from git via backend `.gitignore`)

**Catalog truth:** `zyvev-backend/docs/architecture/catalog/tier-1/variants/*.json` is **never auto-updated**.

## NPM / CLI (run from backend)

| Command | Role |
|---------|------|
| `npm run acq:register-source` | Add/update registry entry |
| `npm run acq:extract-pdf -- --source-id … [--pdf …]` | PDF extraction bridge |
| `npm run acq:review …` | `list \| approve \| reject \| enqueue-file` |
| `npm run acq:diff -- <slug> --draft ./file.json` | Field-level deltas |
| `npm run acq:audit` | Acquisition governance audit |
| `npm run acq:publish-staging` | Snapshot approved payloads + manifest |

Python:

```bash
pip install -r services/pdf-extraction/python/requirements.txt
```

Windows: export `PDF_EXTRACT_PYTHON=py` if `python3` is unavailable.

## Lifecycle

```
registered → extracted → normalized → pending_review → approved → published (staging archive)
                                                                   ↘ editorial merge → Tier-1 JSON (manual)
```

## Docs

- [governance.md](./governance.md) — sourcing + provenance policy
- [INTELLIGENCE-OPERATIONS-BLOCK-REPORT.md](./INTELLIGENCE-OPERATIONS-BLOCK-REPORT.md) — prior operational validation block
- [CATALOG-EXPANSION-SPRINT-REPORT.md](./CATALOG-EXPANSION-SPRINT-REPORT.md) — Tier-1 expansion 17→29 + ownership intelligence
- [FIRST-OEM-PUBLISH-CYCLE-REPORT.md](./FIRST-OEM-PUBLISH-CYCLE-REPORT.md) — first governed publish cycle (Punch LR)
- [REAL-OEM-EXTRACTION-RELIABILITY-NOTES.md](./REAL-OEM-EXTRACTION-RELIABILITY-NOTES.md) — cycle 1 extraction learnings
- [INTELLIGENCE-EXECUTION-BLOCK-REPORT.md](./INTELLIGENCE-EXECUTION-BLOCK-REPORT.md) — env + pipeline E2E
- [EXTRACTION-RELIABILITY-NOTES.md](./EXTRACTION-RELIABILITY-NOTES.md) — extraction quality / environment findings
- [TIER-1-COVERAGE-GAP-LIST.md](./TIER-1-COVERAGE-GAP-LIST.md) — catalog intelligence gaps
- [seo-indexing-priorities.md](./seo-indexing-priorities.md) — GSC indexing priority URLs
- [Runbook: data ingestion](../runbooks/data-ingestion.md) — ops procedures
