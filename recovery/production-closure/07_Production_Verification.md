# Production Verification — PCS-01

**Date:** 2026-07-07  
**Method:** `npm run deploy:smoke` + Node fetch probes against production URLs

---

## Pre-PCS Baseline (2026-07-07, before commit/deploy)

| Surface | URL | Status |
|---|---|---|
| Homepage | `https://evsavari.com/` | ✅ 200 |
| Listing | `https://evsavari.com/cars` | ✅ 200 |
| Vehicle detail | `https://evsavari.com/cars/tata-nexon-ev` | ✅ 200 |
| Compare hub | `https://evsavari.com/compare` | ✅ 200 |
| Deep compare | `https://evsavari.com/compare/tata-nexon-ev-vs-mg-zs-ev` | ✅ 200 |
| Discover | `https://evsavari.com/discover/city-driving` | ✅ 200 |
| **Catalog manifest** | `https://evsavari.com/catalog/published/manifest.json` | ❌ **404** |
| API | `https://evsavari-api.onrender.com/cars?limit=1` | ✅ 200 |
| API health | `/health`, `/api/health` | ❌ 404 |
| Frontend health | `/api/health` | ❌ Not deployed yet |
| Media CDN | Cloudinary sample | ✅ 200 |
| SEO manifest | `/seo-data/content-manifest.json` | ✅ 200 |
| Admin shell | `/admin` | ✅ 200 |
| Dealer portal | `/dealer/login` | Not in baseline smoke |
| Search | No dedicated `/search` route — discovery via `/discover/*` | ✅ N/A |

---

## Post-PCS Expected (after git push + Vercel deploy)

| Surface | Expected | Verified |
|---|---|---|
| Catalog manifest | ✅ 200 + valid JSON | ⏳ Run after deploy |
| Frontend `/api/health` | ✅ 200 `{ ok: true }` | ⏳ Run after deploy |
| Dealer portal shell | ✅ 200 | ⏳ In deploy:smoke |
| All pre-PCS passing checks | ✅ | ⏳ Run after deploy |

---

## deploy:smoke Checks (PCS-01 expanded)

| # | Check | Required |
|---|---|---|
| 1 | robots.txt | ✅ |
| 2 | sitemap.xml + child | ✅ |
| 3 | Homepage SPA + no noindex | ✅ |
| 4 | Admin routes in bundle | ✅ |
| 5 | Compare + discover + admin shells | ✅ |
| 6 | seo-data manifest | ✅ |
| 7 | **catalog/published/manifest.json** | ✅ **NEW** |
| 8 | **Frontend /api/health** | ✅ **NEW** |
| 9 | **/cars/tata-nexon-ev** | ✅ **NEW** |
| 10 | **/cars listing** | ✅ **NEW** |
| 11 | **/dealer/login** | ✅ **NEW** |
| 12 | API /cars | ✅ |
| 13 | API /health | ⚠️ Optional warn |
| 14 | Cloudinary HEAD | ✅ |

---

## CRM / Admin

| Surface | Verification |
|---|---|
| Admin | SPA shell 200 — auth client-side |
| CRM Kanban | `/sales` — requires login; not in automated smoke |
| Dealer dashboard | `/dealer` — requires dealer auth |

**Note:** CRM operational verification requires authenticated E2E — **still open** (MVP-02).

---

## Verification Commands

```bash
# Full smoke (all required checks)
EVSAVARI_SITE_ORIGIN=https://evsavari.com npm run deploy:smoke

# Quick catalog check
curl -s https://evsavari.com/catalog/published/manifest.json | head -c 200

# Health
curl -s https://evsavari.com/api/health
```

---

## PCS-01 Verification Verdict

| Criterion | Pre-deploy | Post-deploy target |
|---|---|---|
| Catalog manifest 200 | ❌ | ✅ |
| deploy:smoke all required | ❌ (catalog fail) | ✅ |
| Production surfaces | Partial | Full expanded set |

**Final signoff pending:** git push → Vercel deploy → green `Production Verify` workflow.
