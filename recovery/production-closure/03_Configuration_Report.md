# Configuration Report — PCS-01

**Date:** 2026-07-07  
**Method:** Repository audit + live probes. Vercel/Render dashboards not accessible in sprint environment.

---

## Summary

| Service | Repo-Verified | Live-Verified | PCS-01 Status |
|---|---|---|---|
| Cloudinary | ✅ | ✅ HEAD 200 | **Operational** |
| MongoDB (via API) | N/A (backend) | ✅ API 200 | **Operational** (indirect) |
| Render API | ✅ config | ✅ /cars 200 | **Operational** |
| Vercel frontend | ✅ vercel.json | ✅ site 200 | **Operational** |
| Catalog published CDN | ✅ committed | ⏳ post-deploy | **Resolved by PCS commit** |
| Supabase | ✅ code | Local smoke | **Optional — not required for PCS** |
| Turnstile | ✅ code | **Unknown** | **BLOCKED — manual Vercel + backend** |
| Google Analytics | ✅ code | **Unknown** | **BLOCKED — manual Vercel verify** |
| GTM | ✅ code | **Unknown** | Optional |
| Sentry | ✅ code | **Unknown** | **BLOCKED — manual Vercel** |
| API `/health` | ❌ backend | 404 | **BLOCKED — backend repo** |
| Frontend `/api/health` | ✅ added | ⏳ post-deploy | **Resolved by PCS** |

---

## Cloudinary

| Item | Value | Verified |
|---|---|---|
| Cloud name | `dznvmumze` | ✅ `.env.example`, deploy smoke |
| CI secret | `CLOUDINARY_URL` | ✅ `ci.yml` |
| Certification | `pass: true`, `brokenAssets: 0` | ✅ `media-certification-report.json` |

**Action:** None — operational.

---

## MongoDB

| Item | Status |
|---|---|
| Connection | Backend sibling repo (`zyvev-backend`) |
| Evidence | `GET /cars?limit=1` → 200 with JSON `cars` array |

**Action:** None in frontend repo.

---

## Render

| Item | Status |
|---|---|
| URL | `https://evsavari-api.onrender.com` |
| Blueprint | `docs/deploy/examples/render-backend.service.yaml` |
| Health check in blueprint | `/health` — **not implemented on live API** |

### Manual steps (backend owner)

| Step | Owner | Effort |
|---|---|---|
| Add `GET /health` returning `{ ok: true }` | Backend | 30 min |
| Set `healthCheckPath: /health` in Render dashboard | DevOps | 5 min |
| Enable keep-warm or paid tier if cold-start unacceptable | DevOps | 15 min |

---

## Vercel — Environment Variables

**Cannot verify or set from this sprint** — no dashboard access.

### Required Production Variables (set in Vercel → Project → Settings → Environment Variables → Production)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | **Yes** | `https://evsavari-api.onrender.com` |
| `VITE_CLOUDINARY_CLOUD_NAME` | **Yes** | `dznvmumze` |
| `VITE_GA_ID` | **Yes** | GA4 measurement ID |
| `VITE_SENTRY_DSN` | **Yes** | Error monitoring |
| `VITE_APP_ENV` | **Yes** | `production` |
| `VITE_APP_RELEASE` | Recommended | `evsavari-frontend@<git-sha>` |
| `VITE_TURNSTILE_SITE_KEY` | **Yes** (leads) | Cloudflare Turnstile site key |
| `VITE_ANALYTICS_ENABLED` | Yes | `true` |

### Optional

| Variable | Purpose |
|---|---|
| `VITE_GTM_ID` | Tag manager |
| `VITE_CLARITY_ID` | Session replay |
| `VITE_WHATSAPP_SALES_NUMBER` | Pilot CTAs |

### Must remain OFF in production

| Variable | Value |
|---|---|
| `VITE_BEHAVIORAL_INTELLIGENCE` | unset or `false` |
| `VITE_SEO_PAGES` | unset or `false` |
| `CATALOG_RUNTIME_MODE` | unset or `off` |
| `VITE_INTERNAL_BETA_TAG` | unset |

### Exact manual steps (Vercel owner — 30 min)

1. Open [Vercel Dashboard](https://vercel.com) → `evsavari-frontend` project
2. Settings → Environment Variables → Production
3. Add/verify each variable in table above
4. Redeploy production (Deployments → ⋯ → Redeploy)
5. Run `npm run deploy:smoke` locally to confirm
6. Open Sentry → verify first event within 24h
7. Open GA Real-Time → verify page_view

---

## Turnstile (Backend + Frontend pair)

| Side | Variable | Owner |
|---|---|---|
| Frontend | `VITE_TURNSTILE_SITE_KEY` | Vercel |
| Backend | `TURNSTILE_SECRET_KEY` | Render env (sibling repo) |

**Effort:** 1 hour (Cloudflare dashboard + both hosts)  
**Blocker reason:** Requires Cloudflare account credentials — not in repo.

---

## Secrets Handling

| Rule | Status |
|---|---|
| Service role not in bundle | ✅ |
| `.env` gitignored | ✅ |
| `CLOUDINARY_URL` CI-only | ✅ |

---

## Health Endpoints

| Endpoint | Status | PCS-01 |
|---|---|---|
| `https://evsavari.com/api/health` | **New** | ✅ Added `api/health.js` |
| `https://evsavari-api.onrender.com/health` | 404 | ❌ Backend action required |
