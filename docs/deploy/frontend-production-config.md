# Frontend production deployment configuration

## Hosting

- **Target:** Vercel (static + SPA), Node **not** required at runtime for the buyer app.
- **Build command:** `npm run build` (includes `prebuild`: content + sitemaps, then Vite).
- **Output:** `dist/` — `index.html`, hashed `assets/`, and everything from `public/` (robots, sitemap, `seo-data/`).

## `vercel.json`

| Feature | Behavior |
|---------|----------|
| **SPA fallback** | Rewrite `/(.*)` → `/index.html` so `/compare/...`, `/discover/...`, `/cars/...` survive refresh. |
| **www → apex** | Permanent redirect when `Host: www.evsavari.com` → `https://evsavari.com/$1`. |
| **Caching** | Long immutable cache on `/assets/*`; shorter cache on `seo-data`, sitemaps, `robots.txt`. |

Vercel serves **static files** from the deployment before applying SPA rewrites, so `/robots.txt`, `/sitemap.xml`, `/seo-data/*.json`, and `/assets/*` are not swallowed by the SPA rule.

## Canonical URLs

- Primary host: `https://evsavari.com` (see `src/config.js` `APP_CONFIG.domain` and sitemap generator).
- Set `VITE_API_URL` to the **HTTPS** API origin in production.

## SEO artifacts

- Generated under `public/` before/during build; must ship in the deployment artifact.
- CI runs `seo:qa` via `post-launch:smoke`.

## Manual QA (compare / discovery refresh)

1. Open a deep compare URL, hard refresh — expect app shell, no blank document.
2. Open `/discover/city-driving`, hard refresh — same.
3. “View source” is **not** SSR; SEO for many routes comes from **in-app** meta + static JSON — validate in browser devtools **Elements** after hydration for flagship URLs.
