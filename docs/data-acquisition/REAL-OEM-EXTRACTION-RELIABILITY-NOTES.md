# Real OEM extraction reliability notes

**Cycle:** Tata Punch EV Empowered LR — `tata-punch-ev-empowered-lr-oem-licensed`  
**PDF used:** `data-acquisition/incoming/tata-punch-ev-empowered-lr-brochure.pdf`  
**Governance status:** **Operational placeholder** until replaced with dealer/OEM-licensed brochure (see watermark on page 1 of extract).

## Extraction engine behaviour

| Aspect | Observation |
|--------|-------------|
| Engine | **pdfplumber** (`TEXT_EXTRACTION`) |
| Pages captured | 2 |
| Tables | **0** (text-only layout; no vector tables detected) |
| OCR | **Not triggered** (selectable text PDF) |
| Readability | Page 2 spec lines **fully readable** in raw JSON |

## Field-level reliability (this cycle)

| Field group | Auto-extract | Curator | Notes |
|-------------|--------------|---------|-------|
| Pricing | No | Yes | Parsed from text line `12,49,000` → `1249000` |
| Battery / range | Partial | Yes | Pack + usable + ARAI line clear |
| Charging kW / times | Partial | Yes | All four values present in text |
| Charging standards | In text | **Omitted** | `CCS2, Type 2` not in `KNOWN_FLAT_MAP` |
| Boot / warranty | In text | Yes | km cap in text but **no flat key** for `warrantyBatteryKm` |
| ADAS | In text | Yes | Mapped as level `0` |
| Dimensions | Not in text | No | Not claimed |

## Normalization / governance

- Unsupported flat key `__unsupportedProbe` **silently skipped** (`__` prefix rule) — no false publish.
- All enqueued fields carry **full provenance metadata** (`MANUAL_ENTRY`, `HIGH`, `sourceId`, `pageHint`).
- **No hallucinated** fields beyond extract text.

## Diff vs Tier-1 (approved draft)

| Field | Diff type | Interpretation |
|-------|-----------|----------------|
| `battery.usableKwh` | draft_only | Tier-1 missing usable kWh — enrichment opportunity |
| `charging.acTime0to100Hours` | draft_only | Tier-1 missing AC time — charging practicality gap |
| `charging.dcTime10to80Minutes` | draft_only | Tier-1 missing DC time — charging practicality gap |

Matching fields (price, pack kWh, range, DC kW, etc.) produced **no diff** — catalog already aligned on those comparables.

## What scales safely

- Text-heavy spec pages → extract → curator `flatSpecs` → review → diff.
- Staged publish manifest without Tier-1 touch.

## What requires manual governance

- Real **licensed PDF** custody (incoming/ or `ACQ_OEM_PDF_PATH`).
- **Table-heavy** brochures (need table extractor tuning or manual grid copy).
- **NCAP**, **service cost**, **charging FAQ** — outside current flat map / not on spec page.
- Editorial merge to Tier-1 after human sign-off.

## Pipeline refinements (future, bounded)

1. Add `warrantyBatteryKm` + `chargingStandards` to flat map with schema paths.
2. Python **3.10+** venv for acquisition workstations.
3. Optional second-pass table detector when `tables.length === 0` but spec page detected.
