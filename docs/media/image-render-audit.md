# EVSavari Image Render Audit

Generated: 2026-06-10

## Summary

Local `/images/cars/{slug}/listing.webp` assets are valid and reachable, but card tiles appeared grey because **`VehicleImage` kept `<img>` at `opacity: 0` until `onLoad` fired** — and `onLoad` often never fires for **browser-cached** images (or when the decode completes before React attaches handlers).

This is **not** a broken URL, zero-height wrapper, or missing `<img>` mount. The shimmer wrapper background remained visible while the loaded image stayed invisible.

## Files inspected

| File | Role |
| --- | --- |
| `src/components/media/VehicleImage.jsx` | Image mount, opacity gate, shimmer, fallback chain |
| `src/components/CompactCarCard.jsx` | Home / related cards — `responsive`, `aspectRatio: 16/10` wrapper |
| `src/components/CarCard.jsx` | Browse / search cards — same pattern |
| `src/components/compare/CompareVehicleCard.jsx` | Compare columns — `role="compare"`, absolute fill |
| `src/media/responsive.js` | Local URLs correctly skip `<picture>` (no empty `src=""`) |
| `src/styles/catalog-ux-wave-b.css` | No rules hiding card images |
| `src/styles/compare-page.css` | Compare variant disables hover transform only |
| `src/components/compare/compare-vehicle-card.css` | Media box `aspect-ratio: 16/10`, grey gradient background |

## Verification checklist

| Check | Finding |
| --- | --- |
| `<img src="/images/cars/.../listing.webp">` mounted | Yes — plain `<img>` for local URLs (`buildResponsiveSources` returns no `default` for non-Cloudinary) |
| `onLoad` fires | **Often missed** when image already in HTTP cache |
| `loaded` becomes `true` | Stuck `false` when `onLoad` missed → permanent grey shimmer |
| Overlay / skeleton above image | Loading `<span>` gradient sits under img; img at `opacity: 0` lets grey wrapper show through |
| `opacity: 0` / `visibility` | **Root symptom:** `opacity: loaded ? 1 : 0` without cache sync |
| Zero-height container | No — parent `imageWrapper` / `compare-vehicle-card__media` use `aspect-ratio: 16/10`; inner wrapper uses `position: absolute; inset: 0` |
| `object-fit` / aspect ratio | `objectFit: cover` on img; wrapper aspect ratio preserved |

## Root cause

1. **`VehicleImage` fade-in gate:** Images render with `opacity: 0` until `loaded === true`.
2. **Cache race:** On remount or chain reset, cached images can reach `complete` before `onLoad` is registered, so `loaded` never flips to `true`.
3. **Visible grey:** The outer div’s shimmer gradient (`#e2e8f0` → `#f1f5f9`) stays animated while the invisible `<img>` sits underneath.
4. **Not the text placeholder:** `"EV image coming soon"` only shows when `exhausted === true` (all fallback URLs failed). Grey cards were the **loading shimmer**, not the exhausted placeholder.

Card components (`CompactCarCard`, `CarCard`, `CompareVehicleCard`) were structurally correct — absolute fill inside a 16:10 box, no CSS hiding images.

## Fix applied

**File:** `src/components/media/VehicleImage.jsx`

1. **Callback ref + `useLayoutEffect`** — detect `img.complete && img.naturalWidth > 0` and set `loaded` immediately for cached images.
2. **Style merge order** — spread `imgStyle` first, then enforce `position`, `opacity`, `visibility`, and `zIndex` so card hover transforms cannot override visibility.
3. **`zIndex: 1`** on `<img>` / `<picture>` so loaded images stack above the loading gradient span.

## npm run build result

**Pass** (exit 0, Vite build ~2s)

## Re-test in browser

After deploy / dev refresh:

1. Open Home or `/cars` — Harrier, Creta, Vitara cards should show photos (not grey shimmer).
2. DevTools → Network: confirm `listing.webp` 200.
3. DevTools → Elements: confirm `<img src="/images/cars/.../listing.webp">` has `opacity: 1` after load.
4. Hard refresh vs soft navigation — both should show images (cache-safe).
