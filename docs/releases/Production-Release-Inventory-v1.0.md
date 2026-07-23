# EVSavari Production Release Inventory v1.0

**Program:** Repository Stabilization — Phase 1  
**Mode:** Read-only analysis (no code/docs changes except this inventory)  
**Generated:** 2026-07-13  
**Git HEAD (committed):** `71b75f4c` — Sprint 1.6 EVSavari Lite v1.0  
**Branch:** `main` (in sync with `origin/main`; working tree dirty)  
**Production site:** https://evsavari.com

---

# Section 1 — Executive Summary

## Inventory counts (working tree vs `71b75f4c`)

| Metric | Count | Notes |
|--------|------:|-------|
| **Git status entries (porcelain lines)** | **285** | Includes directory entries (`?? src/landing/`) |
| **Unique files accounted for** | **363** | Modified + untracked + deleted (deduplicated) |
| **Modified (tracked)** | **196** | `git diff --name-only HEAD` |
| **New / untracked** | **167** | `git ls-files --others --exclude-standard` |
| **Deleted** | **2** | Playwright trace artifacts under `test-results/` |

## By category (363 unique files)

| Category | Files | Owner release(s) |
|----------|------:|------------------|
| Generated SEO JSON (`public/seo-data/`) | 149 | R-GEN |
| Documentation (`docs/`) | 56 | R-CERT, R-DOCS, R-DOCS-ANALYTICS, R-RECOVERY-R1 |
| Landing Framework (`src/landing/`) | 33 | R2.2–R2.4, R2.6, **R2.7.1** |
| Analytics (`src/analytics/` + bridge) | 14 | R-ANALYTICS |
| Link Graph (`src/linkGraph/`) | 10 | R2.5 |
| Certification scripts (`scripts/sprint-*`, brand-filter, analytics-foundation) | 10 | R-CERT |
| Local media WebP (`public/images/cars/`) | 12 | R-MEDIA |
| Generated sitemaps | 8 | R-GEN |
| SEO production code (modified `src/seo/`, pages) | 5 | R2.1, R2.6 |
| Investigation / probe scripts | 9 | R-INV (do not ship) |
| Pages & routing (modified) | 4 | R2.1–R2.5 |
| Test artifacts | 4 | R-TEST (do not commit) |
| Secrets | 2 | **BLOCKED** |
| Other (index.html, package.json, manifest.js, misc) | 43 | **Mixed / Shared** |

## Subtotals for deliverable types

| Type | Approx. count |
|------|---------------|
| **Production code files** | **~75** (`src/` modified + untracked engines) |
| **Documentation files** | **~56** (changed/new under `docs/`) |
| **Certification files** | **~47** (scripts + cert JSON/MD in `docs/releases/`) |
| **Scripts (total changed/new)** | **~19** |
| **Assets (WebP)** | **12** |
| **Generated public assets** | **157** (seo-data + sitemaps) |
| **Reports / investigation** | **~9** scripts + recovery docs |

## Repository health (summary)

Production is **ahead of git**: Sprint 2 capabilities are live on evsavari.com but **not committed**. A **critical brand-filter bug** is live on production; fix exists locally (**R2.7.1**) but is **not deployed**. Secrets and test artifacts are present locally and must never ship.

**Overall:** High functional value delivered; **low repository hygiene** until Phase 2 isolation commits complete.

---

# Section 2 — Repository Health Assessment

| Dimension | Assessment | Score (0–10) |
|-----------|------------|:------------:|
| **Repository cleanliness** | 363 uncommitted files; mixed sprints in one working tree | **3** |
| **Working tree status** | Dirty; no staged isolation | **2** |
| **Commit status** | HEAD = Sprint 1.6 only; ~6 months of Sprint 2 work uncommitted | **2** |
| **Deployment status** | Production has Sprint 2.1–2.7; missing R2.7.1 + R-ANALYTICS | **6** |
| **Production ↔ git sync** | **Severe drift** — deploys not traceable to commits | **2** |
| **Git ↔ remote sync** | `main` == `origin/main` (no unpushed commits; all drift is local uncommitted) | **8** |
| **Risk level** | **HIGH** — cannot rollback/reproduce production from git; live brand bug | **—** |
| **Technical debt** | Cert script stale checks; generated file noise; investigation scripts in tree | **5** |
| **Architecture compliance** | Frozen engines respected in code; no parallel SEO/landing systems detected | **9** |

