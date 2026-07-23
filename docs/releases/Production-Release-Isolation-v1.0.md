# EVSavari Production Release Isolation v1.0

**Program:** Repository Stabilization — Phase 2  
**Mode:** Read-only analysis (this document only; no code/config/git changes)  
**Generated:** 2026-07-13  
**Git HEAD (committed):** `71b75f4c` — Sprint 1.6 EVSavari Lite v1.0  
**Branch:** `main` (in sync with `origin/main`; working tree dirty)  
**Production site:** https://evsavari.com  
**Phase 1 input:** [Production-Release-Inventory-v1.0.md](./Production-Release-Inventory-v1.0.md)

---

# Section 1 — Release Isolation Summary

| Release | Files | Independent | Depends On | Production Ready | Risk |
|---------|------:|:-------------:|------------|:----------------:|:----:|
| **R2.7.1** Brand Landing Filter Fix | **6** (1 prod + 1 script + 4 docs; `package.json` line shared) | **Deploy:** YES · **Commit:** YES (after baseline) | R2.1–R2.7 landing module on prod/git | **Ready — deploy first** | **HIGH** (P0 live bug) |
| **R2.1–R2.7** Production Baseline Synchronization | **~55** prod code (33 landing + 10 linkGraph + 12 modified/untracked SEO/routing) | **Deploy:** NO (partial) · **Commit:** YES (monolithic) | Catalog (read-only), existing SEO pipeline | **Deployed — uncommitted** | **MEDIUM** (split risk) |
| **R-MEDIA** Local WebP Asset Updates | **14** (12 WebP + 2 media resolver files) | **YES** | None runtime | **Ready** | **LOW** |
| **R-ANALYTICS** Analytics Foundation | **~22** (15 code + 1 cert script + 6 docs) | **Deploy:** YES · **Commit:** YES (`package.json` line shared) | Routes exist (R2.1–R2.7); `VITE_GA_ID` for activation | **Ready — not on prod** | **LOW** |
| **R-GEN** Generated SEO & Sitemaps | **158** (149 JSON + 8 sitemaps + manifest) | **YES** | Build/content scripts | **Optional commit** | **LOW** |
| **R-CERT** Certification & Release Engineering | **~35** (9 sprint scripts + ~26 cert reports; excludes R2.7.1/R-ANALYTICS certs) | **YES** | Nothing runtime | **Complete locally** | **LOW** |
| **R-DOCS** Architecture & Operational Documentation | **~28** (handbook, ADRs, analytics guides, recovery docs, register) | **YES** | Nothing runtime | **Complete locally** | **NONE** |
| **R-INV** Investigation / Probe Artifacts | **~40** (9 probe scripts + media-audit reports + misc) | **NO — exclude** | N/A | **BLOCKED** | **HIGH** if shipped |
| **R-SECRETS** Vercel Environment Exports | **2** | **NO — never ship** | N/A | **BLOCKED** | **CRITICAL** |
| **R-TEST** Playwright Test Artifacts | **5** | **NO — exclude** | N/A | **BLOCKED** | **LOW** |

**Working tree totals (deduplicated):** 363 unique files — 196 modified tracked, 169 untracked, 2 deleted traces.

**Isolation verdict:** Seven shippable release buckets (R2.7.1 through R-DOCS) can be committed and deployed in a validated sequence. Three buckets (R-INV, R-SECRETS, R-TEST) must never ship. Two files require explicit merge policy: `src/landing/filters/landingFilter.js` and `package.json`.

---

# Section 2 — Release Manifest

## R2.7.1 — Brand Landing Filter Fix

| Field | Detail |
|-------|--------|
| **Release ID** | R2.7.1 |
| **Release Name** | Brand Landing Filter Fix |
| **Business Purpose** | Brand hub pages must list only vehicles belonging to that OEM |
| **Architecture Components** | Landing Framework → Filter layer only (`landingFilter.js`) |
| **Files Modified** | `src/landing/filters/landingFilter.js` (line 43: `rankFamiliesForPreset(filtered, …)` not `families`) |
| **Files Created** | `scripts/brand-landing-filter-certification.mjs`; `docs/releases/brand-landing-filter-business-acceptance.md`; `docs/releases/brand-landing-filter-certification.md`; `docs/releases/brand-landing-filter-certification-2026-07-13.json`; `docs/releases/brand-landing-filter-fix-regression.md` |
| **Files Deleted** | None |
| **Pages Affected** | 8 brand landing hubs |
| **Routes Affected** | `/brands/tata`, `/brands/mg`, `/brands/mahindra`, `/brands/byd`, `/brands/hyundai`, `/brands/kia`, `/brands/bmw`, `/brands/mercedes-benz` |
| **Configuration Changes** | `package.json` — add `landing:certify:brand-filter` (shared file; see Section 4) |
| **Scripts** | `npm run landing:certify:brand-filter` |
| **Documentation** | BAT checklist + regression report (4 files under `docs/releases/`) |
| **Production Impact** | **High** — fixes cross-brand catalog leakage on all brand hubs |
| **Rollback Impact** | Revert one line; brand pages revert to showing global catalog |
| **Regression Risk** | **Low** — price/use-case landings use `intelligenceFilterIds`; unaffected path |
| **Manual Business Testing Required** | All 8 brand URLs + 2 price + 1 use-case spot checks |
| **Deployment Time Estimate** | **15–30 min** (deploy + cert re-run + Nitin BAT) |

