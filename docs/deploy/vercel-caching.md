# Vercel caching — EVSavari

`vercel.json` applies **Cache-Control** selectively:

| Pattern | Policy | Why |
|---------|--------|-----|
| `/assets/*` | `max-age=31536000, immutable` | Vite emits hashed filenames — safe long cache. |
| `/seo-data/*` | ~5 min browser + CDN | JSON updates on content regen; stale-while-revalidate softens load. |
| `/sitemaps/*`, `/sitemap.xml`, `/robots.txt` | ~10 min | Crawlers refetch; you still redeploy to refresh faster. |

## What is not aggressively cached

- **HTML document** for deep links (`/cars/...`, `/compare/...`) is served via rewrite to `index.html`. Vercel’s default behavior for such routes is acceptable for a SPA that changes behavior via new JS bundles. **Each deploy gets new hashed assets**, so users pick up new code after refresh.

## If you tune further

- Do **not** set `immutable` on `index.html` globally — stale HTML + new API can mismatch.
- Purge: Vercel redeploy invalidates edge for changed files; use **Redeploy** if a bad HTML layer was cached (rare).

## Build command reminder

Project settings must use **`npm run build`** so `prebuild` runs `content:generate` and `build:sitemaps`. Using naked `vite build` in the dashboard **skips** sitemap/SEO JSON regeneration unless you add a custom command chain.
