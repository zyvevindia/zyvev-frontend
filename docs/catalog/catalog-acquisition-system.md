# Catalog Acquisition System

EVSavari admin workflow for onboarding new EVs from OEM sources with AI-assisted extraction and mandatory human approval.

**v1** — single-source import wizard (preserved).  
**v2** — multi-source evidence engine with connector architecture, evidence merger, conflict detection, and evidence drawer UI.  
**v3** — automated URL/PDF acquisition, PDF parsing, LLM extraction (OpenAI/Anthropic), expanded schema, variant intelligence, review efficiency filter.  
**v4** — golden dataset benchmarking, confidence calibration, hallucination detection, evidence coverage reports, review metrics, production quality gates. See [catalog-acquisition-benchmarking.md](./catalog-acquisition-benchmarking.md).  
**LLM benchmark** — OpenAI vs Anthropic vs heuristic on golden dataset. See [llm-benchmark-evaluation.md](./llm-benchmark-evaluation.md).

## Principles

1. **OEM data is the source of truth** — raw source is stored as immutable snapshots.
2. **AI can extract and normalize** — v1 uses heuristic extraction; LLM hook is pluggable.
3. **AI never publishes directly** — publish requires `approved` status.
4. **Human approval is mandatory** — review screen with confidence badges.
5. **All fields editable before publish** — side-by-side extracted vs editable columns.
6. **Change-detection ready** — `catalog_import_snapshots` + `evidence_records` for future agents.

## Admin route

```
/admin/catalog/import
```

Wizard steps (v3 — default):

1. **URLs + PDF** — OEM URL + PDF upload + optional reference URLs (no paste)
2. **Auto-acquire** — server fetches URLs, parses PDF, runs AI/heuristic extraction
3. **AI extract & merge** — evidence records → merger → conflict detection
4. **Review** — “Needs attention only” filter (conflicts, low confidence, required missing)
5. **Publish** — Supabase `vehicles` + `vehicle_variants`

Legacy v1/v2 manual paste remains under “Legacy manual paste” in step 1.

### v3 architecture

```
OEM URL + PDF (+ reference URLs)
        ↓
  acquisition/ (server-side fetch + pdf-parse)
        ↓
  ai/ (OpenAI | Anthropic | heuristic fallback)
        ↓
  evidence_records (AI outputs, not direct publish data)
        ↓
  Evidence Merger + Confidence Calibration (v2 engine)
        ↓
  Review UI (needs-attention filter + evidence drawer)
        ↓
  Publish
```

### v3 modules

| Module | Path |
|--------|------|
| Automated acquisition | `src/catalogAcquisition/acquisition/` |
| PDF parsing | `acquisition/parsePdf.js` (pdf-parse, tables, variant matrix) |
| LLM extraction | `src/catalogAcquisition/ai/` |
| v3 pipeline (server-only) | `evidencePipelineV3.js` |
| Serverless API | `api/catalog-v3-acquire.js` |
| Dev API middleware | `scripts/lib/catalogV3AcquireDevPlugin.js` |

### Expanded extraction schema (v2 / `evsavari-extraction/2`)

Fields: vehicle, pricing (ex-showroom), battery (chemistry), range (test standard), charging (times), performance, safety (ADAS level), **features** (sunroof, ventilated seats, 360°, connected car, V2L, V2V), **warranty**, **media metadata** (colors, hero image candidates), dimensions, **variants** (price/battery/range/charging/feature highlights per trim).

### AI provider configuration

Env vars (server-side only):

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
CATALOG_AI_PROVIDER=openai|anthropic   # optional
CATALOG_OPENAI_MODEL=gpt-4o-mini     # optional
CATALOG_ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

Without API keys, v3 falls back to enhanced heuristic extraction (`ai/providers/heuristic.js`).

Wizard steps (v2 legacy):

Legacy CSV/JSON ingestion remains at `/admin/catalog-ingestion`.

## Database

Apply migrations in order:

```
src/backend/schema/migrations/003_catalog_imports.sql
src/backend/schema/migrations/004_evidence_records.sql
```

Tables:

- `catalog_imports` — draft import records (+ `source_inputs`, `evidence_summary` in v2)
- `catalog_import_snapshots` — immutable snapshots for future change-detection agents
- `evidence_records` — per-field evidence from each source (v2)

### evidence_records schema

| Column | Description |
|--------|-------------|
| `import_id` | FK → catalog_imports |
| `field_name` | e.g. `batteryCapacityKwh` |
| `field_value` | Extracted value as text |
| `source_type` | `OEM_PDF`, `OEM_WEBSITE`, `TRUSTED_REFERENCE`, `SEARCH_RESULT` |
| `source_name` | Human label (e.g. "Tata Curvv Brochure") |
| `source_url` | Source URL when applicable |
| `trust_score` | 100 / 95 / 80 / 60 by source type |
| `extraction_confidence` | Connector extraction quality 0–100 |

