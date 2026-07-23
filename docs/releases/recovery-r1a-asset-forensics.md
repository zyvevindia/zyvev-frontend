# Recovery Sprint R1A — Media Asset Forensics

**Generated:** 2026-07-10  
**Site:** https://evsavari.com  
**Mode:** Forensics only — no architecture changes

---

## Root Cause (single category)

**☑ Wrong image assets**

**Not the cause (proven):**
- ☐ Wrong manifest mapping — `listing` → `listing.webp` is correct
- ☐ Wrong resolver — returns `/images/cars/<slug>/listing.webp` as designed
- ☐ Wrong deployment — production bytes SHA256-match git/local
- ☐ Wrong build output — `dist/images/cars/` matches `public/images/cars/`
- ☐ Browser cache — fresh Playwright session reproduces same placeholder artwork

---

## 1. Asset Audit

Legend: **A** = real vehicle photograph · **B** = blue placeholder artwork (`<slug> · <type>`)

| Vehicle | front | listing | compare | dashboard | rear | side | interior | Result |
|---------|-------|---------|---------|-----------|------|------|----------|--------|
| tata-tiago-ev | **B** | **B** | **B** | **A** | — | — | **A** | Core slots are placeholders |
| hyundai-kona-electric | **B** | **B** | **B** | **A** | — | — | — | Core slots are placeholders |
| byd-atto-3 | **B** | **B** | **B** | **A** | — | — | — | Core slots are placeholders |
| mahindra-xuv400 | **B** | **B** | **B** | **A** | — | — | — | Core slots are placeholders |

### File size signal (placeholders ≈ 6–9 KB; photographs ≈ 60–315 KB)

| Vehicle | listing.webp | front.webp | compare.webp | dashboard.webp |
|---------|-------------|------------|--------------|----------------|
| tata-tiago-ev | 8,024 B | 7,438 B | 8,418 B | 71,068 B |
| hyundai-kona-electric | 9,274 B | 8,474 B | 9,384 B | 315,308 B |
| byd-atto-3 | 7,022 B | 6,434 B | 7,332 B | 122,830 B |
| mahindra-xuv400 | 7,970 B | 7,360 B | 8,288 B | 149,084 B |
| tata-nexon-ev (control) | 158,634 B | 158,634 B | 115,050 B | 71,068 B |

### Opened asset evidence (screenshots saved)

Placeholder core slots (`<slug> · listing` / `· front` visible):

- `reports/media-audit/r1a-downloads/tata-tiago-ev-listing.webp`
- `reports/media-audit/r1a-downloads/tata-tiago-ev-front.webp` (local `public/images/cars/tata-tiago-ev/front.webp`)
- `reports/media-audit/r1a-downloads/tata-tiago-ev-compare.webp`
- `reports/media-audit/r1a-downloads/hyundai-kona-electric-listing.webp`
- `reports/media-audit/r1a-downloads/hyundai-kona-electric-front.webp`
- `reports/media-audit/r1a-downloads/byd-atto-3-listing.webp`
- `reports/media-audit/r1a-downloads/mahindra-xuv400-listing.webp`

Subtitle text on placeholders:
- Tiago/Kona front/listing/compare: **"EVSavari Sprint C2 Media Operations"**
- BYD/XUV400 front/listing/compare: **"Sprint 1.2 media stabilization"**

Dashboard/interior slots (where present) are larger files sourced from Wikimedia via `photoReplacementBatch5Seed.json` — only dashboard (and Tiago interior) were replaced with real photographs.

---

## 2. Mapping Report

Chain is identical for all four vehicles. Example: **tata-tiago-ev listing**

```
Resolver (vehicleMedia.js)
  getListingImage(car)
  → buildImageFallbackChain(car, "listing")[0]
  → "/images/cars/tata-tiago-ev/listing.webp"

Manifest (localCarMediaManifest.js)
  MEDIA_COMPLETION_P2_TYPES["tata-tiago-ev"] includes "listing"
  localCarMediaPath("tata-tiago-ev", "listing")
  → "/images/cars/tata-tiago-ev/listing.webp"

Image path (on disk)
  public/images/cars/tata-tiago-ev/listing.webp

Build artifact
  dist/images/cars/tata-tiago-ev/listing.webp
  SHA256 prefix: E80D47921A89A593 (matches public)

Production download
  https://evsavari.com/images/cars/tata-tiago-ev/listing.webp
  SHA256 prefix: E80D47921A89A593 (matches local)

Browser (Playwright, 2026-07-10)
  Browse card src: https://evsavari.com/images/cars/tata-tiago-ev/listing.webp (1280×800)
  Detail hero src:  https://evsavari.com/images/cars/tata-tiago-ev/front.webp (1280×800)
```

