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
| R2.7.1 | Brand Landing Filter Fix | `b1fb0985` (fix in baseline) | `dpl_6pivXzQ3umyPrZ1ttkKuWhqtjjtd` | 2026-07-13 | Approved | PASS (brand filter cert) | PASS | Yes | **Deployed** (cert/docs pending commit) |
| **v2.0.2-customer-intelligence-foundation** | **Customer Intelligence Foundation** | **`e2c933da`** | **`dpl_B29xAQwnunrTyH1bMmSbPjYo4TYe`** | **2026-07-23** | **Approved** | **PASS_WITH_WARNINGS** (99/100) | **PASS** (prod smoke) | **Yes** | **Released** |
| R-ANALYTICS | Customer Intelligence Foundation (v2.0.2) | `e2c933da` | `dpl_B29xAQwnunrTyH1bMmSbPjYo4TYe` | 2026-07-23 | Approved | PASS_WITH_WARNINGS | PASS | Yes | **Released** |
| **v2.0.1-media-foundation** | **Local Vehicle WebP Media Foundation (12)** | **`83248fd8`** | **`dpl_BuTkDAXtiv7ZdFYF7vi4EPqTZdk5`** | **2026-07-13** | **Approved** | **PASS** (media production cert) | **PASS** (56/56 smoke) | **Yes** | **Released** |
| R-GEN | Generated SEO Data & Sitemaps | — | on prod via build | 2026-07 | N/A | gsc:verify PASS | PASS | Regenerate | **Optional commit** |
| R-CERT | Certification & Release Engineering | — | N/A | 2026-07-13 | N/A | Self | N/A | N/A | **Uncommitted docs/scripts** |
| R-DOCS-ARCH | Architecture Handbook & ADRs | — | N/A | 2026-07 | N/A | N/A | N/A | N/A | **Uncommitted** |
| R-RECOVERY-R1 | Media Recovery R1 (forensics) | — | partial | 2026-07-10 | N/A | recovery-r1 cert | Partial | N/A | **Docs only — uncommitted** |

**Tags:** `v2.0.0-production-baseline` → `b1fb0985` · `v2.0.1-media-foundation` → `83248fd8` · `v2.0.2-customer-intelligence-foundation` → `e2c933da`  
**Production URL:** https://evsavari.com

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

*Last updated: 2026-07-23 — v2.0.2 Customer Intelligence Foundation released (`e2c933da`, `dpl_B29xAQwnunrTyH1bMmSbPjYo4TYe`)*