### **Overall Repository Health Score: 38 / 100**

**Explanation:** Engineering quality on architecture is strong, but **release engineering discipline** is broken: multiple completed initiatives share one dirty tree, production cannot be rebuilt from `main`, and a P0 filter bug remains on production until R2.7.1 deploys.

---

# Section 3 — Release Candidate Discovery

| Release ID | Name | Discovered from | Prod deployed? | Git committed? |
|------------|------|-----------------|:--------------:|:--------------:|
| **R2.1** | Technical SEO Foundation | `index.html`, `src/seo/pageMetadata.js`, SEO pipeline | Yes | No |
| **R2.2** | Landing Framework | `src/landing/*` (33 files, untracked) | Yes | No |
| **R2.3** | Brand Landing Pages | `brandLandingDefinitions.js`, registry | Yes | No |
| **R2.4** | Price & Use Case Landings | `priceLandingDefinitions.js`, `useCaseLandingDefinitions.js` | Yes | No |
| **R2.5** | Internal Link Graph | `src/linkGraph/*`, link adapter thin-down | Yes | No |
| **R2.6** | SEO Optimization & Content | `BuyingGuideSection`, `contentBlocks`, `seoConstants` | Yes | No |
| **R2.7** | Final SEO / GSC Certification | Sprint 2.7 cert scripts + reports | Yes (SEO) | No |
| **R2.7.1** | Brand Landing Filter Fix | `landingFilter.js` line 43: `filtered` not `families` | **No** | No |
| **R-ANALYTICS** | Analytics Foundation | `src/analytics/*` extensions, guides | **No** | No |
| **R-MEDIA** | Local WebP Asset Updates | 12 files under `public/images/cars/` | Partial | No |
| **R-GEN** | Generated SEO & Sitemaps | 149 `seo-data` + 8 sitemap files (mostly `generatedAt` deltas) | Yes (via build) | No |
| **R-CERT** | Certification & Release Engineering | 10 sprint cert scripts + npm scripts in `package.json` | N/A | No |
| **R-DOCS** | Architecture Handbook & ADRs | `EVSavari-Architecture-Handbook-v1.0.md`, sprint ADRs | N/A | No |
| **R-DOCS-ANALYTICS** | Analytics operational guides | 7 new guides under `docs/analytics/` | N/A | No |
| **R-RECOVERY-R1** | Media Recovery R1 | recovery-r1 docs + cert script | Partial | No |
| **R-INV** | Investigation / Probe Scripts | `_probe-*`, `_inspect-*`, turnstile probes | **Do not release** | No |
| **R-SECRETS** | Vercel env exports | `.env.vercel.kbod`, `.env.vercel.production` | **NEVER** | No |
| **R-TEST** | Playwright test artifacts | `test-results/*` modified/deleted | N/A | No |

---

# Section 4 — Release Candidate Details

## R2.7.1 — Brand Landing Filter Fix (P0)

| Field | Detail |
|-------|--------|
| **Business purpose** | Brand pages must show only that OEM’s vehicles |
| **Business value** | Restores trust on `/brands/*`; fixes live data bug |
| **Architecture touched** | Landing Filter only (`landingFilter.js`) |
| **Files changed** | 1 production: `src/landing/filters/landingFilter.js` |
| **Files created** | `scripts/brand-landing-filter-certification.mjs`, BAT docs |
| **Routes** | `/brands/*` (8 URLs) |
| **Dependencies** | Requires R2.2 landing module in repo |
| **Production impact** | **High** — fixes wrong vehicles on all brand hubs |
| **Regression risk** | **Low** — one-line pool change; price/use-case use `intelligenceFilterIds` |
| **Manual testing** | All 8 brand URLs + 2 price + 1 use-case spot checks |
| **Deploy complexity** | **Low** — single file |
| **Rollback** | Revert one line |
| **Readiness** | **Ready to deploy** (local cert PASS; prod cert FAIL until deploy) |
| **Est. duration** | 15–30 min incl. BAT |