**Conclusion:** Mapping is correct end-to-end. The file at the mapped path is itself a placeholder graphic.

---

## 3. Production Evidence

| Vehicle | Production URL | Downloaded URL | Hash match local | Browser renders |
|---------|----------------|----------------|------------------|-----------------|
| Tata Tiago EV | https://evsavari.com/cars/tata-tiago-ev | `/images/cars/tata-tiago-ev/listing.webp` | ✅ MATCH | Placeholder text visible |
| Hyundai Kona Electric | https://evsavari.com/cars/hyundai-kona-electric | `/images/cars/hyundai-kona-electric/front.webp` | ✅ MATCH | Placeholder text visible |
| BYD Atto 3 | https://evsavari.com/cars/byd-atto-3 | `/images/cars/byd-atto-3/listing.webp` | ✅ MATCH | Placeholder text visible |
| Mahindra XUV400 | https://evsavari.com/cars/mahindra-xuv400 | `/images/cars/mahindra-xuv400/front.webp` | ✅ MATCH | Placeholder text visible |

All four layers (local → git → Vercel → browser) serve the **same placeholder bytes**.

---

## 4. Why previous sprints reported PASS

| Sprint | What it validated | Why it false-PASSed |
|--------|-------------------|---------------------|
| Sprint 1.2 (`media:certify:sprint12`) | Resolver returns `/images/cars/...` paths | Paths are correct; assets at those paths are placeholders |
| Recovery R1 (`media:certify:recovery-r1`) | Browser `naturalWidth > 0`, no `fallback-ev.svg` | Placeholder WebP renders at 1280×800 — technically "loads" but is not a vehicle photo |
| Commit `1732c33c` message | "sourced from verified Cloudinary delivery URLs" | Cloudinary URLs also return placeholder PNGs (see below) |

### Upstream Cloudinary is also placeholder artwork

Downloaded 2026-07-10:

- `.../tata-tiago-ev/hero` → 11,692 B PNG — text: `tata-tiago-ev · front`
- `.../tata-tiago-ev/listing-thumb` → 11,889 B PNG — text: `tata-tiago-ev · listing`

Evidence: `reports/media-audit/r1a-downloads/cloudinary-tiagoHero.png`, `cloudinary-tiagoListing.png`

### How placeholders were created

`scripts/lib/populateLocalCarMedia.mjs` → `writeGeneratedWebp()` renders an SVG:

```
<text>…${familySlug} · ${type}…</text>
<text>…${batchLabel}…</text>
```

When Wikimedia/Cloudinary seed fetch fails or seed is empty (`byd-atto-3: {}`, `mahindra-xuv400: {}` in `mediaCompletionSprintSeed.json`), the script writes these generated placeholders to `public/images/cars/<slug>/<type>.webp`.

---

## 5. Architecture Impact

| Area | Impact |
|------|--------|
| Frontend | **None** |
| Backend | **None** |
| Resolver / manifests / fallback | **None** — frozen; working as designed |
| Media architecture | **None** |
| **Image assets** | **Incorrect** — core slots need real photographs |

---

## 6. Required fix (assets only — not started)

Per stop condition: **findings presented first.**

Replace only these incorrect WebP files with licensed vehicle photographs:

**Per vehicle — front.webp, listing.webp, compare.webp** (12 files total)

Optional follow-up: rear/side/interior where provisioned in manifest.

Sources to use:
- Wikimedia Commons (see `scripts/lib/photoReplacementBatch5Seed.json` pattern)
- Verified Cloudinary only if assets are confirmed real photographs (current Cloudinary tier-1 slots are placeholders)

After asset replacement: redeploy, visually verify all four vehicles, no code changes.

---

## STOP

Investigation complete. Root cause = **wrong image assets**. No resolver, manifest, or architecture changes required.

Awaiting approval before replacing assets.
