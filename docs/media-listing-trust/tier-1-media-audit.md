# Tier-1 catalog media audit

**Date:** 2026-05-15  
**Variants:** 17 (Tata, MG, Mahindra, Hyundai, BYD)  
**Tool:** `node docs/architecture/catalog/tier-1/audit-media.mjs`

## Summary

| Check | Result |
|-------|--------|
| Unique slug per CDN path | Pass |
| Duplicate hero across variants | Pass |
| Unsplash / generic placeholders in JSON | Pass |
| `listingThumbnail` / `compareThumbnail` / `ogImage` defined | Pass (per-slug paths) |
| Gallery ≥ 2 images | Pass |

## Findings

### 1. CDN assets not yet verified live

All variants point to `https://cdn.evsavari.com/catalog/{slug}/…`. Paths are **correct and slug-scoped**, but files must be uploaded and spot-checked in browser. Until then, listing cards may 404 and fall back to brand placeholder or `ev-placeholder.jpg`.

**Action:** Upload OEM-approved packs per [media-quality-checklist.md](./media-quality-checklist.md).

### 2. Dedicated crops share naming convention

New fields (rebuilt via `mediaPaths()`):

- `hero.jpg` — detail hero, 16:9 or 3:2
- `listing-thumb.jpg` — card crop (16:10 safe zone)
- `compare-thumb.jpg` — compare grid (square-safe center)
- `og.jpg` — 1200×630 social
- `exterior-1..3.jpg`, `interior-1.jpg`, `charging-port.jpg`

Until crops exist, runtime aliases **listing → hero** in mapper/API.

### 3. No mismatched cross-brand URLs in JSON

Each slug folder is isolated; audit found **no** shared hero URL across variants.

### 4. Legacy frontend risk (fixed)

Previously `CarCard` / `normalizeCar` used Unsplash sports-car stock — **removed**. Fallback chain is now catalog CDN → brand body fallback → neutral EV placeholder.

### 5. Psychology → listing signals

Tags in catalog (`best_for_city`, `best_for_family`, etc.) drive up to **2 chips** on cards. Derived signals: Long Range (≥400 km ARAI), Value (compare score ≥82), Fast Charging (DC ≤45 min in summary).

### 6. Governance still in review

Most Tier-1 records are `governance.status: review`. Cards show **Verified Specs** when quality ≥85; **EVSavari Verified** only when `published`.

## Per-brand notes

| Brand | Models | Media priority |
|-------|--------|----------------|
| Tata | Nexon, Punch, Curvv, Tiago | Highest traffic — verify hero + listing-thumb first |
| MG | ZS EV, Comet | Comet needs clear scale (city EV) |
| Mahindra | XUV400 | EC vs EL trim — distinct exterior angles |
| Hyundai | Kona | Premium cabin + port shot |
| BYD | Atto 3 | Tech-forward gallery; avoid ICE stock |

## Re-run audit

```bash
cd zyvev-backend/docs/architecture/catalog/tier-1
node build-catalog.mjs && node audit-media.mjs
```
