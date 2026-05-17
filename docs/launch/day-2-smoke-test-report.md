# Day-2 production smoke test & deployment validation

**Date:** 2026-05-17  
**Scope:** Soft-launch readiness (validation only — no routing/SEO/architecture changes)  
**Validator:** Automated + local production build; live `evsavari.com` not reachable from CI/agent network

---

## Launch readiness summary

| Area | Status | Notes |
|------|--------|-------|
| Production build | **PASS** | `npm run build` succeeds (content + sitemaps + Vite) |
| Media infrastructure | **PASS** (after fix) | 18/18 Cloudinary probe URLs return 200 |
| SEO QA | **PASS** | 121 discovery pages, 0 errors / 0 warnings |
| Launch smoke script | **PASS** | `npm run launch:smoke` |
| Vercel production deploy | **BLOCKED / UNVERIFIED** | Large local diff not on `origin/main`; live site unreachable from test env |
| Manual browser / mobile | **PENDING** | Owner must run `docs/launch/production-smoke-test.md` on production |
| Backend API / admin live | **PENDING** | Requires production API + credentials |

### Verdict

**Not ready for controlled soft launch until:**

1. **Deploy** current workspace (Cloudinary media layer, launch tooling, ops pages, feedback, Nexon fixes) to Vercel production `main`.
2. **Confirm** production URLs manually (this environment could not reach `https://evsavari.com`).
3. **Complete** 15-minute manual pass on real devices (home, 3 family pages, compare, lead, WhatsApp, admin).

After deploy + manual pass: **conditionally ready** for friend/dealer soft launch.

---

## Part 1 — Production deployment validation

### 1.1 Vercel / latest `main`

| Check | Result | Evidence |
|-------|--------|----------|
| Local branch | `main` (tracking `origin/main`) | `git status` |
| Latest commit on remote | `05168be` — *feat: operational traffic intelligence and dealer workflows* | `git log -1` |
| Uncommitted launch work | **Yes — extensive** | Media (`src/media/`, `src/config/media.js`), launch docs, `scripts/media-audit.mjs`, `scripts/cloudinary-fix-publicids.mjs`, SEO content regen, admin ops pages, CarDetails/Home/Compare polish, etc. |
| Production site HTTP | **FAIL (env)** | `Unable to connect to the remote server` for `https://evsavari.com/*` |
| Stale chunks on CDN | **UNKNOWN** | Cannot compare prod asset hashes without live site |
| Broken imports | **PASS** | Production build completes; no missing modules |
| Launch family fallback SVG | **PASS (code)** | `buildImageFallbackChain` → Cloudinary-first for 6 families; SVG only as last resort |

**Action:** Push/deploy current tree to Vercel production, then verify `index-*.js` hash changes and hard-refresh cache.

### 1.2 Media delivery (automated)

| Check | Result |
|-------|--------|
| 6 launch families in manifest | PASS |
| `npm run media:audit` (manifest + tier-1) | PASS — 12 variants, 0 errors |
| `npm run media:audit -- --probe` | PASS — **18/18** HEAD 200 |
| Cloud name `dznvmumze` in build output | PASS (`dist/assets/vehicleMedia-*.js`) |
| Canonical public IDs | `evsavari/catalog/families/{slug}/hero`, `listing-thumb`, `compare-thumb` |

**Cloudinary inventory (tata-nexon-ev):**

| asset_id | public_id | display_name | created_at |
|----------|-----------|--------------|------------|
| f4bee27d… | `evsavari/catalog/families/tata-nexon-ev/hero` | hero_hxqhpe | 2026-05-17T08:09:01Z |
| 3852a2d5… | `evsavari/catalog/families/tata-nexon-ev/listing-thumb` | listing-thumb_bqw9tf | 2026-05-17T08:36:38Z |
| 3564c67b… | `evsavari/catalog/families/tata-nexon-ev/compare-thumb` | compare-thumb_oshfyo | 2026-05-17T08:36:34Z |

**Bug found & fixed during Day-2:** Default transform stack `f_auto,q_auto,c_limit,dpr_auto` returned **404** for Nexon `listing-thumb` and `compare-thumb` (raw URLs without `dpr_auto` returned 200). Fix: omit default `dpr_auto` on base catalog URLs in `src/media/cloudinary.js`. Re-probe: 18/18 OK.

### 1.3 CLS / lazy load / console (code review)

