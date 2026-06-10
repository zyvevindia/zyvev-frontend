# EVSavari Sitemap Audit

Generated: 2026-06-10  
Command: `npm run seo:sitemap-audit`

---

## Summary

| Check | Result |
|-------|--------|
| **Overall** | ✅ PASS |
| Manifest batch pages | 157 |
| seo-pages.xml URLs | 180 |
| compare.xml URLs | 29 |
| sitemap-manifest.json discovery | 180 |
| Total sitemap URLs | 239 |

---

## Manifest coverage (157 batch pages)

| Metric | Count |
|--------|-------|
| All manifest paths in seo-pages.xml | 157/157 |
| Compare guides in compare.xml | 28/28 |
| Manifest paths missing from all sitemaps | 0 |
| Compare guides in both seo-pages + compare | 28 (expected) |

All manifest paths appear in **seo-pages.xml**.


All compare_guide manifest entries appear in **compare.xml**.


---

## Duplicate detection

| Sitemap | Duplicate loc count |
|---------|---------------------|
| seo-pages.xml | 0 |
| compare.xml | 0 |

No duplicate URLs within seo-pages.xml.

---

## Priority validation

| Mismatch count | 0 |

| pageType | Expected priority |
|----------|-------------------|
| city_evs / city_charging | 0.76 |
| brand | 0.78 |
| best_evs | 0.81 |
| compare_guide | 0.82 |
| default | 0.80 |

All manifest entries in seo-pages.xml use expected priority values.

---

## lastmod coverage

| Sitemap | Missing lastmod |
|---------|-----------------|
| seo-pages.xml | 0 |
| compare.xml | 0 |

Source: `content-manifest.json` `generatedAt` + per-path map from batch generate.

---

## Sitemap files

| File | URLs | Purpose |
|------|------|---------|
| `public/sitemap.xml` | index | Sitemap index |
| `public/sitemaps/static.xml` | 13 | Hub + legal |
| `public/sitemaps/cars.xml` | 17 | Vehicle families |
| `public/sitemaps/seo-pages.xml` | 180 | Discovery guides |
| `public/sitemaps/compare.xml` | 29 | Compare hub + guides |

---

## Commands

```bash
npm run content:generate
npm run build:sitemaps
npm run seo:sitemap-audit
npm run gsc:verify
```