---

## R2.1 — R2.7 — Sprint 2 SEO Foundation Bundle

| Field | Detail |
|-------|--------|
| **Business purpose** | Complete SEO foundation: technical SEO, landings, link graph, optimization |
| **Business value** | Organic discovery, 18 landing pages, internal linking, certified metadata/schema |
| **Architecture touched** | Landing Framework, SEO Engine, Metadata, Schema, Link Graph, Routing (adapters) |
| **Production code (untracked)** | `src/landing/` (33), `src/linkGraph/` (10), `src/seo/seoConstants.js` |
| **Production code (modified)** | `src/App.jsx`, `src/pages/discoveryRoutes.jsx`, `CarDetails.jsx`, `DiscoverySeoPage.jsx`, `src/seo/pageMetadata.js`, legacy link adapters, `VehicleImage.jsx`, `vehicleMedia.js`, `index.html` |
| **Routes** | `/brands/:slug`, `/best-evs/:slug`, existing discovery routes |
| **Dependencies** | Catalog (read-only), existing SEO pipeline |
| **Production impact** | Already live; commit restores reproducibility |
| **Regression risk** | **Medium** if split wrong; **Low** as single baseline commit |
| **Manual testing** | Sprint 2.7 page family matrix |
| **Deploy complexity** | **Medium** — large surface; already on prod |
| **Readiness** | Deployed; **uncommitted** |
| **Est. duration** | Git commit + tag: 1–2 hr review |

---

## R-ANALYTICS — Analytics Foundation

| Field | Detail |
|-------|--------|
| **Business purpose** | Centralized analytics ready for GA4/GTM activation |
| **Business value** | Measure landings, leads, compare before Sprint 3 content |
| **Architecture touched** | Analytics Engine only (provider dispatcher, envelope, typed page views) |
| **Files** | 9 new + 5 modified under `src/analytics/`; `discoveryAnalytics.js` bridge; `package.json` script |
| **Routes** | All (SPA `page_view`) |
| **Dependencies** | None for code; **VITE_GA_ID** manual for activation |
| **Production impact** | None until env + deploy |
| **Regression risk** | **Low** — env-gated; no tracking when IDs absent |
| **Manual testing** | GA4 Realtime after env set |
| **Deploy complexity** | **Low–Medium** |
| **Readiness** | Code ready; **not on production** |
| **Est. duration** | 30 min deploy + GA4 setup (manual) |

---

## R-GEN — Generated SEO Data & Sitemaps

| Field | Detail |
|-------|--------|
| **Business purpose** | Crawlable editorial JSON + sitemap index |
| **Files** | 149 `public/seo-data/*.json`, 8 sitemap files, `src/content/generated/manifest.js` |
| **Production impact** | Low if only `generatedAt` changed |
| **Regression risk** | **Low** if regenerated from same scripts |
| **Deploy independently?** | **YES** (optional; can regenerate at build) |
| **Readiness** | Optional commit or CI regenerate |

---

## R-MEDIA — Local WebP Assets

| Field | Detail |
|-------|--------|
| **Business purpose** | Updated listing/compare/front images for 4 families |
| **Files** | 12 WebP: BYD Atto 3, Hyundai Kona, Mahindra XUV400, Tata Tiago EV |
| **Architecture** | Media Resolver (read-only consumers) |
| **Deploy independently?** | **YES** |
| **Readiness** | Uncommitted; may already be partially on CDN/prod |

---

## R-CERT — Certification & Release Engineering