| Check | Result | Location |
|-------|--------|----------|
| Aspect-ratio box before load | PASS | `VehicleImage.jsx` — `aspectRatio` + placeholder shimmer |
| Role aspects 16:10 listing/compare/hero | PASS | `config/media.js` `ROLE_ASPECT` |
| Lazy loading | PASS | `loading={eager ? "eager" : "lazy"}` on `<img>` |
| Responsive AVIF/WebP | PASS | `responsive.js` + `VehicleImage` `responsive` prop |
| Fallback chain | PASS | Cloudinary → local `/fallback-ev.svg` |

**Manual still required:** DevTools → no image 404s on home + 3 detail pages at 375px width.

### 1.4 Automated commands

```text
npm run build                    ✅ PASS (147 sitemap URLs)
npm run media:audit -- --probe   ✅ PASS (18/18)
npm run seo:qa                   ✅ PASS (121 pages, 0 errors)
npm run launch:smoke             ✅ PASS
npm run lint                     ⚠️ FAIL (96 issues — mostly pre-existing; does not block build)
```

**Local preview (`npm run preview` @ :4173):**

| Route | HTTP |
|-------|------|
| `/` | 200 |
| `/cars` | 200 |
| `/cars/tata-nexon-ev` | 200 |
| `/cars/tata-punch-ev` | 200 |
| `/cars/mg-comet-ev` | 200 |
| `/compare` | 200 |
| `/guides` | 200 |
| `/best-evs/family` | 200 |
| `/cities/delhi/evs` | 200 |
| `/compare/nexon-ev-vs-mg-zs-ev` | 200 |
| `/admin/traffic` | 200 (SPA shell; auth at runtime) |
| `/sitemap.xml` | 200 |
| `/robots.txt` | 200 |

*(SPA HTML does not embed Cloudinary URLs server-side; images load client-side from manifest.)*

---

## Part 2 — Core user journey smoke tests

Status: **code present / manual verification required on production**

### A. Homepage

| Item | Code | Manual prod |
|------|------|-------------|
| Cards load from API | ✅ `Home.jsx` | ☐ |
| Compare CTA + persistence | ✅ `COMPARE_CARS_STORAGE_KEY` | ☐ |
| WhatsApp CTA | ✅ `WhatsAppLeadCta` | ☐ |
| Loading / error / retry | ✅ `NetworkErrorPanel` pattern | ☐ |
| Real Cloudinary media | ✅ manifest | ☐ |
| No placeholder CDN | ✅ `isPlaceholderMediaUrl` deprioritizes `cdn.evsavari.com` | ☐ |

### B. Vehicle detail pages

**Target URLs:** `/cars/tata-nexon-ev`, `/cars/tata-punch-ev`, `/cars/mg-comet-ev`

| Item | Code | Manual prod |
|------|------|-------------|
| Hero image | ✅ `VehicleImage` role `hero` | ☐ |
| Variant selector | ✅ `CarDetails.jsx` | ☐ |
| EMI calculator | ✅ present on detail | ☐ |
| Compare variants | ✅ events `VARIANT_COMPARE_CLICKED` | ☐ |
| Book test drive / lead modal | ✅ `LeadInquiryModal` | ☐ |
| Breadcrumbs | ✅ structured data helpers | ☐ |
| Canonical URLs | ✅ Helmet / SEO helpers | ☐ |
| No console errors | — | ☐ |

### C. Compare flows

| Item | Code | Manual prod |
|------|------|-------------|
| Card alignment / aspect | ✅ `VehicleImage` compare role | ☐ |
| Remove card | ✅ `ComparePage` | ☐ |
| Compare-all-variants | ✅ detail → compare events | ☐ |
| Compare guide SEO routes | ✅ `/compare/:compareSlug` | ☐ |
| Persistence (localStorage) | ✅ `COMPARE_CARS_STORAGE_KEY` + sync event | ☐ |

### D. WhatsApp flows

| Item | Code | Manual prod |
|------|------|-------------|
| CTA opens `wa.me` | ✅ `openWhatsAppLead` | ☐ |
| Attribution payload | ✅ `buildWhatsAppLeadMessage` + `recordWhatsAppLeadIntent` | ☐ |
| No duplicate session leads | ⚠️ verify `recordWhatsAppLeadIntent` debounce in ops | ☐ |
| Admin visibility | ✅ `/api/leads/whatsapp-intent` | ☐ |

**Env:** `VITE_WHATSAPP_SALES_NUMBER` must be set in Vercel production.

---

## Part 3 — Operational smoke tests

Routes verified in `App.jsx` + `Admin.jsx` nav:

