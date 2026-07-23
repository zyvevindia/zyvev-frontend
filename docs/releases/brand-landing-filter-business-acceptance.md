# Business Acceptance Checklist — Brand Landing Filter Fix

**For:** Nitin (manual verification after deploy)  
**Prerequisite:** Deploy the `landingFilter.js` one-line fix to production, then verify live.

> **Supersession note (2026-07-23):** Manual checkbox rows below may remain blank as a historical template. Production brand-filter certification recorded **PASS** in `brand-landing-filter-certification.md` after the fix shipped in v2.0.0. Do not treat unchecked boxes as outstanding failures.

Fill **Actual** and **Result** on the live site after deploy. Pre-deploy Actuals are recorded where measured.

---

## Brand Pages

### `/brands/tata`

| Field | Value |
|-------|--------|
| **Expected** | Only Tata vehicles in the vehicle grid |
| **Actual (pre-deploy)** | 25 vehicles including Mahindra, BYD, Kia, Hyundai, MG, Mercedes — global ranking |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/mg`

| Field | Value |
|-------|--------|
| **Expected** | Only MG vehicles |
| **Actual (pre-deploy)** | Same global 25-vehicle list as Tata |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/mahindra`

| Field | Value |
|-------|--------|
| **Expected** | Only Mahindra vehicles |
| **Actual (pre-deploy)** | Same global 25-vehicle list |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/byd`

| Field | Value |
|-------|--------|
| **Expected** | Only BYD vehicles |
| **Actual (pre-deploy)** | Same global 25-vehicle list |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/hyundai`

| Field | Value |
|-------|--------|
| **Expected** | Only Hyundai vehicles |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/kia`

| Field | Value |
|-------|--------|
| **Expected** | Only Kia vehicles |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/bmw`

| Field | Value |
|-------|--------|
| **Expected** | Only BMW vehicles |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/brands/mercedes-benz`

| Field | Value |
|-------|--------|
| **Expected** | Only Mercedes-Benz vehicles |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

---

## Price Pages (regression — must not break)

### `/best-evs/under-10-lakh`

| Field | Value |
|-------|--------|
| **Expected** | Vehicles in the under-₹10 lakh segment only (price/intelligence filter) |
| **Actual (pre-deploy spot-check)** | 4 vehicles: Tiago EV, Comet EV, Punch EV, Windsor EV |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

### `/best-evs/under-15-lakh` (optional spot-check)

| Field | Value |
|-------|--------|
| **Expected** | Under-₹15 lakh segment vehicles only |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

---

## Use Case Pages (regression — must not break)

### `/best-evs/city`

| Field | Value |
|-------|--------|
| **Expected** | City-suitability ranked vehicles (intelligence filter), not the full unfiltered catalog |
| **Actual (pre-deploy spot-check)** | 3 vehicles: EC3, Windsor EV, Tigor EV |
| **Actual (post-deploy)** | _fill after deploy_ |
| **Result** | ☐ PASS / ☐ FAIL |

---

## Smoke (unchanged surfaces)

| Page | Expected | Actual (post-deploy) | Result |
|------|----------|----------------------|--------|
| `/` Home | Loads; SEO intact | _fill_ | ☐ |
| `/cars` Browse | Full catalog browse | _fill_ | ☐ |
| `/cars/tata-nexon-ev` Vehicle | Tata Nexon EV detail | _fill_ | ☐ |
| `/compare` Compare | Compare tool loads | _fill_ | ☐ |
| Guide (e.g. ownership guide) | Guide content loads | _fill_ | ☐ |

---

## Automated post-deploy gate

```bash
npm run landing:certify:brand-filter
```

| Check | Expected |
|-------|----------|
| Local | PASS |
| Production | PASS (zero foreign OEMs on all 8 brand hubs) |

---

## Sign-off

| Item | Status |
|------|--------|
| All brand pages show brand-only vehicles | ☐ |
| Price / use-case pages unchanged / correct | ☐ |
| Automated brand-filter cert PASS on production | ☐ |
| **Business Acceptance** | ☐ Approved by Nitin |

**Sprint 2 is accepted only after this checklist is signed.**
