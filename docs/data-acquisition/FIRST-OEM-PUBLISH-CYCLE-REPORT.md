# First OEM intelligence publish cycle — execution report

**Date:** 2026-05-16  
**Variant:** Tata Punch EV Empowered LR (`tata-punch-ev-empowered-lr`)  
**Source ID:** `tata-punch-ev-empowered-lr-oem-licensed`  
**Git push:** not performed · **Tier-1 catalog:** not modified

---

## Executive summary

The **full governed publish cycle** (extract → curate → review → diff → staged publish) completed successfully.  

**Licensed OEM brochure criterion:** **not fully met** — no third-party licensed Tata PDF was available in the workspace. A **watermarked operational placeholder** at `incoming/tata-punch-ev-empowered-lr-brochure.pdf` was used so the rail could be validated end-to-end. **Replace that file** with your licensed brochure and re-run extract before any production intelligence claim.

---

## Phase results

| Phase | Status |
|-------|--------|
| 1 Source registration | **Done** — licensed slot + regression slot separated |
| 2 PDF extraction | **Done** — raw artifact `tata-punch-ev-empowered-lr-oem-licensed.raw.extract.json` |
| 3 Curator mapping | **Done** — `data-acquisition/curated/tata-punch-ev-empowered-lr-cycle1-curator.json` |
| 4 Review queue | **Done** — job `job_1778909591621_ph31x3` **approved** |
| 5 Diff validation | **Done** — 3 `draft_only` intelligence gaps |
| 6 Staged publish | **Done** — `staging/published/manifest-1778909600943.json` |
| 7 Extraction reliability | **Done** — see `REAL-OEM-EXTRACTION-RELIABILITY-NOTES.md` |
| 8 Tier-1 gap refinement | **Done** — gap list updated |
| 9 Soft-launch | **PASS** — `launchReady: true` |

---

## Artifacts (local, gitignored where noted)

| Artifact | Path |
|----------|------|
| Raw extract | `data-acquisition/staging/extracted/tata-punch-ev-empowered-lr-oem-licensed.raw.extract.json` |
| Curator input | `data-acquisition/curated/tata-punch-ev-empowered-lr-cycle1-curator.json` |
| Approved normalized | `data-acquisition/staging/approved/job_1778909591621_ph31x3.json` |
| Publish manifest | `data-acquisition/staging/published/manifest-1778909600943.json` |
| Regression fixture | `data-acquisition/fixtures/punch-pipeline-fixture.pdf` (unchanged) |

---

## Commands executed

```bash
npm run acq:audit
npm run acq:extract-pdf -- --source-id tata-punch-ev-empowered-lr-oem-licensed
node scripts/review-extracted-specs.js enqueue-file data-acquisition/curated/tata-punch-ev-empowered-lr-cycle1-curator.json
node scripts/review-extracted-specs.js approve job_1778909591621_ph31x3 --notes "..."
node scripts/detect-variant-diffs.js tata-punch-ev-empowered-lr --draft data-acquisition/staging/approved/job_1778909591621_ph31x3.json
npm run acq:publish-staging
```

---

## Success criteria scorecard

| Criterion | Met? |
|-----------|------|
| First **licensed** OEM brochure extracted | **Partial** — placeholder PDF only |
| Curator-assisted mapping | **Yes** |
| Provenance validated | **Yes** |
| Review workflow | **Yes** |
| Diff detection | **Yes** |
| Staged publish (no Tier-1 overwrite) | **Yes** |
| Extraction reliability documented | **Yes** |
| Tier-1 gaps refined | **Yes** |
| Soft-launch reconfirmed | **Yes** |

---

## Next action (operator)

1. Replace `data-acquisition/incoming/tata-punch-ev-empowered-lr-brochure.pdf` with **licensed** Tata brochure.  
2. `npm run acq:extract-pdf -- --source-id tata-punch-ev-empowered-lr-oem-licensed`  
3. Re-curate from new raw extract → new review job → diff → editorial Tier-1 merge (manual).

Optional: `node scripts/resolve-licensed-oem-pdf.js` to verify path resolution.