---

## R2.1–R2.7 — Production Baseline Synchronization

| Field | Detail |
|-------|--------|
| **Release ID** | R2.1–R2.7 (single baseline commit; sub-sprints R2.1–R2.7 documented in register) |
| **Release Name** | Production Baseline Synchronization |
| **Business Purpose** | Align git with live Sprint 2 SEO foundation: technical SEO, 18 landing pages, link graph, optimization |
| **Architecture Components** | Landing Framework, SEO Engine, Metadata Engine, Canonical Engine, Schema Engine, Internal Link Graph, Routing, Section Registry, Vehicle Registry (read-only catalog) |
| **Files Modified** | `index.html`; `src/App.jsx`; `src/pages/discoveryRoutes.jsx`; `src/pages/CarDetails.jsx`; `src/pages/DiscoverySeoPage.jsx`; `src/seo/pageMetadata.js`; `src/seo/compareDiscoveryLinks.js`; `src/seo/internalLinks.js`; `src/seo/vehicleInternalLinks.js` |
| **Files Created (untracked)** | `src/landing/**` (33 files); `src/linkGraph/**` (10 files); `src/seo/seoConstants.js` |
| **Files Deleted** | None |
| **Pages Affected** | All Sprint 2 landing families + discovery SEO pages + vehicle detail SEO |
| **Routes Affected** | `/brands/:slug` (8); `/best-evs/:slug` (10: 4 price + 6 use-case); `/discover/:presetSlug`; existing `/cars/*`, compare, ownership guides |
| **Configuration Changes** | `index.html` — static SEO tag removal (R2.1) |
| **Scripts** | None in this release (cert scripts belong to R-CERT) |
| **Documentation** | None in this release (ADRs/handbook belong to R-DOCS) |
| **Production Impact** | **Already live** — commit restores reproducibility; no functional change if tree matches prod |
| **Rollback Impact** | **High** — would remove entire Sprint 2 surface from git history if reverted |
| **Regression Risk** | **Low** as monolithic commit; **Medium–High** if incorrectly split |
| **Manual Business Testing Required** | Sprint 2.7 page family matrix (re-verify after commit, not full re-deploy) |
| **Deployment Time Estimate** | **N/A deploy** (already on prod); **1–2 hr** git review + tag |

### R2.1–R2.7 sub-scope (informational; single commit)

| Sub-ID | Scope | Key paths |
|--------|-------|-----------|
| R2.1 | Technical SEO Foundation | `index.html`, `src/seo/pageMetadata.js` (partial) |
| R2.2 | Landing Framework | `src/landing/**` (core), `discoveryRoutes.jsx`, `App.jsx` |
| R2.3 | Brand Landings | `brandLandingDefinitions.js`, `buildBrandLandingConfig.js` |
| R2.4 | Price & Use Case Landings | `priceLandingDefinitions.js`, `useCaseLandingDefinitions.js` |
| R2.5 | Internal Link Graph | `src/linkGraph/**`, SEO link adapters, `DiscoverySeoPage.jsx` |
| R2.6 | SEO Optimization | `BuyingGuideSection.jsx`, `contentBlocks.js`, `seoConstants.js`, `pageMetadata.js` (partial), `CarDetails.jsx` (partial) |
| R2.7 | Final SEO Certification | Production state validated; cert artifacts in R-CERT |

---

## R-MEDIA — Local WebP Asset Updates

| Field | Detail |
|-------|--------|
| **Release ID** | R-MEDIA |
| **Release Name** | Local Vehicle WebP Asset Updates |
| **Business Purpose** | Correct listing/compare/front imagery for four vehicle families |
| **Architecture Components** | Media Engine (read-only consumers: `VehicleImage`, `vehicleMedia`) |
| **Files Modified** | `src/components/media/VehicleImage.jsx`; `src/utils/vehicleMedia.js` |
| **Files Created** | None |
| **Files Deleted** | None |
| **Files Modified (assets)** | 12 WebP under `public/images/cars/`: BYD Atto 3, Hyundai Kona Electric, Mahindra XUV400, Tata Tiago EV (listing, front, compare each) |
| **Pages Affected** | Browse cards, compare, vehicle detail for affected families |
| **Routes Affected** | `/cars/byd-atto-3`, `/cars/hyundai-kona-electric`, `/cars/mahindra-xuv400`, `/cars/tata-tiago-ev`, `/compare/*` involving those models |
| **Configuration Changes** | None |
| **Scripts** | None (Sprint 12 / recovery certs reference media; belong to R-CERT) |
| **Documentation** | Modified `docs/releases/sprint-12-media-certification.md` (optional with R-CERT or R-DOCS) |
| **Production Impact** | **Medium** — visual correctness on browse/detail/compare |
| **Rollback Impact** | Revert 14 files; fallback to Cloudinary/remote URLs |
| **Regression Risk** | **Low** |
| **Manual Business Testing Required** | 4 vehicle detail pages + browse grid + one compare page |
| **Deployment Time Estimate** | **20–30 min** |

