# Deployment architecture — EVSavari (this repo)

## Repository role

This workspace is the **EVSavari buyer + admin SPA** (Vite, React, static SEO JSON under `public/seo-data/`, generated sitemaps). The **REST API** lives in a separate Node service (historically `zyvev-backend` / `evsavari-api.onrender.com`).

## Recommended topology

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| **Frontend** | **Vercel** (or Netlify / Cloudflare Pages) | Native SPA + static file CDN; zero server to operate; preview deployments per PR. |
| **Backend API** | **Render** (current prod URL pattern) or **Railway** / **Fly.io** | Stateless HTTP + external DB; health via `GET /cars?limit=1` or dedicated `/health`. |
| **Database** | **MongoDB Atlas** (external) | Already decoupled from app servers. |
| **Media** | **Cloudinary** (external) | Catalog images; public IDs only in frontend. |

## Build artifact expectations

1. `npm run build` produces **`dist/`** with:
   - `index.html` + hashed chunks under `assets/`
   - Copied **`public/`** tree: `robots.txt`, `sitemap.xml`, `sitemaps/*.xml`, `seo-data/*.json`
2. **Do not** deploy without running **`prebuild`** (content + sitemaps). CI and Vercel must use `npm run build`, not raw `vite build` alone, unless you explicitly run `content:generate` and `build:sitemaps` first.

## Environment management

| Surface | Strategy |
|---------|----------|
| **Vercel** | Project **Environment Variables** per `Production` / `Preview` / `Development`. Prefix public vars with `VITE_`. |
| **API** | Render/Railway **encrypted** env; never commit secrets. |
| **Local** | `.env.local` (gitignored) from `.env.example`. |

## CI/CD suitability

- **GitHub Actions** in this repo: `lint` + `build` + `post-launch:smoke` — fast, reversible gate before merge.
- **Vercel Git integration**: automatic production deploy on merge to main; instant rollback to prior deployment in dashboard.

## Expected production URLs (reference)

| Resource | Example |
|----------|---------|
| Buyer site | `https://evsavari.com` |
| API | `https://evsavari-api.onrender.com` (replace with your live API host) |
| Sitemap index | `https://evsavari.com/sitemap.xml` |
| Robots | `https://evsavari.com/robots.txt` |

## Risks / warnings

1. **SPA rewrites** must send unknown paths to `index.html` **without** masking real files (`/seo-data/*`, `/sitemaps/*`, `robots.txt`, `sitemap.xml`). Vercel serves existing static files before rewrites — keep `public/` outputs in sync with build.
2. **API CORS** must allow the production origin; changing `VITE_API_URL` alone is insufficient if the API blocks the new host.
3. **SEO JSON drift**: if you skip `prebuild`, Search Console will still see old sitemap counts vs live routes — always use full `npm run build` for production artifacts.
4. **Preview deployments** on Vercel use Preview env vars — point `VITE_API_URL` at staging API or read-only prod consciously.
5. **Compare share URLs** (`/compare/...`, query-based compare) rely on the same SPA rewrite — do not add aggressive edge caching on HTML without purging on deploy (see `vercel-caching.md`).

## When not to use Vercel

- Hard requirement for **single origin** BFF on same host as static files — then consider Cloudflare Workers or a thin Node static server. For EVSavari’s split API + SPA, Vercel remains the simplest fit.
