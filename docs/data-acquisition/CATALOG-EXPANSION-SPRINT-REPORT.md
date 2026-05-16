# Catalog expansion & ownership intelligence — execution report

**Date:** 2026-05-16  
**Tier-1 variants:** **17 → 29** (+12)  
**Crawlable vehicle URLs:** **35 → 47** (sitemap rebuilt)  
**Git push:** not performed

---

## 1. New EVs / variants added (+12)

| Slug | Brand | Model | Trim |
|------|-------|-------|------|
| `mahindra-be-6-pack-two` | Mahindra | BE 6 | Pack Two |
| `mahindra-be-6-pack-three-select` | Mahindra | BE 6 | Pack Three Select |
| `mahindra-xev-9e-pack-two` | Mahindra | XEV 9e | Pack Two |
| `mahindra-xev-9e-pack-three-select` | Mahindra | XEV 9e | Pack Three Select |
| `citroen-ec3-live` | Citroën | eC3 | Live |
| `citroen-ec3-shine` | Citroën | eC3 | Shine |
| `kia-ev6-gt-line` | Kia | EV6 | GT Line |
| `bmw-ix1-xdrive30` | BMW | iX1 | xDrive30 |
| `mercedes-eqa-250-plus` | Mercedes-Benz | EQA | 250+ |
| `mercedes-eqb-250-plus` | Mercedes-Benz | EQB | 250+ |
| `volvo-ex40-single-motor` | Volvo | EX40 | Single Motor Extended |
| `volvo-ex40-twin-motor` | Volvo | EX40 | Twin Motor |

**OEM coverage now:** Tata, MG, Mahindra, Hyundai, BYD, Citroën, Kia, BMW, Mercedes-Benz, Volvo (10 brands).

**Existing lineup retained:** Punch (2), Nexon (2), Curvv (2), Tiago (2), XUV400 (2), MG ZS/Comet, Kona, Atto 3.

---

## 2. OEM ingestion progress

- **12 new source slots** registered in `services/source-registry/sources.json` (`EXPANSION_SPRINT` tag).
- All new variants carry `verification.flags` with **`needs_review`** on pricing/range/pack where not brochure-verified.
- **No auto-extract** run on expansion trims — brochure registration → extract → curator → review remains mandatory.
- Punch LR **brochure-verified** charging fields merged editorially into catalog source (`tata.js`).

---

## 3. Ownership intelligence improvements

- New **`ownershipPracticality`** block on all variants at build time:
  - apartment charging suitability, highway usability, family/luggage/city/ingress/rear-seat scores
  - ownership confidence indicator, charging anxiety reduction notes
- **`comfort`** block enriched via existing intelligence pipeline (ingress/egress, boot practicality).
- **`ownershipIntelligence`** / **`chargingReality`** / **`buyerAssurance`** applied via `applyOwnershipReality` at catalog build.

---

## 4. Charging intelligence improvements

- Shared **`chargingBlock()`** helper — times omitted when unknown (no silent guess).
- **Punch Empowered LR:** `usableKwh: 33`, `acTime0to100Hours: 6.5`, `dcTime10to80Minutes: 56` (cycle-1 verified flags).
- **XUV400, BE 6, XEV 9e, luxury trims:** AC/DC times populated where structurally known; eC3 correctly **AC-only** (`dcKw: 0`).
- Auto-generated **`seo.chargingFaq`** when charging times exist (build-time enrichment).

---

## 5. Coverage-quality improvements

| Metric | Before (17) | After (29) |
|--------|-------------|------------|
| Variants with charging FAQ | Partial | **Majority** (auto FAQ when times present) |
| Variants with `ownershipPracticality` | 0 | **29** |
| Expansion trims with `needs_review` flags | — | **12** (honest governance) |
| Bharat NCAP populated | 0 | **0** (still requires licensed bulletin) |

Editorial coverage dashboard (`/admin/editorial/coverage`) now tracks `ownershipPracticality` and `needsReviewFlags`.

---

## 6. Remaining intelligence gaps

1. **Bharat NCAP** — still null fleet-wide until official dataset ingestion.
2. **12 expansion trims** — pricing/range/pack flagged `needs_review`; require licensed brochure pass.
3. **Punch Smart+ / Tiago / Curvv** — AC/DC times still incomplete on some Tata micro-SUV/hatch trims.
4. **Usable kWh** — only Punch LR has verified usable capacity; others omit field.
5. **Real owner observations** — foundation only; no public surface.

---

## 7. Extraction reliability (unchanged operational learnings)

- Text PDF → curator → review rail validated on Punch LR.
- New trims **must not** skip extract/review because catalog JSON exists — JSON is **editorial seed**, not OEM proof.
- Table-heavy luxury brochures may need manual grid entry until flat-map extended.

---

## 8. Real-world observation foundation

**Module:** `services/real-world-observations/`

- Types: range, charging, apartment charging, service, highway practicality.
- Statuses: draft → pending_review → approved/rejected (no public exposure).
- Store: `data-acquisition/real-world-observations/` (gitignored).

---

## 9. Operational validation

| Check | Result |
|-------|--------|
| `build-catalog.mjs` + `validate-catalog.mjs` | **29 variants OK** |
| `build-sitemaps.mjs` | **47 URLs**, 29 vehicles |
| `npm run acq:audit` | **ok** |
| `npm run ops:seo` | **health ok**, canonical 0 errors |
| `launchReady` | **true** |
| `validate:production` | **ready: true**, 29 variants |

---

## 10. Recommended next execution block

1. Licensed brochure ingest for **BE 6** and **XEV 9e** (highest India launch traffic).
2. Editorial merge of verified specs for expansion trims (replace `needs_review` flags).
3. Tata Punch Smart+ / Curvv charging table pass (match Nexon-class completeness).
4. Bharat NCAP licensed dataset (single fleet uplift).
5. Pilot **real-world observations** in editorial review (internal only).

---

*Rebuild catalog:* `node docs/architecture/catalog/tier-1/build-catalog.mjs`  
*Rebuild sitemaps:* `node scripts/build-sitemaps.mjs`