---

## R-ANALYTICS — Analytics Foundation

| Field | Detail |
|-------|--------|
| **Release ID** | R-ANALYTICS |
| **Release Name** | Analytics Foundation (Pre–Sprint 3) |
| **Business Purpose** | Centralized, env-gated analytics ready for GA4/GTM activation |
| **Architecture Components** | Analytics Engine only (dispatcher, envelope, typed events, providers) |
| **Files Modified** | `src/analytics/config.js`, `events.js`, `index.js`, `init.js`, `track.js`; `src/content/tracking/discoveryAnalytics.js`; `docs/analytics/event-taxonomy.md` |
| **Files Created** | `src/analytics/categories.js`, `envelope.js`, `listeners.js`, `pageContext.js`, `session.js`; `src/analytics/providers/index.js`, `linkedin.js`, `meta.js`, `serverSide.js`; `scripts/analytics-foundation-certification.mjs`; `docs/releases/analytics-foundation-certification.md`; `docs/releases/analytics-foundation-certification-2026-07-12.json` |
| **Files Deleted** | None |
| **Pages Affected** | All SPA routes (via `page_view` and typed landing/vehicle events) |
| **Routes Affected** | All — no route table changes (`App.jsx` diff is R2.2 only, not analytics) |
| **Configuration Changes** | `package.json` — `analytics:certify:foundation` (shared); **manual** `VITE_GA_ID` on Vercel for activation |
| **Scripts** | `npm run analytics:certify:foundation` |
| **Documentation** | 7 guides under `docs/analytics/` (see R-DOCS); cert report in `docs/releases/` |
| **Production Impact** | **None until env + deploy** — tracking disabled when IDs absent |
| **Rollback Impact** | Remove analytics modules; no user-visible UI change |
| **Regression Risk** | **Low** |
| **Manual Business Testing Required** | GA4 Realtime after Vercel env set |
| **Deployment Time Estimate** | **30–45 min** (deploy + env + Realtime verification) |

---

## R-GEN — Generated SEO Data & Sitemaps

| Field | Detail |
|-------|--------|
| **Release ID** | R-GEN |
| **Release Name** | Generated SEO Content & Sitemaps |
| **Business Purpose** | Crawlable editorial JSON and sitemap index for discovery/authority/compare content |
| **Architecture Components** | SEO Engine (static JSON consumers); build pipeline |
| **Files Modified** | 149 JSON under `public/seo-data/`; 8 sitemap files; `src/content/generated/manifest.js` |
| **Files Created** | None (all modifications to tracked generated output) |
| **Files Deleted** | None |
| **Pages Affected** | All SEO discovery pages consuming `public/seo-data/` |
| **Routes Affected** | `/compare/*`, `/ownership-guides/*`, city pages, agent pages, authority hubs |
| **Configuration Changes** | None |
| **Scripts** | Regenerate via existing build/content scripts (prefer CI over committing timestamps) |
| **Documentation** | None |
| **Production Impact** | **Low** if only `generatedAt` metadata deltas |
| **Rollback Impact** | Regenerate from prior manifest or revert JSON batch |
| **Regression Risk** | **Low** when regenerated from same source scripts |
| **Manual Business Testing Required** | Spot-check 3 SEO pages + `/sitemap.xml` |
| **Deployment Time Estimate** | **10–20 min** (or skip commit; regenerate at build) |

---

## R-CERT — Certification & Release Engineering

| Field | Detail |
|-------|--------|
| **Release ID** | R-CERT |
| **Release Name** | Certification & Release Engineering |
| **Business Purpose** | Repeatable production certification harnesses for Sprint 2 and media recovery |
| **Architecture Components** | None runtime — release engineering only |
| **Files Modified** | `package.json` (sprint cert script entries — shared); `scripts/sprint-11-lead-production-verify.mjs` (**investigate** — likely R-INV; do not ship without review) |
| **Files Created** | `scripts/sprint-21-technical-seo-certification.mjs` through `sprint-27-final-seo-certification.mjs`; `scripts/recovery-r1-browser-media-certification.mjs`; ~26 JSON/MD cert reports under `docs/releases/sprint-*` and `recovery-r1-*` |
| **Files Deleted** | None |
| **Pages Affected** | None (validation only) |
| **Routes Affected** | None |
| **Configuration Changes** | `package.json` npm scripts: `seo:certify:sprint21`, `landing:certify:sprint22`–`26`, `seo:certify:sprint27`, `media:certify:recovery-r1` |
| **Scripts** | All `*:certify:sprint*` and `media:certify:recovery-r1` |
| **Documentation** | Sprint 21–27 certification MD/JSON; recovery-r1 cert reports |
| **Production Impact** | **None** |
| **Rollback Impact** | **None** |
| **Regression Risk** | **None** runtime |
| **Manual Business Testing Required** | None for deploy; run certs in Phase 3 |
| **Deployment Time Estimate** | **N/A** (git-only) |