| Field | Detail |
|-------|--------|
| **Business purpose** | Repeatable production certification harnesses |
| **Files** | `scripts/sprint-21` through `sprint-27`, `brand-landing-filter`, `analytics-foundation`; ~37 cert reports in `docs/releases/` |
| **Deploy independently?** | **YES** (no runtime impact) |
| **Readiness** | Complete locally |

---

## R-DOCS / R-DOCS-ANALYTICS

| Field | Detail |
|-------|--------|
| **Purpose** | Architecture Handbook v1.0, ADRs, analytics activation guides |
| **Deploy independently?** | **YES** |
| **Production impact** | None |

---

## R-INV / R-SECRETS / R-TEST (Non-releases)

| ID | Action |
|----|--------|
| **R-INV** | Delete or gitignore investigation scripts before any commit |
| **R-SECRETS** | **Never commit** `.env.vercel.*` |
| **R-TEST** | Remove from tree; ensure `.gitignore` covers `test-results/` |

---

# Section 5 — File Ownership Matrix

Every changed file belongs to **exactly one** release bucket below. Individual paths follow the pattern shown; full list = 363 files matching these patterns.

## Production code

| File / pattern | Owner | Reason |
|----------------|-------|--------|
| `src/landing/filters/landingFilter.js` | **R2.7.1** | Brand filter fix (line 43) |
| `src/landing/**` (except filter fix attribution above — register with R2.2) | **R2.2–R2.4, R2.6** | Landing Framework + landings + content blocks |
| `src/linkGraph/**` | **R2.5** | Link graph engine |
| `src/seo/seoConstants.js` | **R2.6** | Year-aware SEO titles |
| `src/seo/pageMetadata.js` | **R2.1, R2.6** | **Mixed** — metadata builders span 2.1 + 2.6; commit with R2 bundle |
| `src/seo/compareDiscoveryLinks.js`, `internalLinks.js`, `vehicleInternalLinks.js` | **R2.5** | Thin adapters to link graph |
| `src/pages/discoveryRoutes.jsx` | **R2.2** | LandingRouter wiring |
| `src/pages/CarDetails.jsx` | **R2.1, R2.6** | **Mixed** — vehicle SEO + family title |
| `src/pages/DiscoverySeoPage.jsx` | **R2.5** | Guide link graph context |
| `src/App.jsx` | **R2.2, R-ANALYTICS** | **Mixed** — routes + `trackPageView`; split impossible without refactor — **ship with later of two or combined commit** |
| `src/analytics/**` (new modules) | **R-ANALYTICS** | Analytics foundation |
| `src/analytics/config.js`, `events.js`, `init.js`, `track.js`, `index.js` | **R-ANALYTICS** | Modified for dispatcher/envelope |
| `src/content/tracking/discoveryAnalytics.js` | **R-ANALYTICS** | Guide → GA4 bridge |
| `src/components/media/VehicleImage.jsx`, `src/utils/vehicleMedia.js` | **R-MEDIA** | Media resolution (may overlap recovery) |
| `index.html` | **R2.1** | Static SEO removal |

## Generated & assets

| File / pattern | Owner | Reason |
|----------------|-------|--------|
| `public/seo-data/**` | **R-GEN** | Generated editorial JSON |
| `public/sitemap*.xml`, `public/sitemaps/**`, `sitemap-manifest.json` | **R-GEN** | Build output |
| `src/content/generated/manifest.js` | **R-GEN** | Content manifest |
| `public/images/cars/**` (12 webp) | **R-MEDIA** | Local asset updates |

## Scripts

| File | Owner | Reason |
|------|-------|--------|
| `scripts/sprint-21-*` … `sprint-27-*` | **R-CERT** | Sprint certification |
| `scripts/brand-landing-filter-certification.mjs` | **R2.7.1** | Brand filter cert |
| `scripts/analytics-foundation-certification.mjs` | **R-ANALYTICS** | Analytics cert |
| `scripts/recovery-r1-*` | **R-RECOVERY-R1** | Media recovery |
| `scripts/_*.mjs`, `turnstile-*`, `_probe-*` | **R-INV** | Investigation — do not ship |
| `scripts/sprint-11-lead-production-verify.mjs` (modified) | **Investigation Required** | Lead probe — verify intent |

