# Brand Landing Filter Membership Certification

**Generated:** 2026-07-13T05:18:15.635Z  
**Site:** https://evsavari.com  
**Verdict:** **PASS**

## Fix

`rankFamiliesForPreset(filtered, ...)` in `src/landing/filters/landingFilter.js` — ranking operates on the already brand-filtered set.

## Local — must PASS before deploy

| Check | Result | Pass |
|-------|--------|------|
| source-ranks-filtered-set | rankFamiliesForPreset(filtered, ...) present | ✓ |
| tata | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| mahindra | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| mg | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| hyundai | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| byd | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| kia | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| bmw | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| mercedes-benz | Bug pattern confirmed: ranking full catalog leaks other OEMs | ✓ |
| regression-sortBy-keeps-brand | Fixed path = Tata only; buggy path would include Mahindra | ✓ |

## Production — all 8 brand hubs

| Path | Expected | Cards | Foreign | Pass |
|------|----------|-------|---------|------|
| /brands/tata | Tata | 6 | — | ✓ |
| /brands/mahindra | Mahindra | 3 | — | ✓ |
| /brands/mg | MG | 3 | — | ✓ |
| /brands/hyundai | Hyundai | 3 | — | ✓ |
| /brands/byd | BYD | 2 | — | ✓ |
| /brands/kia | Kia | 1 | — | ✓ |
| /brands/bmw | BMW | 1 | — | ✓ |
| /brands/mercedes-benz | Mercedes-Benz | 2 | — | ✓ |

## Rule

For every rendered vehicle on `/brands/:slug`: vehicle brand must match landing brand. Fail immediately on any foreign OEM.

**Note:** Citroën and Maruti are not production brand landing hubs (registry has Tata, Mahindra, MG, Hyundai, BYD, Kia, BMW, Mercedes-Benz).
