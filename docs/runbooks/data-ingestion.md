# Runbook: Data ingestion (Tier-1 acquisition)

Operational steps for OEM PDF/spec workflows. Companion: [`docs/data-acquisition/governance.md`](../data-acquisition/governance.md).

## Source registration

1. Confirm sourcing permission (broker/OEM/policy).
2. Add entry:
   ```bash
   cd zyvev-backend
   npm run acq:register-source -- '{"sourceId":"...","brand":"tata","model":"nexon-ev","tier1VariantSlug":"tata-nexon-ev-creative-plus","sourceType":"OEM_PDF","localAssetPath":"C:\\ops\\nexon.pdf","notes":"Purchased booklet — ref invoice #"}'
   ```
   Or `--stdin < source.json`.

3. `reviewStatus` auto `needs_manual_check` until asset path or URL populated.

## PDF ingestion

1. Install Python deps (`services/pdf-extraction/python/requirements.txt`).
2. Set `PDF_EXTRACT_PYTHON=py` on Windows if `python3` unavailable.
3. Run:
   ```bash
   npm run acq:extract-pdf -- --source-id tata-nexon-ev-creative-plus-oem-slot --pdf C:\\path\\brochure.pdf
   ```
4. Output: `data-acquisition/staging/extracted/<sourceId>.raw.extract.json`.

If exit ≠ 0:

- Inspect stderr for missing libs.
- OCR-only PDFs escalate to **`OCR_EXTRACTION`** path (planned extension) — do not brute force online mirrors.

## Human mapping → normalization

Extractor JSON is intentionally raw (`payload.pages/tables`). Human curator builds:

```json
{
  "tier1VariantSlug": "tata-nexon-ev-empowered-lr",
  "sourceId": "tata-nexon-ev-empowered-lr-oem-slot",
  "sourceType": "OEM_PDF",
  "extractionMethod": "MANUAL_ENTRY",
  "flatSpecs": {
    "batteryKwh": 40.5,
    "claimedRangeKm": 465,
    "priceExShowroom": 1649000,
    "dcChargingKw": 50,
    "dcCharge10to80Min": 56
  }
}
```

Enqueue:

```bash
npm run acq:review enqueue-file ./curated/tata-nexon.json
```

Unsupported keys must be stripped before enqueue (normalized JSON rejects extras).

## Review process

```bash
npm run acq:review list
npm run acq:review approve <jobId> --notes Verified against PDF pages 3-6
npm run acq:review reject <jobId> --notes DC kW ambiguity on trim B
```

Rejections move artifact to `staging/rejected/` and record reviewer notes.

## Diff validation vs Tier-1

```bash
npm run acq:diff -- tata-nexon-ev-empowered-lr --draft ./staging/approved/job_xxxxx.json
```

Inspect `changes[]` payload for unintended deltas.

## Staged publish archive

Purely archival + traceability (`approved` clones + manifest):

```bash
npm run acq:publish-staging
```

Rollback: delete `staging/published/manifest-*` clones; Tier-1 catalog untouched unless editors revert manual merge separately.

## Governance audit

```bash
npm run acq:audit
```

Treat `missing_provenance`, `orphan_source_reference`, and `duplicate_approved_variant` as blockers ahead of merges.

## Failed extraction handling

1. Preserve PDF + extractor log excerpt in ticket.
2. Set registry `extract_failed` (script already did) or manual `needs_manual_check`.
3. Optional second opinion source (authorised brochure revision).

## Cross-links

- `docs/architecture/catalog/tier-1/sourcing-checklist.md`
- `docs/architecture/ev-master-data-architecture.md`