---

## R-DOCS — Architecture & Operational Documentation

| Field | Detail |
|-------|--------|
| **Release ID** | R-DOCS |
| **Release Name** | Architecture Handbook, ADRs & Operational Guides |
| **Business Purpose** | Permanent SSOT for frozen architecture and ops runbooks |
| **Architecture Components** | Documented only — no runtime |
| **Files Modified** | `docs/releases/EVSavari-Lite-v1.0-Release-Notes.md` (incidental) |
| **Files Created** | `docs/architecture/EVSavari-Architecture-Handbook-v1.0.md`; ADRs (`adr-sprint-23` through `adr-sprint-27`, `adr-analytics-foundation`); `landing-page-framework.md`, `link-graph-engine.md`, `link-graph-relationship-matrix.md`, `sprint-2-architecture-compliance-statement.md`; 7 `docs/analytics/*` guides; `docs/releases/MASTER-RELEASE-REGISTER.md`; `docs/releases/Production-Release-Inventory-v1.0.md`; `docs/releases/sprint-2-seo-foundation-completion-report.md`; recovery forensics (`recovery-r1-root-cause-report.md`, `recovery-r1a-asset-forensics.md`, `recovery-r1b-asset-recovery.md`, `recovery-r1-media-certification.md`) |
| **Files Deleted** | None |
| **Pages Affected** | None |
| **Routes Affected** | None |
| **Configuration Changes** | None |
| **Scripts** | None |
| **Documentation** | This release **is** documentation |
| **Production Impact** | **None** |
| **Rollback Impact** | **None** |
| **Regression Risk** | **None** |
| **Manual Business Testing Required** | None |
| **Deployment Time Estimate** | **N/A** (git-only) |

---

## R-INV — Investigation / Probe Artifacts (Non-Release)

| Field | Detail |
|-------|--------|
| **Release ID** | R-INV |
| **Release Name** | Investigation & Probe Scripts |
| **Business Purpose** | **None — do not ship** |
| **Architecture Components** | N/A |
| **Files** | `scripts/_check-bundle.mjs`, `_compare-deploy-bundles.mjs`, `_inspect-kbod-deploy.mjs`, `_probe-bundle-turnstile.mjs`, `_probe-lead-bundle.mjs`, `_verify-prod-turnstile-state.mjs`, `turnstile-lead-production-verify.mjs`, `turnstile-probe.mjs`; `reports/media-audit/**` (~31 audit/download/screenshot files) |
| **Production Impact** | **Must not deploy** |
| **Action** | Delete or gitignore before any production commit |

---

## R-SECRETS — Vercel Environment Exports (Blocked)

| Field | Detail |
|-------|--------|
| **Release ID** | R-SECRETS |
| **Release Name** | Vercel Environment Exports |
| **Files** | `.env.vercel.kbod`, `.env.vercel.production` |
| **Action** | **Never commit.** Add to `.gitignore` in Phase 5 cleanup. Rotate any exposed credentials if ever staged. |

---

## R-TEST — Playwright Test Artifacts (Non-Release)

| Field | Detail |
|-------|--------|
| **Release ID** | R-TEST |
| **Release Name** | Playwright Test Artifacts |
| **Files** | `test-results/.last-run.json`; lead-loop trace/error files (4 entries; 2 deleted traces) |
| **Action** | Remove from tree; ensure `.gitignore` covers `test-results/` |

---

# Section 3 — Dependency Verification

## R2.7.1 — Brand Landing Filter Fix

| Question | Answer | Reason |
|----------|:------:|--------|
| Can this release be committed by itself? | **NO** (from current HEAD) / **YES** (after R2.1–R2.7 baseline) | `src/landing/filters/landingFilter.js` is untracked and the entire `src/landing/` module is absent from `71b75f4c`. A lone commit of one file leaves git non-reproducible. After baseline commit includes the landing tree, R2.7.1 can commit as a one-line fix **or** be absorbed into baseline if fix is already present. |
| Can this release be deployed by itself? | **YES** | Production already has the full landing module deployed. Only `landingFilter.js` needs updating. Verified fix: `rankFamiliesForPreset(filtered, …)` at line 43. Local cert PASS; production cert FAIL until deploy. |

## R2.1–R2.7 — Production Baseline Synchronization