## Documentation

| File / pattern | Owner | Reason |
|----------------|-------|--------|
| `docs/architecture/EVSavari-Architecture-Handbook-v1.0.md` | **R-DOCS** | Handbook v1.0 |
| `docs/architecture/adr-sprint-*`, link-graph docs | **R-DOCS** | ADRs |
| `docs/analytics/*` (new guides) | **R-DOCS-ANALYTICS** | GA4/GTM guides |
| `docs/releases/sprint-*` | **R-CERT** | Certification evidence |
| `docs/releases/brand-landing-filter-*` | **R2.7.1** | Filter fix BAT/regression |
| `docs/releases/analytics-foundation-*` | **R-ANALYTICS** | Analytics cert |
| `docs/releases/recovery-r1-*` | **R-RECOVERY-R1** | Recovery program |
| `docs/analytics/event-taxonomy.md` (modified) | **R-ANALYTICS** | Taxonomy update |
| `docs/releases/EVSavari-Lite-v1.0-Release-Notes.md`, `sprint-12-media-certification.md` (modified) | **Investigation Required** | May be incidental regen |

## Blocked / do not commit

| File | Owner | Reason |
|------|-------|--------|
| `.env.vercel.kbod`, `.env.vercel.production` | **R-SECRETS** | Credentials |
| `test-results/**` | **R-TEST** | CI artifacts |

## Mixed / Shared (explicit)

| File | Releases | Why |
|------|----------|-----|
| `package.json` | R-CERT, R2.7.1, R-ANALYTICS | Adds multiple `*:certify:*` npm scripts — **one commit can include script entries with their release** or split via careful staging |
| `src/App.jsx` | R2.2, R-ANALYTICS | Route table + analytics hook — **Investigation Required** for clean split; recommend combined baseline commit |
| `src/seo/pageMetadata.js` | R2.1, R2.6 | Incremental SEO improvements — commit as single R2 baseline |

---

# Section 6 — Dependency Matrix

```
R2.1 Technical SEO
    ↓ (metadata pipeline used by)
R2.2 Landing Framework
    ↓
R2.3 Brand Landings ──┐
R2.4 Price/Use Case ──┼──► all use LandingPage + filters
R2.6 SEO Content ─────┘
    ↓
R2.5 Link Graph (adapters consume registry + catalog)
    ↓
R2.7 Certification (validates all above)

R2.7.1 Brand Filter Fix ──► depends on R2.2 landingFilter.js (can deploy as patch on top of prod)

R-ANALYTICS ──► depends on R2.2 routes (SPA paths); independent of SEO content

R-GEN ──► depends on build scripts; independent

R-MEDIA ──► independent

R-CERT / R-DOCS-* ──► depend on nothing for runtime; document R2+ releases

R-INV / R-SECRETS / R-TEST ──► no dependencies; exclude from all releases
```

| Release | Depends on | Blocks |
|---------|------------|--------|
| R2.7.1 | R2.2 (landing module on prod) | Sprint 2 business acceptance |
| R2.1–R2.7 baseline commit | Each other (monolithic sprint 2) | Reproducible prod |
| R-ANALYTICS | Routes exist | GA4 activation |
| R-GEN | `npm run build:sitemaps`, content gen | Optional |
| R-CERT docs | Code under test | Nothing |

---

# Section 7 — Deployment Readiness

