# Tier-1 media completion roadmap

**Goal:** Tier-1 EV media completeness **>85%** (hero, compare, listing, gallery on Cloudinary manifest).

**Sprint:** Public Beta Trust & Authority  
**Last updated:** 2026-05-20

---

## Priority families (traffic-first)

| Family | Hero | Compare | Listing | Gallery | Owner |
|--------|------|---------|---------|---------|-------|
| tata-nexon-ev | | | | | Media ops |
| tata-punch-ev | | | | | Media ops |
| tata-tiago-ev | | | | | Media ops |
| mg-comet-ev | | | | | Media ops |
| byd-atto-3 | | | | | Media ops |
| mahindra-xuv400 | | | | | Media ops |
| tata-curvv-ev | | | | | Media ops |
| mg-windsor-ev | Pending catalog | — | — | — | Blocked on API |

Track live scores on `/admin/media-health` and `/admin/tier1-experience`.

---

## Completion criteria

1. **Hero** — Cloudinary URL, not placeholder, ≥1200px width where possible  
2. **Compare thumbnail** — Consistent aspect, no legacy `cdn.evsavari.com`  
3. **Listing thumbnail** — Used on cards and discovery  
4. **Gallery** — Minimum 3 production angles per family  

**READY** = all four roles `ok` in manifest audit (≥75% role completeness).

---

## Weekly cadence

1. Export media health CSV from `/admin/media-health`  
2. Fix highest-traffic family with lowest `completenessPercent`  
3. Re-run `npm run build` after manifest JSON updates  
4. Verify on mobile compare + detail (no broken 404, no placeholder flash)

---

## Known blockers

- Manifest coverage ~46% of legacy tier-1 list — expand `productionFamilies` manifest  
- API may still store legacy CDN URLs — purge in backend media fields  
- MG Windsor — add catalog + manifest when OEM assets land  

---

## Beta gate

Do not mark tier-1 **PREMIUM_READY** on `/admin/tier1-experience` until image completeness ≥75% for that family.
