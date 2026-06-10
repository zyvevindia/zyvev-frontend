# EVSavari Growth Phase 2 — Indexability and Editorial Layer

Generated: 2026-06-10  
Platform agents (Catalog Acquisition, Vehicle Creation, Score Engine core, Orchestrator, Monitoring, Audit, Analytics): **not modified**

---

## Recommendation

**READY_FOR_TRAFFIC**

---

## Deliverables

| Task | Output | Status |
|------|--------|--------|
| Sitemap audit | `docs/seo/sitemap-audit.md` | ✅ Pass |
| Robots.txt | `public/robots.txt` (generated) | ✅ Pass |
| Breadcrumb schema | Vehicle, brand, compare, guide pages | ✅ Implemented |
| Editorial enrichment | Top 20 agent pages | 20/20 enriched |
| Search Console checklist | `docs/seo/search-console-checklist.md` | ✅ Generated |

---

## Metrics

| Metric | Value |
|--------|-------|
| Manifest batch pages | 157 |
| Sitemap total URLs | 239 |
| seo-pages.xml | 180 |
| compare.xml | 29 |
| SEO QA | 0 errors |
| GSC verify | pass |
| Production build | pass |

---

## Changes (Growth Phase 2)

### Sitemap quality
- `scripts/build-sitemaps.mjs` — merged discovery entries in `sitemap-manifest.json`; per-path `lastmod` on seo-pages + compare; page-type priorities (brand 0.78, best_evs 0.81)
- `scripts/seo-population/sitemap-audit.mjs` — manifest ↔ XML parity audit

### Robots.txt
- Block `/crm/*`, `/agent/*` in addition to `/admin/*`
- Explicit Allow for `/cars`, `/compare`, `/guides`, `/brands/`

### Breadcrumb schema
- `src/seo/breadcrumbs.js` — type-aware trails (brand, compare, city, best-evs, ownership, charging)
- `src/components/SEO/DiscoveryBreadcrumbNav.jsx` — UI aligned with JSON-LD
- `src/pages/CarDetails.jsx` — brand crumb links to `/brands/:brand` when available

### Editorial layer (human-reviewed)
- `src/content/editorial/top20Editorial.js` — pros, cons, who should buy/avoid, best alternative, internal links
- `scripts/content-generators/editorialEnrichment.mjs` — merged at generate time
- `src/components/SEO/SeoEditorialDecision.jsx` — renders editorial blocks on discovery pages

---

## Validation output

### seo:sitemap-audit

```
ev-frontend\.env.local VITE_SUPABASE_URL=set (jqnhrvykvlpyhxwgntzd.supabase.co) VITE_SUPABASE_ANON_KEY=set SUPABASE_SERVICE_ROLE_KEY=set CLOUDINARY_URL=set parsed=.env:1keys, .env.local:9keys
Sitemaps generated (https://evsavari.com)
  static.xml:     13 URLs
  cars.xml:       17 URLs (family slugs only)
  seo-pages.xml:  180 URLs (discovery canonical)
  compare.xml:    29 URLs
  Total indexed:  239 URLs
  robots.txt updated

Wrote C:\projects\zyvev-frontend\docs\seo\sitemap-audit.md
Audit: PASS
```

### seo:qa

```
v-frontend root=C:\projects\zyvev-frontend .env=C:\projects\zyvev-frontend\.env .env.local=C:\projects\zyvev-frontend\.env.local VITE_SUPABASE_URL=set (jqnhrvykvlpyhxwgntzd.supabase.co) VITE_SUPABASE_ANON_KEY=set SUPABASE_SERVICE_ROLE_KEY=set CLOUDINARY_URL=set parsed=.env:1keys, .env.local:9keys
SEO QA: 172 pages | 0 errors | 0 warnings
  Discovery sitemap paths: 172 | Legacy canonical guides: 38
```

### gsc:verify

```
sitemap index references seo-pages.xml
  ✓ sitemap index references compare.xml
  ✓ sitemap index uses production origin
  ✓ seo-pages.xml excludes legacy /cars/ guide URLs
  ✓ seo-pages.xml has no query-string URLs
  ✓ seo-pages.xml lists 180 discovery URLs
  ✓ Legacy guide canonical map: 38 slugs → discovery paths
  ✓ content-manifest.json: 157 registered pages

22 passed | 0 warnings | 0 errors
```

---

## Next steps (post-traffic)

1. Submit `https://evsavari.com/sitemap.xml` in Google Search Console
2. Request indexing for top 20 agent pages
3. Monitor orphan URLs and Core Web Vitals weekly
4. Refresh editorial layer quarterly with human review