| Question | Answer | Reason |
|----------|:------:|--------|
| Can this release be committed by itself? | **YES** | All Sprint 2 production code forms one coherent baseline. Monolithic commit matches production state. |
| Can this release be deployed by itself? | **NO** (partial) / **N/A** (full) | `src/landing/` (33 files) and `src/linkGraph/` (10 files) are untracked wholes — partial deploy of subsets would break routes. Full baseline is **already deployed** on evsavari.com; no incremental deploy required unless reproducing prod from git. |

## R-MEDIA

| Question | Answer | Reason |
|----------|:------:|--------|
| Committed alone? | **YES** | Asset + resolver changes have no code dependencies beyond existing media consumers. |
| Deployed alone? | **YES** | Static WebP + two resolver files; independent CDN/build deploy. |

## R-ANALYTICS

| Question | Answer | Reason |
|----------|:------:|--------|
| Committed alone? | **YES** | All changes under `src/analytics/` and bridge file; `package.json` script line can be staged with this commit via `git add -p` or included in same commit. |
| Deployed alone? | **YES** | Env-gated; no dependency on R2.7.1. Requires routes from R2.1–R2.7 (already on prod). GA4 activation requires manual `VITE_GA_ID` — not a code dependency. |

## R-GEN

| Question | Answer | Reason |
|----------|:------:|--------|
| Committed alone? | **YES** | Generated public assets only. |
| Deployed alone? | **YES** | Optional; can regenerate at build instead. |

## R-CERT

| Question | Answer | Reason |
|----------|:------:|--------|
| Committed alone? | **YES** | Scripts and reports only. |
| Deployed alone? | **YES** (N/A) | No runtime deployment. |

## R-DOCS

| Question | Answer | Reason |
|----------|:------:|--------|
| Committed alone? | **YES** | Documentation only. |
| Deployed alone? | **YES** (N/A) | No runtime deployment. |

## R-INV / R-SECRETS / R-TEST

| Question | Answer | Reason |
|----------|:------:|--------|
| Committed or deployed? | **NO** | Not production releases. Secrets must never enter git. Probes and test artifacts pollute history and may expose internals. |

---

# Section 4 — Release Boundaries

## Primary ownership rule

Every changed file belongs to **exactly one** release bucket, except files listed under **Shared Files** below.

## Shared Files

| File | Releases | Why shared | Resolution |
|------|----------|------------|:----------:|
| `src/landing/filters/landingFilter.js` | **R2.1–R2.7** (creates file) + **R2.7.1** (line 43 fix) | Entire landing module is new in baseline; filter bug fix is a delta on that same file | **A) Release merge** — Deploy R2.7.1 to prod first; include **fixed** file in R2.1–R2.7 baseline commit so git matches prod. Do **not** architectural refactor. |
| `package.json` | **R2.7.1**, **R-ANALYTICS**, **R-CERT** | Adds multiple `*:certify:*` npm scripts in one diff | **A) Release merge** — Stage script hunks with their owning release commits using `git add -p package.json`, or accept one `package.json` commit after all cert scripts land. Do **not** architectural refactor. |
| `src/seo/pageMetadata.js` | **R2.1** + **R2.6** (within R2.1–R2.7) | Incremental SEO metadata improvements across one file | **A) Release merge** — Commit with R2.1–R2.7 monolithic baseline. Not splittable without artificial history rewrite. |
| `src/pages/CarDetails.jsx` | **R2.1** + **R2.6** (within R2.1–R2.7) | Vehicle SEO title + family metadata | **A) Release merge** — Same as `pageMetadata.js`. |

**No shared file requires B) architectural refactoring.** All conflicts resolve via ordered commits and/or `git add -p`, not engine redesign.

## Boundary violations check

| Check | Result |
|-------|--------|
| Files assigned to zero releases | **0** — all 363 files mapped |
| Files assigned to multiple releases (excluding Shared Files) | **0** |
| Shared files documented with merge policy | **4** |
| R-INV / R-SECRETS / R-TEST excluded from shippable releases | **PASS** |

## Files requiring investigation before commit

| File | Current bucket | Note |
|------|----------------|------|
| `scripts/sprint-11-lead-production-verify.mjs` | R-INV (recommended) | Modified lead probe — verify intent before any commit |
| `docs/releases/sprint-12-media-certification.md` | R-CERT or R-DOCS | Incidental regen — pair with R-MEDIA or R-CERT |
| `reports/media-audit/**` | R-INV | Temporary audit artifacts — archive or gitignore |

---

# Section 5 — Deployment Sequence Validation

```
Release 1 ──► R2.7.1  Brand Landing Filter Fix
       ↓
Release 2 ──► R2.1–R2.7  Production Baseline Synchronization (git commit; prod already live)
       ↓
Release 3 ──► R-MEDIA  Local WebP Assets
       ↓
Release 4 ──► R-ANALYTICS  Analytics Foundation (+ Vercel env)
       ↓
Release 5 ──► R-GEN  Generated SEO & Sitemaps (optional)
       ↓
Release 6 ──► R-CERT  Certification Scripts & Reports
       ↓
Release 7 ──► R-DOCS  Architecture & Operational Documentation
```

