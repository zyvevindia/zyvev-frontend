# SEO Authority Infrastructure

Intelligence-backed programmatic decision pages — not thin listicles or AI-generated spam.

## Architecture

| Layer | Path |
|-------|------|
| Scoring | `zyvev-backend/services/seo-intelligence/` |
| Page registry | `zyvev-backend/services/seo-pages/` |
| Generation | `zyvev-backend/services/seo-generators/` |
| Audits | `zyvev-backend/services/seo-page-audits/` |
| Sitemap prep | `zyvev-backend/services/sitemap-registry/` |
| API | `GET /api/seo/pages`, `GET /api/seo/pages/:slug` |
| Frontend router | `CarsSlugRouter` → reserved slug → `SeoGuidePage` |
| Static fallback | `public/seo-data/{slug}.json` |

## SEO page types (12 live)

| Category | Slugs |
|----------|-------|
| Budget | `best-evs-under-10-lakh`, `best-evs-under-20-lakh` |
| Usage | `best-evs-for-city-driving`, `best-family-electric-cars`, `best-evs-for-office-commute` |
| Ownership | `lowest-maintenance-electric-cars`, `best-evs-for-first-time-buyers`, `best-evs-for-apartment-living` |
| Charging | `best-evs-for-home-charging`, `best-evs-for-daily-commute` |
| Compare | `nexon-ev-vs-mg-zs-ev`, `comet-ev-vs-tiago-ev` |

## Canonical URLs

All decision pages: `https://evsavari.com/cars/{slug}`  
Vehicle detail remains `https://evsavari.com/cars/{vehicle-slug}` — reserved slugs must not collide (audited).

## Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `SEO_PAGES_ENABLED` (backend) | `false` | Live API generation |
| `SEO_INTELLIGENCE_PUBLIC` (backend) | `false` | Expose internal scores in API |
| `VITE_SEO_PAGES` (frontend) | unset | Prefer API over static JSON |

Static JSON works without backend flags after `build-seo-pages-json.mjs`.

## Commands

```bash
# Backend — from zyvev-backend
node scripts/audit-seo-pages.js
node scripts/build-seo-pages-json.mjs

# Frontend — from zyvev-frontend
npm run build
```

## Staging validation

1. Open `/cars/best-evs-for-city-driving` — intro, ranked picks, FAQs
2. Open `/cars/nexon-ev-vs-mg-zs-ev` — two-variant compare + link to `/compare`
3. Confirm vehicle URLs still work: `/cars/tata-nexon-ev-empowered-lr`
4. Run `node scripts/audit-seo-pages.js` — 0 errors

## Rollback

- Remove slug from `seo-pages/registry.js` + `src/data/seoPageSlugs.js`
- Rebuild static JSON; redeploy frontend
- Set `SEO_PAGES_ENABLED=false` to disable API only (static still serves if deployed)

## Sitemap

`buildSitemapRegistry()` and `src/utils/sitemapRegistry.js` prepare entries — **not** merged into `public/sitemap.xml` yet.