| Surface | Route | Code | Live API |
|---------|-------|------|----------|
| Traffic intelligence | `/admin/traffic` | ✅ | ☐ |
| Operational QA | `/admin/ops-qa` | ✅ | ☐ |
| Media QA | `/admin/media-qa` | ✅ | ☐ |
| Dealer applications | `/admin/dealer-applications` | ✅ | ☐ |
| Dealer dashboard | `/dealer` (auth) | ✅ | ☐ |
| Dealer leads / unread | ✅ `DealerDashboard.jsx` | ☐ |
| CSV exports | ✅ `adminExportApi.js`, `csvExport.js` | ☐ |
| Audit logs | ✅ `opsAuditLog.js` / API | ☐ |
| SLA / ops pulse | ✅ `OpsHealthCards`, traffic API | ☐ |

**Requires:** valid admin JWT, backend `API_URL`, Mongo/ops services up.

---

## Part 4 — SEO & discovery validation

| Check | Result |
|-------|--------|
| `npm run seo:qa` | PASS — 121 pages, 0 errors, 0 warnings |
| Sitemap index | `public/sitemap.xml` → 4 child sitemaps |
| URL counts (build) | static 7, cars 17, seo-pages 122, compare 1 — **147 total** |
| `robots.txt` | Disallows `/admin`, `/dealer`, `/car/`, query junk; allows `?variant=` |
| Discovery routes | `/best-evs/:useCase`, `/cities/:city/evs`, `/ownership-guides/:slug`, etc. |
| Structured data | `structuredData.js`, `seo/schema.js` — Vehicle, FAQ, Breadcrumb |
| Legacy guide canonicals | 17 legacy + manifest batch |
| Orphan / broken routes (automated) | None reported by `seo:qa` |

**Manual:** Fetch live `/sitemap.xml` and one city + one compare guide after deploy.

---

## Part 5 — Passed / failed / warnings

### Passed (automated)

- Production build + prebuild content/sitemaps
- SEO QA (121 discovery pages)
- Media audit + live Cloudinary probe (18/18 after `dpr_auto` fix)
- Launch smoke orchestration
- Local preview route availability
- Cloudinary account assets for all 6 families (3/3 Nexon)
- Admin/dealer route registration
- Media manifest + tier-1 variant coverage (12 variants)

### Failed / blockers

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| B1 | **Blocker** | Launch media/ops/SEO work **not deployed** to production (`origin/main` behind workspace) | Commit + push + Vercel prod deploy |
| B2 | **Blocker** | Live `evsavari.com` not validated from test environment | Manual prod smoke per `production-smoke-test.md` |
| B3 | **Blocker** | Manual mobile / slow-3G / lead / WhatsApp passes not executed | Owner checklist (~15 min) |

### Warnings

| ID | Severity | Issue | Recommendation |
|----|----------|-------|----------------|
| W1 | Medium | `npm run lint` — 96 problems | Triage post-launch; not build-blocking |
| W2 | Medium | Extra gallery/og assets in manifest not uploaded | Non-blocking; fallbacks chain to hero/listing |
| W3 | Low | `launch:smoke` does not run `--probe` by default | Use `media:audit -- --probe` in CI |
| W4 | Low | mg-comet `listing-thumb1.jpg` display name in Cloudinary | Cosmetic; canonical thumbs OK |

### Fix applied during Day-2 (included in deploy)

**File:** `src/media/cloudinary.js`  
**Change:** Default `dpr` on `buildTransformString` from `"auto"` to `null` so base catalog URLs avoid `dpr_auto` 404 on Nexon listing/compare assets.

---

## Recommended pre-launch sequence

1. Commit and push all launch-ready frontend changes to `main`.
2. Confirm Vercel production deployment from latest commit.
3. Run on production (browser + phone):
   - `docs/launch/production-smoke-test.md`
   - Day-1 checklist: `docs/launch/day-1-checklist.md`
4. Re-run remotely:
   ```bash
   npm run media:audit -- --probe
   npm run seo:qa
   ```
5. Submit sitemap in GSC if not done (`/admin/ops-qa` helpers).
6. Send test lead + WhatsApp intent; confirm in Admin → Leads and ops audit.

---

## Screenshots

Not captured in this automated run. After deploy, capture:

- Home grid (6 families, real photos)
- `/cars/tata-nexon-ev` hero + variant selector
- `/compare` with 2 cards
- `/admin/media-qa` probe panel (all green)

---

## Sign-off

| Role | Ready? | Signature / date |
|------|--------|------------------|
| Engineering (automated) | Media + SEO + build **PASS** | 2026-05-17 |
| Engineering (deploy) | **NO** — pending Vercel deploy | |
| Product / ops (manual) | **PENDING** | |

**Soft launch recommendation:** **Hold** until B1–B3 cleared, then proceed with controlled friend/dealer cohort per `docs/launch/day-1-checklist.md`.
