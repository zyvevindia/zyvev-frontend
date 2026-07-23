# Brand Landing Filter Fix — Regression Report

**Date:** 2026-07-13  
**Status:** Fix implemented locally — **not deployed**  
**Sprint 2 acceptance:** Pending your Business Acceptance Testing

> **Supersession note (2026-07-23):** The “not deployed / pending BAT” status above was valid when this report was written. The filter fix was subsequently absorbed into **v2.0.0 Production Baseline** (`b1fb0985`), certified **PASS** via `docs/releases/brand-landing-filter-certification.md`, and verified on production. Historical status lines retained — do not treat as current deployment state.

---

## 1. Files Changed

| File | Change type |
|------|-------------|
| `src/landing/filters/landingFilter.js` | **Surgical bug fix** (1 argument) |
| `scripts/brand-landing-filter-certification.mjs` | **New** membership cert |
| `package.json` | npm script `landing:certify:brand-filter` |
| `docs/releases/brand-landing-filter-certification.md` | Cert report |
| `docs/releases/brand-landing-filter-certification-2026-07-13.json` | Machine-readable cert |
| `docs/releases/brand-landing-filter-fix-regression.md` | This report |
| `docs/releases/brand-landing-filter-business-acceptance.md` | BAT checklist |

**Not changed:** registries, routing, Landing Framework, Catalog, Link Graph, SEO, Media, Leads, analytics, rendering.

---

## 2. Exact Line Change

**File:** `src/landing/filters/landingFilter.js`

```diff
     const { ranked, fallbackNotice } = rankFamiliesForPreset(
-      families,
+      filtered,
       preset,
       { search }
     );
```

| Before | After |
|--------|-------|
| Line ~43: `rankFamiliesForPreset(families, …)` | Line ~43: `rankFamiliesForPreset(filtered, …)` |

---

## 3. Why This Change Was Necessary

Brand configs set `filters: { brand, sortBy: "composite" }`.

1. `filterCatalogFamilies` correctly builds `filtered` (brand-only).
2. Because `sortBy` is set, the ranking branch runs.
3. **Bug:** ranking received the **full catalog** (`families`), so brand filtering was discarded.
4. **Fix:** ranking receives **`filtered`**, so sort/rank stays within the brand set.

No redesign of ranking or filtering — same engines, correct input pool.

---

## 4. Regression Report (Sprint 2 certs)

| Suite | Result | Notes |
|-------|--------|-------|
| Sprint 2.1 Technical SEO | **PASS** | Unrelated to filter |
| Sprint 2.2 Landing Framework | **FAIL*** | Stale arch checks (expects empty registry; post-2.4 registry has entries). **Not caused by this fix.** |
| Sprint 2.3 Brand Landing | **FAIL*** | Arch check expects `registrySize === 8`; live registry is 18 after Sprint 2.4. **Brand page audits 8/8 PASS.** |
| Sprint 2.4 Price & Use Case | **PASS** | Price/use-case landings OK |
| Sprint 2.5 Link Graph | **PASS** | Unchanged |
| Sprint 2.6 SEO Optimization | **PASS** | Unchanged |
| Sprint 2.7 Final SEO | **PASS** | SEO Health 100/100 |
| Brand filter membership (local) | **PASS** | Source + logic proof |
| Brand filter membership (production) | **FAIL** | Expected — **fix not deployed yet**; live site still shows global catalog |

\* Stale certification assertions from Sprint 2.2/2.3, superseded by later sprints. Production brand shells, SEO, and page audits remain healthy.

### Sprint 2.3 brand page audits (production shell)

All 8 brand URLs: canonical, title, H1, landing shell, schema — **PASS** (membership correctness requires deploy + re-run `landing:certify:brand-filter`).

---

## 5. Updated Certification

| Artifact | Path |
|----------|------|
| Membership cert (MD) | `docs/releases/brand-landing-filter-certification.md` |
| Membership cert (JSON) | `docs/releases/brand-landing-filter-certification-2026-07-13.json` |
| Command | `npm run landing:certify:brand-filter` |

**Rule:** every vehicle card on `/brands/:slug` must match landing brand; any foreign OEM → immediate FAIL.

**Production brands certified (registry):** tata, mahindra, mg, hyundai, byd, kia, bmw, mercedes-benz.

**Note:** Citroën and Maruti are **not** production brand hubs (no `/brands/citroen` or `/brands/maruti` in registry). They appear only as catalog vehicles on other landings.

---

## 6. Deploy Gate

| Gate | Status |
|------|--------|
| Local filter fix verified | **PASS** |
| Existing Sprint 2 SEO / landing / link graph | **PASS** (2.2/2.3 arch noise only) |
| Production brand membership | **FAIL until deploy** |
| Deploy | **Blocked** — wait for your BAT approval after you deploy |
| Sprint 2 “accepted” | **Not marked complete** — awaits your approval |

### After you deploy

```bash
npm run landing:certify:brand-filter
```

Expect: Local PASS + Production PASS (Tata-only vehicles on `/brands/tata`, etc.).

Then complete the Business Acceptance Checklist.

---

## Stop Condition

- Fix is in the working tree only.
- **No deploy performed by this agent.**
- Sprint 2 is **not** marked accepted.
- Awaiting your manual Business Acceptance after deploy.
