# Production Deployment Report — PCS-01

**Date:** 2026-07-07  
**Repo HEAD (pre-push):** `73c032a1`  
**PCS commit:** Created in this sprint (pending push)

---

## Git

| Item | Evidence |
|---|---|
| Catalog published artifacts | Were `??` untracked — **staged in PCS-01 commit** |
| CI / smoke / health changes | Modified in working tree — **included in PCS-01 commit** |
| Remote merge state | **Verify after push** — `gh` CLI unavailable in audit environment |

---

## GitHub

| Item | Status |
|---|---|
| CI workflow `ci.yml` | Updated — `catalog:certify:strict` blocking |
| New workflow `production-verify.yml` | Added — `deploy:smoke` on push to main + every 6h |
| Last CI run on PCS commit | **Pending push** |

---

## Vercel (Frontend)

| Item | Evidence | Status |
|---|---|---|
| Production URL | `https://evsavari.com` | ✅ Live (pre-PCS) |
| Deploy mechanism | Git integration (inferred from `vercel.json` + docs) | **Auto-deploy on push to main** |
| Deployment SHA | `VERCEL_GIT_COMMIT_SHA` exposed via new `/api/health` | **Verify post-deploy** |
| Catalog manifest before PCS | `GET /catalog/published/manifest.json` → **404** | ❌ |
| Catalog manifest after PCS | **Expected 200 after deploy** | ⏳ Pending push + deploy |
| Frontend health | `GET /api/health` | ⏳ New — pending deploy |

**Vercel dashboard access:** Not available in sprint environment. Owner must confirm Production env vars per `03_Configuration_Report.md`.

---

## Render (API)

| Item | Evidence | Status |
|---|---|---|
| Production URL | `https://evsavari-api.onrender.com` | ✅ |
| `GET /cars?limit=1` | **200** (Node probe 2026-07-07) | ✅ |
| `GET /health` | **404** | ❌ Backend gap — sibling repo |
| Cold start | deploy:smoke timeout observed once | ⚠️ Intermittent |

**Render dashboard / deploy SHA:** **DEPLOYMENT EVIDENCE NOT AVAILABLE** — backend is separate repository.

---

## Production Version

| Surface | Version source |
|---|---|
| Frontend bundle | Vite build; `__EVSAVARI_BUILD_COMMIT__` in `vite.config.js` |
| Frontend health JSON | `commit` field from `VERCEL_GIT_COMMIT_SHA` |
| Catalog snapshot | `2026-07-05T19-31-29-364Z-e79ed8d60a68` (manifest.json) |
| API | Unknown SHA — backend repo |

---

## Deployment Sequence (PCS-01)

1. Commit PCS-01 changes to `main`
2. Vercel auto-builds (≈2–5 min)
3. `production-verify.yml` waits 120s then runs `deploy:smoke`
4. Human: confirm Vercel dashboard shows green deployment

---

## Evidence Commands

```bash
# After deploy
curl -s https://evsavari.com/api/health | jq .
curl -s -o /dev/null -w "%{http_code}\n" https://evsavari.com/catalog/published/manifest.json
npm run deploy:smoke
```