### Why this order is safest

1. **R2.7.1 first** — P0 live bug: all `/brands/*` pages show global catalog. Smallest blast radius (one file); immediate business value; unblocks Sprint 2 BAT sign-off.

2. **R2.1–R2.7 second (git)** — Restores reproducibility while prod already matches. Including the R2.7.1 fix in baseline commit aligns git with post-hotfix prod. No redeploy required if tree matches.

3. **R-MEDIA third** — Independent visual assets; no coupling to analytics or generated JSON. Safe after functional baseline is verified.

4. **R-ANALYTICS fourth** — Measurement layer is env-gated and does not alter SEO/landing behavior. Deploy after core UX is correct so GA4 data reflects fixed brand filters.

5. **R-GEN fifth (optional)** — Timestamp-only JSON noise avoided until functional releases stable. Regenerating at build is acceptable alternative to commit.

6. **R-CERT sixth** — Cert scripts validate releases 1–5; zero runtime risk; enables Phase 3 per-release certification.

7. **R-DOCS last** — Handbook and ADRs document **as-deployed** state. No production dependency.

**Excluded from sequence:** R-INV, R-SECRETS, R-TEST — cleanup only, never deploy.

**Suggested git tag after Release 2:** `v2.0.0-seo-foundation`  
**Suggested git tag after Release 1 deploy + BAT:** `v2.0.1-brand-filter-hotfix`

---

# Section 6 — Business Acceptance Mapping

## R2.7.1 — Brand Landing Filter Fix

| URL | Expected Result | PASS Criteria |
|-----|-----------------|---------------|
| `/brands/tata` | Only Tata vehicles | No MG/BYD/Mahindra leakage |
| `/brands/mg` | Only MG vehicles | No cross-brand models |
| `/brands/mahindra` | Only Mahindra vehicles | No cross-brand models |
| `/brands/byd` | Only BYD vehicles | No cross-brand models |
| `/brands/hyundai` | Only Hyundai vehicles | No cross-brand models |
| `/brands/kia` | Only Kia vehicles | No cross-brand models |
| `/brands/bmw` | Only BMW vehicles | No cross-brand models |
| `/brands/mercedes-benz` | Only Mercedes-Benz vehicles | No cross-brand models |
| `/best-evs/under-10-lakh` (regression) | Price-filtered catalog | Correct price band; sort intact |
| `/best-evs/city` (regression) | Use-case ranked catalog | No empty/erroneous grid |

**Automated gate:** `npm run landing:certify:brand-filter` → PASS on production.

---

## R2.1–R2.7 — Production Baseline Synchronization

| URL | Expected Result | PASS Criteria |
|-----|-----------------|---------------|
| `/` | Home loads | No console errors; core nav works |
| `/cars` | Browse grid | Catalog renders |
| `/cars/tata-nexon-ev` | Vehicle detail | Metadata, schema, images |
| `/compare/nexon-ev-vs-mg-zs-ev` | Compare guide | SEO content + links |
| `/brands/tata` | Brand landing shell | Layout, hero, FAQ (filter fixed by R2.7.1) |
| `/best-evs/under-10-lakh` | Price landing | 4 price landings routable |
| `/best-evs/city` | Use-case landing | 6 use-case landings routable |
| `/ownership-guides/running-cost` | Ownership guide | Link graph internal links |
| `/discover/city` | Discover preset route | `DiscoverLandingPage` renders (not legacy Intelligence page) |
| `/sitemap.xml` | Sitemap index | Valid XML; child sitemaps reachable |

**Automated gate:** `npm run seo:certify:sprint27` → PASS (re-run post-baseline commit in Phase 3).

---

## R-MEDIA — Local WebP Assets

| URL | Expected Result | PASS Criteria |
|-----|-----------------|---------------|
| `/cars/tata-tiago-ev` | Local WebP hero/listing | `/images/cars/tata-tiago-ev/*` served |
| `/cars/byd-atto-3` | Local WebP | Correct front/listing/compare |
| `/cars/hyundai-kona-electric` | Local WebP | No broken image fallback |
| `/cars/mahindra-xuv400` | Local WebP | Compare page images load |
| `/cars` | Browse cards | Tiago/Kona/XUV400/Atto 3 cards show updated thumbs |

---

## R-ANALYTICS — Analytics Foundation

| Check | Method | PASS Criteria |
|-------|--------|---------------|
| SPA navigation | GA4 Realtime | `page_view` on route change |
| Brand landing | Navigate to `/brands/tata` | `landing_viewed` or typed landing event |
| Vehicle detail | `/cars/tata-nexon-ev` | `vehicle_view` or equivalent |
| Env absent | Prod without `VITE_GA_ID` | No tracking scripts in DOM (no regression) |
| No duplicate events | Realtime | Single `page_view` per navigation |

**Automated gate:** `npm run analytics:certify:foundation` → PASS with warnings until GA4 env set.

