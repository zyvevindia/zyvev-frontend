# Final deployment architecture validation

**Scope:** This repository is the **EVSavari frontend** (Vite SPA). Validate hosting and env flow against the **recommended** stack unless your org standard differs.

## Recommended production topology

| Layer | Recommended | Role |
|--------|-------------|------|
| **Frontend** | **Vercel** | Static `dist/` + `public/` (robots, sitemaps, `seo-data/`), SPA rewrites, edge HTTPS |
| **Backend API** | **Render** (or equivalent Node host) | REST API, auth, Turnstile verify, rate limits, MongoDB driver |
| **Database** | **MongoDB Atlas** | External cluster; URI only on API |
| **Media** | **Cloudinary** | Image delivery; cloud name safe in frontend; **Admin API secrets stay local/scripts only** |

## Production URLs (defaults in repo)

| Surface | URL |
|---------|-----|
| Buyer site (canonical apex) | `https://evsavari.com` |
| **www** | Must **301** to apex (see `vercel.json` `redirects`) |
| API (code fallback) | `https://evsavari-api.onrender.com` |
| Sitemap index | `https://evsavari.com/sitemap.xml` |

Override API in Vercel env: `VITE_API_URL` (no trailing slash).

## Validation matrix

| Concern | Status / how to verify | Owner |
|---------|------------------------|--------|
| **Frontend hosting** | Vercel serves `index.html` + hashed `/assets/*`; `vercel.json` rewrites non-file routes to SPA shell | ✅ Repo |
| **Backend hosting** | Node listens on `PORT`; health documented in `docs/deploy/backend-production.md` | Backend repo + host |
| **API URL flow** | `VITE_API_URL` → `src/config.js` `API_URL`; prod fallback `evsavari-api.onrender.com` | Frontend env |
| **CORS** | API `CORS_ORIGIN` (or allowlist) must include `https://evsavari.com` and any preview origins | Backend env |
| **Cloudinary** | `VITE_CLOUDINARY_CLOUD_NAME` optional; default in code; `npm run launch:validate` HEADs sample images | Ops |
| **MongoDB Atlas** | Only on API; not in Vite bundle | Backend |
| **Env completeness** | `docs/deploy/production-env-checklist.md` + `.env.example` | Human sign-off |
| **Build output** | `npm run build` → `dist/` with `assets/`, `index.html`, copied `public/*` | CI |
| **Sitemap / robots** | `prebuild` runs `content:generate` + `build:sitemaps`; `robots.txt` lists `Sitemap:` | CI + `deploy:smoke` |
| **robots.txt behavior** | Crawlers: allow buyer paths; disallow `/admin`, query-noise compare URLs, `/seo-data/` for **crawling** (SPA still fetches JSON) | See `public/robots.txt` |

## Automated signals (frontend repo)

| Command | Meaning |
|---------|---------|
| `npm run deploy:repo-check` | Static: `vercel.json`, CI smokes, robots, `index.html`, scripts |
| `npm run ci:full` | Build + post-launch smokes + ingestion smoke |
| `EVSAVARI_SITE_ORIGIN=https://evsavari.com EVSAVARI_API_URL=… npm run deploy:smoke` | Live HTTP: robots, sitemaps, SPA deep routes, sample API |

## Unresolved blockers / warnings (human)

1. **Backend not in this repo** — health path (`GET /health`), startup validation, and Turnstile **secret** must be verified on the API service before high traffic.
2. **DNS** — Apex + www + TLS are human-verified in the DNS / Vercel dashboard (not scriptable here).
3. **GSC** — Property must match **canonical** host (recommend URL-prefix `https://evsavari.com/`).
4. **Secrets** — Never commit `.env*` with secrets; rotate if leaked.
5. **Preview deployments** — If previews call production API, confirm CORS includes preview origins or use staging API only.

## Readiness summary

- **Frontend:** Suitable for Vercel; SPA refresh on `/compare/*`, `/discover/*`, `/cars/*` depends on **catch-all rewrite** to `index.html` (present in `vercel.json`).
- **Backend:** Suitable for Render-style Node hosting; confirm **health check** path matches dashboard (`/health` or `/cars?limit=1`).
- **Data plane:** Atlas + Cloudinary externalized; correct for startup scale.

When `deploy:repo-check`, `ci:full`, and post-deploy `deploy:smoke` are green, the **technical** frontend gate for controlled public exposure is satisfied — still require human DNS, secrets, and GSC steps from [controlled-public-launch-checklist.md](./controlled-public-launch-checklist.md).
