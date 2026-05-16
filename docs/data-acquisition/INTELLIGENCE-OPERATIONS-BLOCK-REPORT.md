# Intelligence operations block — execution report

**Date:** 2026-05-16  
**Scope:** First operational EV intelligence ingestion cycle (validation + governance + readiness).  
**Git push:** not performed.

---

## Block 1 — Acquisition pipeline validation

| Check | Result |
|-------|--------|
| `npm run acq:audit` | **PASS** — `ok: true`, errors 0, warnings 0; info findings only (`source_needs_asset`, `review_needs_manual_check` for placeholder registry rows). |
| Staging directories | Present under `zyvev-backend/data-acquisition/staging/*` (per audit `paths`). |
| Review queue | **Operational** — `enqueue-file` + `list` exercised successfully. |
| Provenance on normalized payload | **Present** — `wrapProvenancedValue` + `_normalized` on enqueue path. |
| Diff detection | **Operational** — `detect-variant-diffs.js` run on Tata Punch curated draft vs published Tier-1; output intelligible (`published_only` for safety fields not in flat curator subset). |
| Python + pdfplumber + PyMuPDF | **NOT VERIFIED on this machine** — `py -3` exists; `pdfplumber` **not installed**; `pip install` **failed** with `SSL: CERTIFICATE_VERIFY_FAILED`. **Operational bottleneck:** fix corporate SSL / use trusted index, or offline wheel install. |
| Real PDF in repo | **None** — no `*.pdf` under backend; OEM brochure must be supplied **locally** per governance. |

**Stop condition:** Node-side acquisition pipeline is **operational locally**. PDF extraction requires **Python deps + user PDF path** on operator workstation.

---

## Block 2 — First real OEM brochure ingestion

| Step | Status |
|------|--------|
| Register brochure | Registry already contains Tata Punch slot `tata-punch-ev-empowered-lr-oem-slot` (`needs_manual_check` until `localAssetPath` set). |
| `acq:extract-pdf` | **Not run** — no licensed PDF path in workspace; Python libs not installed (SSL). |
| Normalize + provenance + queue | **Completed (curated dry-run)** — `MANUAL_ENTRY` flatSpecs aligned to published Punch LR numbers → `enqueue-file` → job `pending_review` → **diff validated** → **test artifacts removed** (queue not left dirty). |

**Interpretation:** End-to-end **editorial + governance path** is proven. **True brochure bytes → extract_brochure.py** remains the operator’s next action on a machine with PDF + Python deps.

**Commands for operator (when PDF available):**

```bash
npm run acq:register-source -- "{\"sourceId\":\"tata-punch-ev-empowered-lr-oem-slot\",\"localAssetPath\":\"C:\\\\ops\\\\Tata-Punch-EV-brochure.pdf\",...}"
npm run acq:extract-pdf -- --source-id tata-punch-ev-empowered-lr-oem-slot --pdf C:\ops\Tata-Punch-EV-brochure.pdf
# Then human map tables → enqueue-file payload; never auto-merge Tier-1
npm run acq:diff -- tata-punch-ev-empowered-lr --draft data-acquisition\staging\pending_review\<job>.json
```

---

## Block 3 — Tier-1 intelligence gap analysis

**Deliverable:** [TIER-1-COVERAGE-GAP-LIST.md](./TIER-1-COVERAGE-GAP-LIST.md)

**Headline gaps:** inconsistent **AC/DC time** fields across Tata trims; **Bharat NCAP** null fleet-wide; uneven **serviceCostPerKm**; **ADAS** depth varies; several **`seo.chargingFaq`** empty.

---

## Block 4 — Soft-launch operational verification

| Command | Result |
|---------|--------|
| `npm run ops:seo` | **health: ok**, 35 crawlable URLs, canonical 0 errors, sitemap freshness ok. |
| `npm run ops:dashboard` | Aggregated snapshot ok (DB metrics null without `--db` — expected). |
| `node scripts/audit-soft-launch-readiness.js` | **`launchReady: true`**, `totalErrors: 0`. Note: `production.behavioral.errors: 1` inside nested audit with warnings — does not fail overall readiness flag. |

**Reconfirmation:** Soft-launch readiness **passes** on current workspace snapshot.

---

## Block 5 — SEO readiness preparation

**Deliverable:** [seo-indexing-priorities.md](./seo-indexing-priorities.md)  
Static JSON confirmed for `nexon-ev-vs-mg-zs-ev`, `best-evs-for-city-driving`, `best-evs-for-first-time-buyers` under `zyvev-frontend/public/seo-data/`.

---

## Block 6 — Strategic review (answers)

1. **Is brochure ingestion operationally practical?**  
   **Yes for the Node + review + diff + provenance path** (validated). **PDF extract step** depends on Python env + SSL + local OEM file — **practical once those three are cleared** on the ops machine.

2. **Is the review workflow scalable?**  
   **Moderately.** One job per variant is fine at 17–50 vehicles; at hundreds, split by **model brochure batches** and consider a lightweight ticket ID in `reviewerNotes`. No new architecture required yet.

3. **Which fields are hardest to extract reliably?**  
   **ADAS feature lists**, **NCAP**, **city-specific on-road**, and **conditional warranty** tables (footnotes). **Charging time** cells are medium difficulty (table layout variance).

4. **What intelligence gaps exist?**  
   See gap list: **charging time consistency**, **NCAP sourcing**, **service cost parity**, **charging FAQ** depth.

5. **Is Tier-1 expansion operationally sustainable?**  
   **Yes if** ingestion stays **brochure-first + human map + audit**, and `KNOWN_FLAT_MAP` grows deliberately. **Risk** if PDF extract is treated as auto-truth without curator step.

6. **Is EVSavari ready for controlled public exposure?**  
   **Technical snapshot: yes** (`launchReady: true`, SEO ops ok). **Ops:** resolve Python/SSL for extraction fleet; **content:** close highest-severity Tier-1 gaps where they affect compare/ownership UX.

---

## Success criteria checklist

| Criterion | Met? |
|-----------|------|
| First real brochure **bytes** ingested via Python extract | **No** (no PDF + no pip) |
| Curated **realistic** Tata Punch cycle (normalize → queue → diff) | **Yes** |
| Provenance metadata validated | **Yes** |
| Review workflow validated | **Yes** |
| Diff detection validated | **Yes** |
| Tier-1 intelligence gaps identified | **Yes** (doc) |
| Soft-launch readiness reconfirmed | **Yes** |
| Operational bottlenecks identified | **Yes** (SSL/pip, missing PDF, behavioral sub-audit noise) |

---

## Next actions (operator)

1. Install Python deps on a trusted network: `pip install -r services/pdf-extraction/python/requirements.txt`.
2. Place **Tata Punch EV or Nexon EV** brochure PDF on disk; `register-source` + `extract-pdf`.
3. Map extract → `enqueue-file`; `approve` after human sign-off; optional `publish-approved-staging` for manifest only.
4. GSC: follow [seo-indexing-priorities.md](./seo-indexing-priorities.md).