---

## R-GEN — Generated SEO & Sitemaps

| URL | Expected Result | PASS Criteria |
|-----|-----------------|---------------|
| `/compare/tata-nexon-ev-vs-mg-zs-ev` | Editorial JSON consumed | Content renders |
| `/ownership-guides/battery-health` | Authority content | No 404 on JSON fetch |
| `/sitemap.xml` | Index | Lists cars, compare, ownership, seo-pages |
| `/sitemaps/seo-pages.xml` | URL set | Contains discovery URLs |

---

## R-CERT — Certification & Release Engineering

| Check | Method | PASS Criteria |
|-------|--------|---------------|
| Sprint 21 cert | `npm run seo:certify:sprint21` | Script exits PASS |
| Sprint 22–26 certs | respective `landing:certify:sprint*` | Scripts run without import errors |
| Sprint 27 cert | `npm run seo:certify:sprint27` | PASS on production |
| Reports committed | Git diff | JSON/MD artifacts match script output dates |

---

## R-DOCS — Documentation

| Check | Method | PASS Criteria |
|-------|--------|---------------|
| Handbook completeness | Read `EVSavari-Architecture-Handbook-v1.0.md` | All frozen engines documented |
| Register accuracy | `MASTER-RELEASE-REGISTER.md` | Rows match Phase 2 release IDs |
| ADR index | `docs/architecture/adr-sprint-*` | Covers Sprints 2.3–2.7 + analytics |

---

# Section 7 — Commit Strategy

## R2.7.1

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `fix(landing): filter brand catalog before composite ranking on /brands/*` |
| **Commit scope** | `src/landing/filters/landingFilter.js`, `scripts/brand-landing-filter-certification.mjs`, brand BAT docs, `package.json` (brand-filter script hunk only) |
| **Expected files** | 6 (+ partial `package.json`) |
| **Commit size** | **Small** (~50 LOC prod change) |
| **Reviewer checklist** | Confirm `filtered` not `families` at rank call; price/use-case paths unchanged; cert script PASS locally; no other landing files in commit unless baseline merge policy applies |

## R2.1–R2.7

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `feat(seo): Sprint 2 production baseline — landing framework, link graph, SEO optimization` |
| **Commit scope** | Entire `src/landing/`, `src/linkGraph/`, modified SEO/routing files, `index.html`, `src/seo/seoConstants.js` |
| **Expected files** | ~55 |
| **Commit size** | **Large** |
| **Reviewer checklist** | Single landing framework; no duplicate SEO systems; all 18 landings registered; link graph adapters thin; matches prod behavior; includes post-R2.7.1 filter fix if prod hotfix deployed first |

## R-MEDIA

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `fix(media): prefer local WebP assets for four vehicle families` |
| **Commit scope** | 12 WebP + `VehicleImage.jsx` + `vehicleMedia.js` |
| **Expected files** | 14 |
| **Commit size** | **Medium** (binary weight) |
| **Reviewer checklist** | Local URL priority logic; no Cloudinary regression for other families; image dimensions acceptable |

## R-ANALYTICS

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `feat(analytics): centralized dispatcher, envelope, and GA4-ready foundation` |
| **Commit scope** | `src/analytics/**`, `discoveryAnalytics.js`, `event-taxonomy.md`, cert script + report, `package.json` analytics script hunk |
| **Expected files** | ~22 |
| **Commit size** | **Medium** |
| **Reviewer checklist** | Env-gated init; no duplicate `page_view`; extends existing engine; no route changes |

## R-GEN

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `chore(seo): sync generated seo-data and sitemaps` *(optional)* |
| **Commit scope** | `public/seo-data/**`, sitemaps, `manifest.js` |
| **Expected files** | 158 |
| **Commit size** | **Large** (mostly JSON timestamps) |
| **Reviewer checklist** | Prefer CI regen; if committing, verify content not semantic drift |

## R-CERT

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `docs(cert): Sprint 2.1–2.7 and recovery certification harnesses` |
| **Commit scope** | Sprint 21–27 scripts, recovery-r1 cert, cert reports, remaining `package.json` script hunks |
| **Expected files** | ~35 |
| **Commit size** | **Medium** |
| **Reviewer checklist** | No probe scripts; certs import correct modules; reports match run dates |

## R-DOCS

| Field | Recommendation |
|-------|----------------|
| **Commit title** | `docs(architecture): EVSavari Handbook v1.0, Sprint 2 ADRs, and analytics guides` |
| **Commit scope** | All `docs/architecture/*`, `docs/analytics/*`, register, inventory, recovery docs |
| **Expected files** | ~28 |
| **Commit size** | **Medium** |
| **Reviewer checklist** | Handbook matches frozen architecture; no engine redesign proposals; register current |

**Do not create commits in Phase 2.** Execute in Phase 3 after Nitin approval.

---

# Section 8 — Repository Cleanup Plan

## Classification