| Release | Deploy independently? | If NO — why |
|---------|:---------------------:|-------------|
| **R2.7.1** | **YES** | Single-file fix; highest priority |
| **R2.1–R2.7 (code baseline)** | **NO** as partial | `src/landing/` + `src/linkGraph/` are untracked wholes; splitting requires Phase 2 isolation |
| **R-ANALYTICS** | **YES** | Env-gated; no hard dependency on R2.7.1 |
| **R-GEN** | **YES** | Regenerate or commit separately |
| **R-MEDIA** | **YES** | Asset-only |
| **R-CERT** | **YES** | Docs/scripts only |
| **R-DOCS / ANALYTICS** | **YES** | Docs only |
| **R-RECOVERY-R1** | **YES** | Docs + optional cert |
| **R-INV / SECRETS / TEST** | **NO** | Must not deploy |

---

# Section 8 — Recommended Release Order

| Order | Release ID | Action | Rationale |
|------:|------------|--------|-----------|
| **1** | **R2.7.1** | Deploy brand filter fix | P0 live bug on all `/brands/*` |
| **2** | **R2.1–R2.7** | Git commit baseline (production code) | Restore reproducibility; matches prod |
| **3** | **R-MEDIA** | Commit + deploy assets (if not in baseline) | Independent; improves listing images |
| **4** | **R-ANALYTICS** | Deploy + manual GA4 env | Measurement before Sprint 3 |
| **5** | **R-GEN** | Optional commit or CI-only regenerate | Avoid timestamp noise |
| **6** | **R-CERT** | Commit cert scripts + reports | Release engineering |
| **7** | **R-DOCS** | Commit handbook + ADRs | Architecture reference |
| **8** | **R-DOCS-ANALYTICS** | Commit guides | Ops runbooks |
| **9** | **R-RECOVERY-R1** | Commit recovery docs | Historical; optional |
| **—** | **R-INV / R-TEST / R-SECRETS** | Delete / gitignore | Never ship |

**Git tag suggestion after Order 2:** `v2.0.0-seo-foundation`

---

# Section 9 — Future Release Strategy

Every feature MUST follow:

```
Planning
    ↓
Architecture Review (Handbook + ADR if needed)
    ↓
Development (one business feature)
    ↓
Technical Certification (automated + report)
    ↓
Code Review
    ↓
Manual Business Acceptance Testing (BAT)
    ↓
Git Commit (single release scope)
    ↓
Git Push
    ↓
Production Deployment
    ↓
Production Smoke Test + cert re-run
    ↓
Release Freeze (no new work on branch)
    ↓
Git Tag
    ↓
Update MASTER-RELEASE-REGISTER.md
    ↓
Start Next Feature (clean working tree required)
```

**Hard rules:**

- **Never** accumulate multiple completed features uncommitted.
- **Never** deploy without a matching commit (except hotfix → immediate backport commit).
- **Never** commit secrets or test artifacts.
- Every production bug → permanent regression cert (e.g. `landing:certify:brand-filter`).

---

# Section 10 — Business Acceptance Testing Mapping

## R2.7.1 — Brand Landing Filter (required before Sprint 2 acceptance)

| Page | URL |
|------|-----|
| Brand — Tata | `/brands/tata` |
| Brand — MG | `/brands/mg` |
| Brand — Mahindra | `/brands/mahindra` |
| Brand — BYD | `/brands/byd` |
| Brand — Hyundai | `/brands/hyundai` |
| Brand — Kia | `/brands/kia` |
| Brand — BMW | `/brands/bmw` |
| Brand — Mercedes-Benz | `/brands/mercedes-benz` |

**Regression spot-checks:** `/best-evs/under-10-lakh`, `/best-evs/city`

## R2.1–R2.7 — Sprint 2 foundation (already on prod; re-verify after baseline commit)

| Family | URLs |
|--------|------|
| Home | `/` |
| Browse | `/cars` |
| Vehicle | `/cars/tata-nexon-ev` |
| Compare guide | `/compare/nexon-ev-vs-mg-zs-ev` |
| Brand | `/brands/tata` |
| Price | `/best-evs/under-10-lakh` |
| Use case | `/best-evs/city` |
| Guide | `/ownership-guides/running-cost` |

## R-ANALYTICS (after deploy + VITE_GA_ID)

