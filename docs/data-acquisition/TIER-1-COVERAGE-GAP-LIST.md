# Tier-1 coverage gap list

**Generated:** operational review of `docs/architecture/catalog/tier-1/variants/*.json` (**29 variants** after expansion sprint 2026-05-16).  
**Purpose:** Prioritize intelligence depth before catalog breadth expansion.

## Refinement — 2026-05-16 (operational execution)

| Observation | Action |
|---------------|--------|
| **Charging standards** (`CCS2` / `Type2`) are present on DC-capable Tata/MG/Mahindra samples; Comet correctly **Type2-only** — acquisition must **never infer** a standard not on the connector row. |
| **Normalization diff** on Punch LR: a full **flat curator** payload matching current Tier-1 produced **zero** tracked diffs on comparable fields — confirms diff tool + catalog alignment for smoke tests. |
| **Gaps below remain** until brochure-sourced `acTime` / `dcTime` rows are merged editorially (not via auto-publish). |
| **Cycle 1 diff (Punch LR approved draft)** confirmed **draft_only**: `battery.usableKwh`, `charging.acTime0to100Hours`, `charging.dcTime10to80Minutes` — prioritize for next editorial merge. |
| **Flat map gap:** `warrantyBatteryKm`, charging **standards** strings — present in brochure text but not normalizable yet. |
| **NCAP / ADAS / serviceCost** still fleet-uneven — prioritize Tata + MG brochure passes first (largest traffic share). |

## Summary

| Theme | Severity | Notes |
|-------|----------|-------|
| Structured charging times | **High** | Several Tata variants omit `acTime0to100Hours` / `dcTime10to80Minutes` while Nexon variants include them — inconsistent **charging practicality** UX and acquisition targets. |
| Bharat NCAP / crash test | **Medium** | `safety.bharatNcap` appears as `null` across sampled variants — honest but limits trust narrative until sourced. |
| ADAS detail | **Medium** | `adas.level` / `features` present in schema usage varies; brochure ingestion should standardize **trim-specific ADAS** with provenance. |
| Service cost intelligence | **Medium** | `ownership.serviceCostPerKm` populated on some trims (e.g. Nexon), **absent** on Punch / Tiago / Comet in samples — **service intelligence** uneven. |
| Warranty km caps | **Low** | Some variants include `warrantyBatteryKm` (Punch); Tiago sample omits — align with OEM brochure tables. |
| Pricing completeness | **Low** | Punch sample shows reduced `pricing` block vs Nexon (no `onRoadByCity` / EMI) — may be intentional simplification; flag for **ownership practicality** if compare flows expect parity. |
| `chargingEcosystem` | **Low** | Section exists in files; depth vs “placeholder” should be audited per variant for **charging confidence**. |
| `seo.chargingFaq` | **Low** | Often `[]` — opportunity for editorial FAQ from verified charging copy. |
| Real-world range | **Info** | `realWorldKm` uses methodology strings and estimates — mark for **future owner-signal refresh** (not a “gap” if labeled). |

## Variant-level examples (non-exhaustive)

### Tata Punch EV (`tata-punch-ev-empowered-lr`, `tata-punch-ev-smart-plus`)

- **Missing vs Nexon-class richness:** `charging.acTime0to100Hours`, `charging.dcTime10to80Minutes` not in JSON (DC kW and standards present).
- **Ownership:** No `serviceCostPerKm` in Punch sample (verify vs Nexon).

### Tata Tiago EV (`tata-tiago-ev-xt`)

- **Charging:** No AC full-charge or DC time fields; minimal `v2l`/`regen` compared to SUVs.
- **Ownership:** Thin subset vs Nexon (e.g. resale/charging network scores may be missing — verify file).

### MG Comet EV (`mg-comet-ev-play`)

- **DC charging:** `dcKw: 0` is intentional product truth — **charging practicality** narrative must stay explicit (no inferred DC).
- **Service / warranty km:** Compare to ZS EV / Atto for field parity.

### Cross-fleet

- **Bharat NCAP:** null everywhere in grep — single OEM/program dataset ingestion could lift all variants **if** licensed.
- **ADAS:** Acquisition pipeline should map brochure “driver assistance” tables to `safety.adas.features` with **MANUAL_ENTRY** + provenance.

## Recommended acquisition targets (brochure → normalized)

1. **Charging tables** — AC time 0–100%, DC 10–80% minutes, max DC kW (per trim).
2. **Warranty matrix** — vehicle + battery years/km caps.
3. **ADAS matrix** — feature list + level (no inference beyond brochure).
4. **Service / maintenance** — only if OEM publishes per-km or schedule; else omit.

## Out of scope (do not infer)

- On-road price by city without dealer/OEM source.
- Real-world range without methodology change.
- NCAP stars without official bulletin.

---

*Maintainer: refresh this list after each Tier-1 batch merge or quarterly catalog audit.*
