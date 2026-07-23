# EVSavari Master Release Register

**Purpose:** Permanent ledger of every production release.  
**Policy:** One approved release → one commit → one deployment → one tag.  
**Started:** 2026-07-13 (Repository Stabilization Program)

---

| Release ID | Release Name | Git Commit | Deployment ID | Deployment Date | Business Approval | Technical Certification | Production Verification | Rollback Available | Status |
|------------|--------------|------------|---------------|-----------------|-------------------|---------------------------|-------------------------|--------------------|--------|
| R1.0 | EVSavari Lite v1.0 (Sprint 1 Foundation) | `71b75f4c` | _(see Sprint 1.6 notes)_ | _(pre-stabilization)_ | Approved | PASS | PASS | Yes | **Released** |
| **v2.0.0-production-baseline** | **Sprint 2 Production Baseline** | **`b1fb0985`** | **`dpl_6pivXzQ3umyPrZ1ttkKuWhqtjjtd`** | **2026-07-13** | **Approved** | **PASS** (Sprint 2.7 + brand filter) | **PASS** (https://evsavari.com) | **Yes** | **Released** |
| R2.1 | Technical SEO Foundation | `b1fb0985` | bundled w/ v2.0.0 | 2026-07 (prod) | Approved | PASS (Sprint 2.1 cert) | PASS | Yes | **Released** (in baseline) |
| R2.2 | Landing Framework | `b1fb0985` | bundled w/ v2.0.0 | 2026-07 (prod) | Approved | PASS (Sprint 2.2 cert) | PASS | Yes | **Released** (in baseline) |
| R2.3 | Brand Landing Pages (8 OEM) | `b1fb0985` | bundled w/ v2.0.0 | 2026-07 (prod) | Approved | PASS (Sprint 2.3 cert) | PASS | Yes | **Released** (in baseline) |
| R2.4 | Price & Use Case Landings (10) | `b1fb0985` | bundled w/ v2.0.0 | 2026-07 (prod) | Approved | PASS (Sprint 2.4 cert) | PASS | Yes | **Released** (in baseline) |
| R2.5 | Internal Link Graph | `b1fb0985` | bundled w/ v2.0.0 | 2026-07 (prod) | Approved | PASS (Sprint 2.5 cert) | PASS | Yes | **Released** (in baseline) |
| R2.6 | SEO Optimization & Content | `b1fb0985` | bundled w/ v2.0.0 | 2026-07 (prod) | Approved | PASS (Sprint 2.6 cert) | PASS | Yes | **Released** (in baseline) |
| R2.7 | Final SEO & GSC Readiness | `b1fb0985` | bundled w/ v2.0.0 | 2026-07-13 | Approved | PASS (Sprint 2.7 cert) | PASS | Yes | **Released** (in baseline) |
| R2.7.1 | Brand Landing Filter Fix | `b1fb0985` (fix in baseline); certs in `e4d3474d` | `dpl_6pivXzQ3umyPrZ1ttkKuWhqtjjtd` | 2026-07-13 | Approved | PASS (brand filter cert) | PASS | Yes | **Released** |
| **v2.0.2-customer-intelligence-foundation** | **Customer Intelligence Foundation** | **`e2c933da`** | **`dpl_B29xAQwnunrTyH1bMmSbPjYo4TYe`** | **2026-07-23** | **Approved** | **PASS_WITH_WARNINGS** (99/100) | **PASS** (prod smoke) | **Yes** | **Released** |
| R-ANALYTICS | Customer Intelligence Foundation (v2.0.2) | `e2c933da` | `dpl_B29xAQwnunrTyH1bMmSbPjYo4TYe` | 2026-07-23 | Approved | PASS_WITH_WARNINGS | PASS | Yes | **Released** |
| **v2.0.1-media-foundation** | **Local Vehicle WebP Media Foundation (12)** | **`83248fd8`** | **`dpl_BuTkDAXtiv7ZdFYF7vi4EPqTZdk5`** | **2026-07-13** | **Approved** | **PASS** (media production cert) | **PASS** (56/56 smoke) | **Yes** | **Released** |
| **v2.0.3-generated-seo-assets** | **Generated SEO Assets** | **`e3bedc16`** | **`dpl_664fyQaCxrfKiVgEdEUYdtwsm9mv`** | **2026-07-23** | **Approved** | **PASS** (gsc:verify) | **PASS** (prod smoke) | **Yes** | **Released** |
| R-GEN | Generated SEO Assets (v2.0.3) | `e3bedc16` | `dpl_664fyQaCxrfKiVgEdEUYdtwsm9mv` | 2026-07-23 | Approved | PASS | PASS | Yes | **Released** |
| **v2.0.5-sprint2-certification-package** | **Sprint 2 Certification Package** | **`e4d3474d`** | **`dpl_4Q955Vj9vGF23ZA5CU92qVqfAAUM`** | **2026-07-23** | **Approved** | **PASS** (Sprint 2 summary) | **PASS** (behaviour unchanged) | **Yes** | **Released** |
| R-CERT | Sprint 2 Certification Package (v2.0.5) | `e4d3474d` | `dpl_4Q955Vj9vGF23ZA5CU92qVqfAAUM` | 2026-07-23 | Approved | PASS | PASS | Yes | **Released** |
| **v2.0.4-sprint2-documentation-package** | **Sprint 2 Documentation & Operations Package** | **`6273ced3`** | **`dpl_Afs6TX9WPTFA4bWbv2i61TgmpCLh`** | **2026-07-23** | **Approved** | **PASS** (docs-only) | **PASS** (behaviour unchanged) | **Yes** | **Released** |
| R-DOCS | Sprint 2 Documentation & Operations (v2.0.4) | `6273ced3` | `dpl_Afs6TX9WPTFA4bWbv2i61TgmpCLh` | 2026-07-23 | Approved | PASS | PASS | Yes | **Released** |
| R-RECOVERY-R1 | Media Recovery R1 (forensics) | `6273ced3` (in R-DOCS) | bundled w/ v2.0.4 | 2026-07-23 | Approved | N/A | N/A | Yes | **Released** (in R-DOCS) |

**Tags:** `v2.0.0-production-baseline` → `b1fb0985` · `v2.0.1-media-foundation` → `83248fd8` · `v2.0.2-customer-intelligence-foundation` → `e2c933da` · `v2.0.3-generated-seo-assets` → `e3bedc16` · `v2.0.4-sprint2-documentation-package` → `6273ced3` · `v2.0.5-sprint2-certification-package` → `e4d3474d`  
**Production URL:** https://evsavari.com  
**Sprint 2 Certification Status:** **PASS** (`docs/releases/sprint-2-certification-summary.md`)

---

## v2.0.5 – Sprint 2 Certification Package (detail)

| Field | Value |
|-------|-------|
| **Release Name** | v2.0.5 – Sprint 2 Certification Package |
| **Release Date** | 2026-07-23 |
| **Commit Hash** | `e4d3474d` |
| **Tag** | `v2.0.5-sprint2-certification-package` |
| **Deployment ID** | `dpl_4Q955Vj9vGF23ZA5CU92qVqfAAUM` |
| **Repository Health** | ~95/100 — planned stabilization releases complete; ~19 blocked/noise files remain |
| **Sprint 2 Certification Status** | **PASS** — architecture, SEO, media, CI, production, recovery, deployment, BAT |
| **Business Summary** | Formal Sprint 2 closure evidence: cert harnesses, dated reports, supersession notes, certification summary |
| **Architecture Summary** | No runtime changes — certification scripts and evidence only |

---

## v2.0.4 – Sprint 2 Documentation & Operations Package (detail)

| Field | Value |
|-------|-------|
| **Release Name** | v2.0.4 – Sprint 2 Documentation & Operations Package |
| **Release Date** | 2026-07-23 |
| **Commit Hash** | `6273ced3` |
| **Tag** | `v2.0.4-sprint2-documentation-package` |
| **Deployment ID** | `dpl_Afs6TX9WPTFA4bWbv2i61TgmpCLh` |
| **Repository Health** | Improved — R-DOCS committed; ~59 files remain (mostly R-CERT + blocked) |
| **Business Summary** | Permanent Sprint 2 architecture and release-engineering documentation SSOT for development, ops, and knowledge transfer |
| **Architecture Summary** | Documentation only — Handbook, Landing Framework, Link Graph, ADRs 23–27; no runtime/engine changes |
| **Documentation Summary** | 18 files: Handbook v1.0, 5 ADRs, landing/link-graph guides, Inventory, Isolation, recovery forensics (R1/R1A/R1B), completion report, release notes |
| **Known Notes** | Identifier standardized to **R-DOCS** (replaced R-DOCS-ARCH) · Named ZEOS/onboarding/runbook gaps remain optional follow-up · R-CERT still uncommitted |

---

## v2.0.3 – Generated SEO Assets (detail)

| Field | Value |
|-------|-------|
| **Release Name** | v2.0.3 – Generated SEO Assets |
| **Release Date** | 2026-07-23 |
| **Commit Hash** | `e3bedc16` |
| **Tag** | `v2.0.3-generated-seo-assets` |
| **Deployment ID** | `dpl_664fyQaCxrfKiVgEdEUYdtwsm9mv` |
| **Business Summary** | Synchronized 158 tracked generated SEO artifacts (seo-data JSON, sitemaps, content manifest) with production prebuild output — crawl/index hygiene only |
| **Architecture Summary** | No runtime code changes; editorial SSOT `generate-content.mjs` + sitemap SSOT `build-sitemaps.mjs`; Vercel `prebuild` regenerates on every deploy |
| **Repository Health** | Improved — R-GEN cleared (~159 files); ~75 dirty remain (R-DOCS, R-CERT, secrets/tests blocked) |
| **Known Notes** | **Generated assets synchronized** · **No runtime code changes** · Diffs were `generatedAt`/`lastmod` only · Legacy orphans outside manifest remain future cleanup |

---

## v2.0.2 – Customer Intelligence Foundation (detail)

| Field | Value |
|-------|-------|
| **Release Name** | v2.0.2 – Customer Intelligence Foundation |
| **Release Date** | 2026-07-23 |
| **Commit Hash** | `e2c933da` |
| **Tag** | `v2.0.2-customer-intelligence-foundation` |
| **Deployment ID** | `dpl_B29xAQwnunrTyH1bMmSbPjYo4TYe` |
| **Business Summary** | Centralized, env-gated Customer Intelligence event layer for homepage, landings, vehicles, compare, leads, CTAs, and internal links — foundation for future Dealer/OEM/Buying AI and marketing intelligence |
| **Architecture Summary** | Exactly one Analytics Engine → envelope → provider dispatcher (GA4/GTM/Clarity/PostHog + Meta/LinkedIn/server stubs); no direct `gtag`/`dataLayer` in components; no PII; SPA-controlled `page_view` |
| **Repository Health** | Improved — R-ANALYTICS committed; ~235 uncommitted files remain (R-GEN, R-CERT, R-DOCS) |
| **Known Warnings** | **GA4 activation pending** · **Environment variables pending** (`VITE_GA_ID` / `VITE_GTM_ID` not set on Vercel Production) — tracking degrades gracefully until manual activation |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **Released** | Committed, deployed, business-approved |
| **Deployed** | Live on production; partial git record (e.g. fix absorbed into baseline) |
| **Ready — not deployed** | Code/docs local; awaiting deploy + BAT |
| **Blocked** | Must not ship (secrets, test artifacts) |

---

## Rules for Future Rows

1. Add a row **before** development starts (Planning phase).
2. Fill **Git Commit** only after approved commit to `main`.
3. Fill **Deployment ID** from Vercel after production deploy.
4. **Business Approval**, **Technical Certification**, and **Production Verification** must all be PASS before **Released**.
5. One business feature → one release → one commit → one deployment → one tag → clean working tree.

---

*Last updated: 2026-07-23 — v2.0.5 Sprint 2 Certification Package released (`e4d3474d`, `dpl_4Q955Vj9vGF23ZA5CU92qVqfAAUM`) — Sprint 2 Certification Status: PASS*