| Check | Method |
|-------|--------|
| SPA page_view | GA4 Realtime |
| landing_viewed | Navigate to `/brands/tata` |
| vehicle_view | `/cars/tata-nexon-ev` |

---

# Section 11 — Architecture Compliance

| Rule | R2.1–R2.7 | R2.7.1 | R-ANALYTICS |
|------|:---------:|:------:|:-----------:|
| One Landing Framework | PASS | PASS (filter only) | N/A |
| One Metadata Engine | PASS | PASS | N/A |
| One Schema Engine | PASS | PASS | N/A |
| One Link Graph | PASS | PASS | N/A |
| One Analytics Engine | PASS | PASS | PASS (extends, no duplicate) |
| One Catalog Engine | PASS | PASS | N/A |
| One Routing Layer | PASS | PASS | N/A |
| One Registry System | PASS | PASS | N/A |
| No duplicate implementations | PASS | PASS | PASS |
| No architectural drift | PASS | PASS | PASS |

**Violations found:** None in code structure. **Process violation:** git history does not reflect deployed architecture (operational drift, not design drift).

---

# Section 12 — Repository Stabilization Roadmap

| Phase | Name | Deliverable | Status |
|------:|------|-------------|--------|
| **1** | **Inventory** | This document + MASTER-RELEASE-REGISTER | **Complete** |
| **2** | **Release Isolation** | Separate commits per release ID; stage buckets | Pending approval |
| **3** | **Independent Certification** | Re-run certs per release after isolation | Pending |
| **4** | **Deployment** | R2.7.1 first; then tag baseline | Pending |
| **5** | **Repository Cleanup** | Remove R-INV, R-TEST; gitignore secrets | Pending |
| **6** | **Production Freeze** | Sprint 2 BAT sign-off; update register | Pending |

---

# Section 13 — Future Engineering Policy

1. **One business feature per release** — one row in MASTER-RELEASE-REGISTER.
2. **One production deployment per approved release** — no bundling unrelated fixes.
3. **Clean working tree** before starting next feature (`git status` empty).
4. **Every production bug** → regression cert script (permanent).
5. **Every sprint ends with BAT** — Nitin sign-off documented.
6. **Three gates for release:** Technical Certification PASS + Business Approval PASS + Production Verification PASS.
7. **No commit** of `.env*`, `test-results/`, or `_probe*` scripts.
8. **Architecture Handbook** is SSOT — ADR for any engine change.
9. **Generated files** — prefer CI regeneration over committing timestamps.
10. **Hotfix path** — deploy → commit → tag within 24h.

---

# Section 14 — Master Release Register

See **[MASTER-RELEASE-REGISTER.md](./MASTER-RELEASE-REGISTER.md)** — permanent ledger; update after each approved release.

---

# Appendix A — Modified tracked files (196)

<details>
<summary>Click to expand full modified list categories</summary>

- **SEO data:** 149 JSON under `public/seo-data/`
- **Sitemaps:** 8 files
- **Media:** 12 WebP
- **Src modified:** 17 files (listed in Section 5)
- **Docs modified:** 3 (`event-taxonomy.md`, Lite release notes, sprint-12 cert)
- **Root:** `index.html`, `package.json`
- **Scripts:** `sprint-11-lead-production-verify.mjs`
- **Test-results:** 2 deleted traces + 2 modified

</details>

## Appendix B — Untracked entries (167)

- Entire `src/landing/` tree (33 files)
- Entire `src/linkGraph/` tree (10 files)
- Analytics new modules (9 files)
- All sprint 21–27 cert scripts + brand/analytics cert scripts
- Architecture handbook + ADRs
- Analytics guides + cert reports
- Recovery R1 docs
- Investigation scripts (9)
- Secrets (2)

---

# Stop Condition

Phase 1 complete. **No files modified except this inventory and MASTER-RELEASE-REGISTER.**

**Awaiting Nitin approval before Phase 2 (Release Isolation).**

---

*Inventory generated from `git status`, `git diff`, and repository analysis on 2026-07-13.*
