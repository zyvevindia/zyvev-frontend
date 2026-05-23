# Tier-1 media status — soft launch

**Last updated:** 2026-05-20  
**Dashboard:** `/admin/media-health`  
**Manifest families:** `PRODUCTION_FAMILY_SLUGS` in `src/media/productionFamilies.js`

---

## Deterministic scoring (admin dashboard)

Each tier-1 family receives **READY**, **PARTIAL**, or **NEEDS_REVIEW**:

| Status | Criteria |
|--------|----------|
| **READY** | In manifest; ≥75% role completeness; hero + compare + listing OK; no placeholders |
| **PARTIAL** | In manifest; ≥50% completeness; at least hero or compare OK |
| **NEEDS_REVIEW** | Not in manifest, or critical roles missing |

Live matrix: `/admin/media-health`

---

## Summary

| Metric | Value |
|--------|-------|
| Tier-1 families (OEM audit) | 13 |
| Cloudinary manifest coverage | 6/13 (**46%**) |
| Production manifest slugs | `tata-nexon-ev`, `tata-punch-ev`, `tata-curvv-ev`, `mg-comet-ev`, `mg-zs-ev`, `mahindra-be-6` |
| Missing manifest (P1) | `tata-tiago-ev`, `mahindra-xev-9e`, `mahindra-xuv400`, `byd-atto-3`, `hyundai-kona-electric` |

**Avg role completeness (manifest rows only):** ~46% across all tier-1 slugs; **100%** for the six production manifest families when hero, compare-thumb, listing-thumb, and gallery slots are populated in Cloudinary.

---

## Per-OEM status

### Tata

| Family | Manifest | Hero | Compare | Listing | Gallery |
|--------|----------|------|---------|---------|---------|
| tata-nexon-ev | Yes | OK | OK | OK | OK |
| tata-punch-ev | Yes | OK | OK | OK | OK |
| tata-curvv-ev | Yes | OK | OK | OK | OK |
| tata-tiago-ev | **No** | Gap | Gap | Gap | Gap |

### MG

| Family | Manifest | Hero | Compare | Listing | Gallery |
|--------|----------|------|---------|---------|---------|
| mg-comet-ev | Yes | OK | OK | OK | OK |
| mg-zs-ev | Yes | OK | OK | OK | OK |

### Mahindra

| Family | Manifest | Hero | Compare | Listing | Gallery |
|--------|----------|------|---------|---------|---------|
| mahindra-be-6 | Yes | OK | OK | OK | OK |
| mahindra-xev-9e | **No** | Gap | Gap | Gap | Gap |
| mahindra-xuv400 | **No** | Gap | Gap | Gap | Gap |

### BYD

| Family | Manifest | Hero | Compare | Listing | Gallery |
|--------|----------|------|---------|---------|---------|
| byd-atto-3 | **No** | Gap | Gap | Gap | Gap |

### Hyundai

| Family | Manifest | Hero | Compare | Listing | Gallery |
|--------|----------|------|---------|---------|---------|
| hyundai-kona-electric | **No** | Gap | Gap | Gap | Gap |

---

## Placeholder policy

- Frontend **never** requests `cdn.evsavari.com` (rewrite or drop).
- Missing assets show **text placeholder** in compare/listing — no bogus `<img>` 404s.
- API-stored legacy CDN URLs should be purged in backend (ops).

---

## Actions before soft launch

| Priority | Action |
|----------|--------|
| P0 | Confirm live Cloudinary URLs return 200 for six manifest families (`npm run launch:validate` or `/admin/system-status`) |
| P1 | Upload tier-1 blocks for `tata-tiago-ev`, `byd-atto-3`, `hyundai-kona-electric` OR ensure API returns valid `res.cloudinary.com` URLs |
| P2 | Add `mahindra-xev-9e`, `mahindra-xuv400` to manifest after asset upload |

---

## Verification

```bash
npm run launch:validate
# Browser: /admin/media-health → Probe API tier-1 slugs
```