## Source types & trust scores

| Source | Trust | Connector |
|--------|-------|-----------|
| OEM PDF | 100 | `PdfConnector` |
| OEM Website | 95 | `OemWebsiteConnector` |
| Trusted references (CarDekho, ZigWheels, CarWale) | 80 | `ReferenceSiteConnector` |
| Search results | 60 | `SearchConnector` |

Search results never override OEM data during merge. Trusted references use config allowlist in `trustedReferenceSources.js`.

## Evidence pipeline

```
PDF + OEM Website + References + Search
        ↓
  Connector layer (pluggable)
        ↓
  evidence_records
        ↓
  Evidence Merger
        ↓
  Conflict Detection
        ↓
  Multi-Source Confidence Engine
        ↓
  Review UI (Evidence Drawer)
        ↓
  Publish
```

### Confidence factors

1. Source trust score
2. Number of agreeing sources
3. Agreement ratio between sources
4. Extraction confidence from connector

Examples:

- Battery: 3 sources agree → confidence ≥ 99
- Price: single trusted source → confidence ≤ 85
- Conflicting DC charging → status `conflict`, manual review, confidence ~70

## Extraction schema

Normalized draft groups:

- Vehicle (brand, model, bodyType, familySlug)
- Pricing, Battery, Range, Charging, Performance, Dimensions, Safety
- Variants array

Each scalar field: `{ value, confidence }` plus optional `evidence` map on draft.

Confidence bands:

| Score | Band | UI |
|-------|------|-----|
| 95–100 | Green | Auto-trusted display |
| 80–94 | Yellow | Review suggested |
| &lt;80 | Red | Highlighted, review required |

## Scripts

```bash
npm run catalog-import:smoke           # v1 + v2 + v3 + v4 unit smoke
npm run catalog-import:v3-acquire -- --oem-url=https://... [--pdf=brochure.pdf]
npm run catalog-import:v3-demo         # Live demo: Nexon EV, Curvv EV, BE 6
npm run catalog-import:build-golden    # Regenerate golden benchmark dossiers
npm run catalog-import:benchmark       # Run accuracy benchmark vs golden dataset
node scripts/catalog-import-process.mjs --url=https://example.com/ev-specs  # v1 CLI
```

### v3 validation (measured)

Demo run (`catalog-import:v3-demo`) with **OEM URLs only** (no manual content preparation, heuristic fallback without LLM keys):

| Vehicle | Acquire time | Evidence records | Variants | Est. review |
|---------|-------------|------------------|----------|-------------|
| Tata Nexon EV | ~3.6s | 30 | 8 | 4–8 min |
| Tata Curvv EV | ~1.9s | 31 | 7 | 4–8 min |
| Mahindra BE 6 | ~1.2s | 22 | 8 | 2–4 min |

With `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` configured, model/brand accuracy improves significantly; target total workflow (acquire + review + approve) under 5 minutes when attention fields ≤ 3.

PDF parsing: set `CATALOG_TEST_PDF=/path/to/brochure.pdf` for smoke PDF fixture test.

## Storage fallback

When Supabase is not configured in the browser, imports persist to `localStorage` (`evsavari-catalog-imports-v1`) and evidence to `evsavari-catalog-evidence-v2`. Production should use Supabase.

## Publish pipeline

On publish (after approval):

1. `buildPublishPayload()` maps reviewed draft → vehicle + variants
2. `upsertVehicle()` + `upsertVehicleVariant()` (Supabase)
3. Status → `published`; snapshot type `published` recorded

## Future agents (not implemented)

Evidence records are designed for reuse by:

- Change Detection Agent
- Monitoring Agent
- OEM Update Agent

Compare snapshot hashes or re-run connectors against stored `source_inputs`.

## Files

| Area | Path |
|------|------|
| Core logic | `src/catalogAcquisition/` |
| Connectors | `src/catalogAcquisition/connectors/` |
| Evidence merger / conflict | `evidenceMerger.js`, `conflictDetection.js`, `multiSourceConfidence.js` |
| Pipeline | `evidencePipeline.js` |
| Supabase services | `catalogImportService.js`, `evidenceRecordService.js` |
| Browser API | `src/services/catalogImportApi.js` |
| Admin wizard | `src/pages/admin/CatalogImportWizardPage.jsx` |
| Review UI | `src/components/catalogImport/` (incl. `EvidenceDrawer.jsx`) |