| Category | Examples | Count (approx.) | Recommendation |
|----------|----------|----------------:|----------------|
| **Production files** | `src/landing/`, `src/linkGraph/`, `src/analytics/`, modified pages/SEO | ~75 | **Remain tracked** — commit per release order |
| **Production assets** | `public/images/cars/*.webp` | 12 | **Remain tracked** — R-MEDIA |
| **Generated files** | `public/seo-data/**`, sitemaps, `manifest.js` | 158 | **Prefer CI regenerate**; optional tracked commit (R-GEN) |
| **Certification outputs** | `docs/releases/sprint-*-2026-*.json`, cert MD | ~30 | **Remain tracked** — R-CERT evidence |
| **Documentation** | Handbook, ADRs, analytics guides | ~28 | **Remain tracked** — R-DOCS |
| **Temporary reports** | `reports/media-audit/**` | ~31 | **Gitignore or move to archive** outside repo |
| **Investigation scripts** | `scripts/_*.mjs`, `turnstile-*` | 9 | **Delete or gitignore** — never track |
| **Machine-readable JSON (inventory)** | Phase 1/2 docs, register | 3 | **Remain tracked** |
| **Secrets** | `.env.vercel.*` | 2 | **Gitignore immediately**; never track |
| **Test artifacts** | `test-results/**` | 5 | **Gitignore**; delete local copies |

## `.gitignore` additions (Phase 5 — not executed now)

```
.env.vercel.*
reports/media-audit/
scripts/_*.mjs
scripts/turnstile-probe.mjs
scripts/turnstile-lead-production-verify.mjs
test-results/
```

## Archive candidates

| Path | Destination |
|------|-------------|
| `reports/media-audit/` | External archive (S3/drive) or delete after R-MEDIA BAT |
| Duplicate cert JSON dated 2026-07-10 vs 2026-07-13 | Keep latest per sprint; archive older in `docs/releases/archive/` (Phase 5) |

**Do not perform cleanup in Phase 2.**

---

# Section 9 — Definition of Done

Every production release must pass **all gates** before the next release starts:

| Gate | Requirement | Owner |
|------|-------------|-------|
| **Architecture Review** | Change touches only frozen engines; Handbook/ADR updated if engine contract changes | Engineering |
| **Technical Certification** | Automated cert script PASS for release scope | Engineering |
| **Regression Tests** | Prior sprint certs re-run where applicable (e.g. brand filter after landing changes) | Engineering |
| **Manual BAT** | Nitin verifies URLs in Section 6 for this release | Business |
| **Production Verification** | Post-deploy cert against https://evsavari.com PASS | Engineering |
| **Git Clean Working Tree** | `git status` empty except approved in-progress work | Engineering |
| **Tagged Release** | Git tag on approved commit; `MASTER-RELEASE-REGISTER.md` updated | Engineering + Business sign-off |

**Sequence rule:** Gate 7 (clean tree) must be true before **Planning** the next feature.

**Sprint 2 acceptance:** Blocked until R2.7.1 Manual BAT PASS + Production Verification PASS.

---

# Section 10 — Future Engineering Policy

This policy is **mandatory** for all work after repository stabilization:

```
One business feature
        ↓
One release (one row in MASTER-RELEASE-REGISTER)
        ↓
One commit (single scope; shared files resolved via add -p or merge policy)
        ↓
One deployment (Vercel production)
        ↓
One BAT (Nitin sign-off on defined URLs)
        ↓
One release tag (semver)
        ↓
Working tree clean (git status empty)
        ↓
Next feature
```

### Hard rules

1. **Never** accumulate multiple completed features uncommitted.
2. **Never** deploy without a matching commit (except documented hotfix → backport commit within 24h).
3. **Never** commit `.env*`, `test-results/`, `_probe*` scripts, or audit screenshots.
4. Every production bug → permanent regression cert (pattern: `landing:certify:brand-filter`).
5. Every engine change → ADR + Handbook update before merge.
6. Generated timestamp files → CI regeneration preferred over manual commits.
7. Shared files → documented merge policy; architectural refactoring is **not** a valid shortcut for release isolation.
8. Hotfix path: **Deploy → BAT → Commit → Tag** (R2.7.1 model).

---

# Phase 2 Completion

| Criterion | Status |
|-----------|--------|
| Every release has a manifest | **PASS** |
| Every dependency documented | **PASS** |
| Deployment order validated | **PASS** |
| BAT scope defined per release | **PASS** |
| Shared files identified with merge policy | **PASS** |
| Releases ready for Phase 3 | **PASS** (pending Nitin approval) |
| No source code changed in Phase 2 | **PASS** (this document only) |

---

# Stop Condition

Phase 2 complete. **No source files modified. No commits. No deploys. No branches. No physical isolation.**

**Awaiting Nitin approval before Phase 3 (Independent Certification per isolated release).**

---

*Isolation analysis derived from Phase 1 inventory, `git diff HEAD`, `git ls-files --others`, and production state on 2026-07-13.*
