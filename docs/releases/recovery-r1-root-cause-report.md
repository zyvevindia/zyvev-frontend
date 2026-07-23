# Recovery Sprint R1 — Root Cause Report

**Generated:** 2026-07-10  
**Site:** https://evsavari.com

## Why production failed

Production **listing, compare, and hero** images were already resolving to local WebP for all 11 tier-1 families. Browser audit confirmed `naturalWidth > 0` for Tata Tiago EV and Hyundai Kona Electric on Browse and Car Details hero.

The user-visible defects were on **Car Details gallery thumbnails** for partial local families (`MEDIA_COMPLETION_P2_TYPES`):

| Family | Missing local slots | Browser symptom |
|--------|---------------------|-----------------|
| `tata-tiago-ev` | `rear`, `side` | `fallback-ev.svg` in gallery thumbs |
| `hyundai-kona-electric` | `rear`, `side`, `interior` | `fallback-ev.svg` in gallery thumbs |
| `byd-atto-3` | `rear`, `side`, `interior` | `fallback-ev.svg` in gallery thumbs |
| `mahindra-xuv400` | `rear`, `side`, `interior` | `fallback-ev.svg` in gallery thumbs |

`resolveDetailGalleryItems()` always emitted all five gallery types. For unprovisioned slots the chain tried Cloudinary candidates, those assets 404 in the browser, and `VehicleImage` exhausted the chain to **`/fallback-ev.svg`** — a generic debug-style placeholder that reads as a broken/incorrect vehicle photo.

A secondary architectural leak: `VehicleImage` promoted an optional `src` prop (e.g. color swatch / API hero) **ahead of** local WebP in the fallback chain, bypassing the local-first resolver ordering when API URLs were stale.

## Why Sprint 1.2 certification passed incorrectly

`scripts/sprint-12-media-certification.mjs` audits **resolver output in Node** with a minimal stub car object. It checks:

- `getListingImage()` / `getHeroImage()` return `/images/cars/...` paths
- `buildImageFallbackChain()` head is local

It does **not**:

- Launch a browser or assert `naturalWidth > 0`
- Render Car Details gallery thumbs
- Detect `fallback-ev.svg` after client-side `onError` fallback
- Use real API-enriched car objects

Therefore Sprint 1.2 correctly proved manifest/resolver strings for listing + hero, but **false-PASS** on the full user experience.

## Fix (shared media architecture only)

1. **`src/utils/vehicleMedia.js` — `resolveDetailGalleryItems()`**
   - Skip gallery types not provisioned in `getLocalCarMediaTypesForFamily()` for partial local families.
   - Only return slots whose chain contains a non-placeholder URL (local WebP or verified delivery).

2. **`src/components/media/VehicleImage.jsx`**
   - Merge optional `src` overrides **after** local `/images/cars/` tier (preserves single resolver, local-first layering).

3. **`scripts/recovery-r1-browser-media-certification.mjs`**
   - New browser certification harness (`npm run media:certify:recovery-r1`) using Playwright against production surfaces.

No vehicle-specific exceptions, no page-level overrides, no second resolver.

## Recurrence prevention

- Recovery R1 certification requires **browser-rendered** evidence (`naturalWidth > 0`, no `fallback-ev.svg` for core roles).
- Gallery slots are suppressed unless provisioned in the local manifest partial-type list — partial families cannot render phantom angles.
- `VehicleImage` can no longer prioritize API/color `src` above on-disk WebP.

## Files changed

| File | Change |
|------|--------|
| `src/utils/vehicleMedia.js` | Provisioned gallery filtering |
| `src/components/media/VehicleImage.jsx` | Local-first `src` merge |
| `scripts/recovery-r1-browser-media-certification.mjs` | Browser certification harness |
| `package.json` | `media:certify:recovery-r1` script |
| `docs/releases/recovery-r1-root-cause-report.md` | This report |
| `docs/releases/recovery-r1-media-certification.md` | Certification output (post-run) |

## Architecture impact assessment

| Area | Impact |
|------|--------|
| Frontend | Minor — shared media resolver + `VehicleImage` chain ordering |
| Backend | None |
| Database | None |
| APIs | None |
| Routing | None |
| Catalog | None |
| Media | Minor — gallery slot gating for partial local families |
| Regression Risk | Low — listing/compare/hero unchanged; fewer gallery thumbs on partial families |
