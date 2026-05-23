# Tier-1 catalog audit — Alpha Stable v1 (pre–soft launch)

**Audit date:** 2026-05-20  
**Scope:** Top-traffic OEM families (Tata, MG, BYD, Mahindra, Hyundai) + tier-1 Cloudinary manifest  
**Method:** Code manifest review, `PRODUCTION_FAMILY_SLUGS`, `TIER1_MODEL_FAMILY_SLUGS`, frontend media pipeline, compare SEO slug coverage

---

## Executive summary

| Brand | Families in tier-1 index | Cloudinary manifest (production) | Compare readiness | Media readiness |
|-------|--------------------------|-----------------------------------|-------------------|-----------------|
| Tata | nexon-ev, punch-ev, curvv-ev, tiago-ev | 3/4 in manifest | High | Manifest OK for 3 |
| MG | comet-ev, zs-ev | 2/2 in manifest | High | Manifest OK |
| BYD | atto-3 | Not in manifest | Medium (API/SEO) | Placeholder/compare API only |
| Mahindra | be-6, xev-9e, xuv400 | 1/3 in manifest | Medium | Manifest OK for be-6 only |
| Hyundai | kona-electric | Not in manifest | Medium (SEO/guides) | API / placeholder |

**Production Cloudinary families (`PRODUCTION_FAMILY_SLUGS`):**  
`tata-nexon-ev`, `tata-punch-ev`, `tata-curvv-ev`, `mg-comet-ev`, `mg-zs-ev`, `mahindra-be-6`

---

## Severity legend

| Level | Meaning |
|-------|---------|
| P0 | Blocks soft launch for flagship URLs |
| P1 | Degrades trust; workaround exists (placeholder) |
| P2 | Data quality / ops backlog |

---

## Tata

| Slug | Manifest media | Compare image | Specs (typical) | Name quality | Issues |
|------|----------------|---------------|-----------------|--------------|--------|
| tata-nexon-ev | Yes | compare-thumb | API-dependent | Full names via `resolveFullDisplayName` | — |
| tata-punch-ev | Yes | compare-thumb | API-dependent | OK | — |
| tata-curvv-ev | Yes | compare-thumb | API-dependent | OK | — |
| tata-tiago-ev | No | Placeholder on compare | Range/price from API if present | Trim names risk “Mg Play” pattern if API short | **P1** No tier-1 assets; compare shows placeholder only |

**Missing fields (non-manifest):** tiago-ev — Cloudinary compare-thumb, listing-thumb, hero  
**Duplicate variants:** Review API for parent `tata-tiago-ev` vs trim slugs in listing aggregation  
**Prices:** Validate ex-showroom on API vs SEO `rankedVehicles` in compare guides

---

## MG

| Slug | Manifest media | Compare image | Specs | Name quality | Issues |
|------|----------------|---------------|-------|--------------|--------|
| mg-comet-ev | Yes | compare-thumb | API + manifest | OK (OEM casing) | — |
| mg-zs-ev | Yes | compare-thumb | API + manifest | OK | — |

**Compare readiness:** High — flagship compare `comet-ev-vs-tiago-ev` uses manifest for Comet  
**Media readiness:** High — CDN bypass rewrites legacy API URLs to Cloudinary

---

## BYD

| Slug | In production manifest | Compare image | Issues |
|------|------------------------|---------------|--------|
| byd-atto-3 | No | API URL or placeholder | **P1** Upload tier-1 assets or valid Cloudinary URLs in API |
| kia-ev6 (compare pair) | No | Placeholder | SEO compare pages reference; not in PRODUCTION_FAMILY_SLUGS |

**Missing fields:** Cloudinary family assets for `byd-atto-3`  
**Compare readiness:** Medium — editorial + ranked stubs work; live images depend on API  
**Fake placeholders:** Bare `compare-thumb` / CDN strings must not appear in API (sanitized in frontend)

---

## Mahindra

| Slug | Manifest media | Compare image | Issues |
|------|----------------|---------------|--------|
| mahindra-be-6 | Yes | compare-thumb | — |
| mahindra-xev-9e | No | API / placeholder | **P1** High-traffic SEO; no manifest |
| mahindra-xuv400 | No | API / placeholder | **P2** Common compare pair with Nexon |

**Battery/charging:** Often present on API `specifications`; verify on detail QA per variant  
**Variant duplication:** `filterComparableVariants` drops parent slug when trims exist — verify in admin catalog

---

## Hyundai

| Slug | Manifest media | Compare image | Issues |
|------|----------------|---------------|--------|
| hyundai-kona-electric | No | API / placeholder | **P1** Tier-1 index but no Cloudinary block |

**Compare readiness:** Medium for SEO guides; images not guaranteed without API Cloudinary URLs

---

## Cross-cutting findings

### Images

- **CDN:** `cdn.evsavari.com` offline — frontend rewrites to `res.cloudinary.com/dznvmumze` (see `media-governance.md`)
- **Bare tokens:** `hero`, `compare-thumb.jpg` blocked — no path 404s
- **Non–tier-1 /hero URLs:** Blocked on compare for non-production families

### Compare readiness

| Check | Status |
|-------|--------|
| `/compare` hub (localStorage 2–3 EVs) | OK |
| `/compare/:slug` SEO + catalog merge | OK with retry |
| `CompareVehicleCard` + score + pills | OK |
| Partial catalog (API down) | Editorial + retry UI |

### Data integrity

| Check | Status |
|-------|--------|
| `useMemo` before early return (compare SEO) | OK |
| Homepage error vs empty sections | OK (`sectionHasContent`) |
| `normalizeCar` on all catalog rows | OK |

---

## Recommended pre-launch actions

1. **P0:** Confirm Vercel `VITE_API_URL=https://evsavari-api.onrender.com` (not localhost)
2. **P1:** Upload Cloudinary assets for `byd-atto-3`, `hyundai-kona-electric`, `tata-tiago-ev` OR ensure API returns valid `res.cloudinary.com` compare URLs
3. **P1:** Purge `cdn.evsavari.com` from API database media fields
4. **P2:** Run `npm run media:audit --probe` against production API when backend stable
5. **P2:** Price/range spot-check for top 5 compare guides in `public/seo-data/`

---

## Verification commands

```bash
npm run media:audit
npm run build
npm run deploy:smoke
EVSAVARI_API_URL=https://evsavari-api.onrender.com npm run launch:validate
```
