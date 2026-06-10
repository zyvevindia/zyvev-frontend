# EVSavari Search Console Playbook

Growth Phase 3 — organic traffic observation workflow  
Site: https://evsavari.com

---

## 1. Sitemap submission

| URL | Submit |
|-----|--------|
| `https://evsavari.com/sitemap.xml` | **Yes — primary** |

Child sitemaps (auto-discovered via index):

- `sitemaps/static.xml` — hub + legal
- `sitemaps/cars.xml` — vehicle families
- `sitemaps/seo-pages.xml` — 180 discovery guides
- `sitemaps/compare.xml` — compare hub + guides

Pre-flight: `npm run gsc:verify` and `npm run seo:sitemap-audit`

---

## 2. Top pages — priority indexing

Request indexing after deploy (URL Inspection → Request indexing):

### Tier A — highest intent (week 1)

| URL | Why |
|-----|-----|
| `/` | Brand entry |
| `/cars` | Catalog hub |
| `/compare` | Compare tool |
| `/guides` | Editorial hub |
| `/best-evs/under-15-lakh-agent` | Top budget guide |
| `/best-evs/family-agent` | Top family guide |
| `/compare/tata-nexon-ev-vs-mahindra-xuv400` | High-volume compare |
| `/cars/tata-nexon-ev` | Flagship vehicle |

### Tier B — SEO Agent top 20 (week 1–2)

All `*-agent` paths from `src/agents/seo/seoTemplates.js`:

- 6 buying guides (`/best-evs/*-agent`)
- 3 compare guides (`/compare/*-agent`)
- 4 top lists (`/best-evs/top-10-agent`, etc.)
- 7 variant recommendations (`/best-evs/*-variant-agent`)

### Tier C — brand + city (week 2–3)

- `/brands/tata`, `/brands/mg`, `/brands/mahindra`, …
- `/cities/bengaluru/evs`, `/cities/mumbai/evs`, `/cities/delhi/evs`

---

## 3. Weekly workflow

### Monday — coverage check

1. GSC → **Pages** → filter “Not indexed” — investigate new URLs
2. GSC → **Sitemaps** — confirm `sitemap.xml` processed, 0 errors
3. Run `npm run seo:qa` locally after any content deploy

### Wednesday — performance + queries

1. GSC → **Performance** — top queries and pages (28-day compare)
2. Note queries with impressions but CTR &lt; 2% → title/description refresh candidates
3. Cross-check GA4 `page_view` for same paths (validate indexing → traffic)

### Friday — analytics + clarity review

1. GA4 → **Events** — confirm Phase 3 events firing:
   - `vehicle_view`, `compare_view`, `search_used`, `filter_used`
2. Microsoft Clarity → **Dashboard** — dead clicks, rage clicks on `/cars` and `/compare`
3. Document anomalies in ops notes (no product changes until pattern is clear)

---

## 4. Indexability checklist

- [ ] `robots.txt` allows `/cars`, `/compare`, `/guides`, `/brands/`
- [ ] `robots.txt` blocks `/admin/`, `/crm/`, `/agent/`
- [ ] No legacy `/cars/best-evs-*` URLs in sitemap
- [ ] Canonical tags match sitemap paths
- [ ] JSON-LD validates (Rich Results Test on 3 sample URLs)
- [ ] Core Web Vitals — GSC → Experience

---

## 5. Correlate Search Console with product analytics

| GSC signal | GA4 / Clarity follow-up |
|------------|-------------------------|
| High impressions, low CTR | Review title + meta in `seo-data` JSON |
| Indexed but 0 clicks | Check SERP snippet; Clarity scroll on landing |
| `/compare/*` rising | Watch `compare_view` + `score_panel_opened` |
| `/best-evs/*` rising | Watch `variant_recommendation_clicked` |
| `/cars` search queries | Watch `search_used` + `filter_used` |

---

## 6. Commands

```bash
npm run seo:sitemap-audit
npm run gsc:verify
npm run seo:growth-phase2
npm run analytics:growth-phase3
```

---

## 7. Do not index

- `/admin/*`, `/sales/*`, `/dealer/*`, `/login`
- `/seo-data/*` (raw JSON)
- `/compare?cars=*` (session tool state — use `/compare/:slug` guides)
