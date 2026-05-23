# Media gap audit — EVSavari production

**Generated:** 2026-05-23 (Tier-1 Media Completion Sprint)  
**Command:** `npm run media:verify` (manifest + live Cloudinary probe)  
**Upload:** `npm run media:upload-tier1` from `docs/operations/tier1-cloudinary-seed.json`

---

## Executive summary

| Metric | Value | Sprint target |
|--------|-------|---------------|
| Tier-1 family manifest coverage | **100%** (11 / 11) | ≥ 90% |
| Manifest role completeness (URL slots) | **100%** | — |
| Production-critical probe (hero / listing / compare) | **0 broken** (33 / 33 OK) | 0 broken |
| Compare-ready (synthetic tier-1) | **100%** | ≥ 95% |
| Synthetic fallback usage | **0%** | — |
| Gallery manifest slots (all families) | **100%** defined | — |
| Optional gallery delivery (full manifest probe) | **61** unreachable | Legacy 6 families missing og/gallery uploads |

**Outcome:** Tier-1 priority families now have production-grade hero, listing-thumb, and compare-thumb on Cloudinary under canonical public IDs. Frontend manifest expanded; no route or fallback architecture changes.

---

## Newly completed families (this sprint)

| Family | Hero | Listing | Compare | Gallery (Cloudinary) |
|--------|------|---------|---------|----------------------|
| `tata-tiago-ev` | ✓ | ✓ | ✓ | ✓ (Commons seed) |
| `mahindra-xev-9e` | ✓ | ✓ | ✓ | ✓ (single-angle set) |
| `mahindra-xuv400` | ✓ | ✓ | ✓ | ✓ |
| `byd-atto-3` | ✓ | ✓ | ✓ | ✓ |
| `hyundai-kona-electric` | ✓ | ✓ | ✓ | ✓ |

Public ID pattern: `evsavari/catalog/families/{family}/{hero|listing-thumb|compare-thumb|og}` (extensionless for core + og); gallery files use `{exterior-1,exterior-2,exterior-3,interior-1,charging-port}.jpg`.

---

## Production manifest families (all tier-1)

| Family | Core assets | Notes |
|--------|-------------|-------|
| tata-nexon-ev | ✓ probed | Gallery optional slots not on Cloudinary |
| tata-punch-ev | ✓ | Same |
| tata-curvv-ev | ✓ | Same |
| tata-tiago-ev | ✓ | **New** — Commons editorial seed |
| mg-comet-ev | ✓ | Gallery optional gaps |
| mg-zs-ev | ✓ | Gallery optional gaps |
| mahindra-be-6 | ✓ | Gallery optional gaps |
| mahindra-xev-9e | ✓ | **New** — limited angle variety |
| mahindra-xuv400 | ✓ | **New** |
| byd-atto-3 | ✓ | **New** |
| hyundai-kona-electric | ✓ | **New** |

---

## Remaining optional gallery gaps

| Scope | Gap | Ops action |
|-------|-----|------------|
| Legacy 6 families | `og`, `exterior-1..3`, `interior-1`, `charging-port` not uploaded | Upload to matching public IDs or run `media:upload-tier1` after adding OEM URLs to seed JSON |
| `mahindra-xev-9e` | Single source image reused for all gallery roles | Replace with multi-angle OEM pack when available |
| All Commons-seeded families | Editorial Wikimedia (CC-BY-SA), not OEM press | Swap `tier1-cloudinary-seed.json` URLs for OEM assets; re-run `npm run media:upload-tier1` |

---

## Asset completeness

| Layer | % | Detail |
|-------|---|--------|
| Tier-1 manifest registration | **100%** | All 11 slugs in `PRODUCTION_FAMILY_SLUGS` |
| Core role URL definition | **100%** | 11 × (hero + listing + compare) |
| Core role Cloudinary delivery | **100%** | Live HEAD/GET probe passed |
| Full manifest URL probe | **~38%** | 61/99 optional URLs missing on legacy families |
| Compare-ready (runtime synthetic) | **100%** | No local SVG fallback for tier-1 slugs |

---

## Unresolved media needs

1. **OEM press replacement** — Replace Commons seed images with brand-approved packs for buyer trust (especially Tiago, Atto 3, Kona).
2. **Legacy family gallery** — Upload og + exterior/interior/charging for the original six soft-launch families.
3. **XEV 9e gallery variety** — Add distinct exterior/interior/charging angles when OEM assets land.
4. **Brand logos** — `evsavari/catalog/brands/{brand}/logo` may still be missing (fallback path only).

---

## Commands

```bash
npm run media:verify                    # manifest + probe; fails only on missing manifest or broken core roles
npm run media:verify -- --no-probe      # offline manifest gaps only
npm run media:upload-tier1              # upload from docs/operations/tier1-cloudinary-seed.json
npm run media:upload-tier1 -- --core-only --family=tata-tiago-ev
npm run media:discover-cloudinary       # inventory Cloudinary
npm run media:fix-cloudinary            # rename misaligned public IDs
```

Reports: `reports/media-integrity-YYYY-MM-DD.json` and `.csv`  
Admin: `/admin/media-health`

---

## Fallback hierarchy (unchanged)

1. Exact API/catalog field (sanitized)
2. Production family manifest role URL
3. Same-OEM sibling family asset (`brandSiblingMediaUrls`)
4. Brand logo public_id (`evsavari/catalog/brands/{brand}/logo`)
5. Branded `/fallback-ev.svg`
