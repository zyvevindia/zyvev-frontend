# EVSavari Search Console Readiness Checklist

Generated: 2026-06-10  
Site: https://evsavari.com

---

## 1. Sitemap URLs

Submit in Google Search Console → Sitemaps:

| URL | Purpose |
|-----|---------|
| `https://evsavari.com/sitemap.xml` | **Primary index** (submit this) |
| `https://evsavari.com/sitemaps/static.xml` | Hub + legal pages |
| `https://evsavari.com/sitemaps/cars.xml` | Vehicle family pages |
| `https://evsavari.com/sitemaps/seo-pages.xml` | Discovery guides (180 URLs) |
| `https://evsavari.com/sitemaps/compare.xml` | Compare hub + guides (29 URLs) |

**Total indexed URLs:** 239

---

## 2. Robots.txt validation

Live URL: `https://evsavari.com/robots.txt`

| Rule | Status |
|------|--------|
| `Sitemap:` directive | ✅ |
| Block `/admin/*` | ✅ |
| Block `/crm/*` | ✅ |
| Block `/agent/*` | ✅ |
| Allow `/cars` | ✅ |
| Allow `/compare` | ✅ |
| Allow `/guides` | ✅ |
| Allow `/brands/` | ✅ |
| Allow `?variant=` on vehicle pages | ✅ |
| Block `/seo-data/` | ✅ |

---

## 3. Canonical checks

- [ ] Discovery pages use `https://evsavari.com/best-evs/*`, `/compare/*`, `/brands/*`, `/cities/*`, `/ownership-guides/*`
- [ ] Legacy `/cars/best-evs-*` URLs redirect or canonicalise to discovery paths
- [ ] Vehicle pages canonical to `/cars/:familySlug` (no stray query params in sitemap)
- [ ] Compare tool session URLs (`/compare?cars=`) blocked in robots — editorial compares at `/compare/:slug` indexed

Run: `npm run seo:qa` — expect **0 errors**.

---

## 4. Structured data coverage

| Page type | Schema types | Status |
|-----------|--------------|--------|
| Vehicle detail (`/cars/:slug`) | Product, BreadcrumbList, FAQPage | ✅ Runtime via CarDetails |
| Brand pages (`/brands/:brand`) | BreadcrumbList, Article, ItemList, FAQPage | ✅ DiscoverySeoPage |
| Compare guides (`/compare/:slug`) | BreadcrumbList, ItemList, FAQPage | ✅ DiscoverySeoPage + ComparePage |
| Guide pages (best-evs, ownership, charging) | BreadcrumbList, Article, ItemList, FAQPage | ✅ DiscoverySeoPage |
| Guides hub (`/guides`) | BreadcrumbList, WebPage | ✅ SeoGuidesHub |

Validate in GSC → Enhancements after deploy.

---

## 5. Indexability checklist

### Pre-launch (local)

- [ ] `npm run content:generate` — 157 manifest pages
- [ ] `npm run build:sitemaps` — robots.txt + XML regenerated
- [ ] `npm run seo:sitemap-audit` — manifest ↔ XML parity
- [ ] `npm run seo:qa` — 0 errors
- [ ] `npm run gsc:verify` — preflight pass
- [ ] `npm run build` — production build pass

### Post-deploy (GSC)

- [ ] Verify property: `https://evsavari.com`
- [ ] Submit sitemap: `https://evsavari.com/sitemap.xml`
- [ ] Inspect URL: home, `/cars`, top compare guide, top best-evs guide
- [ ] Request indexing for top 20 agent pages (see editorial enrichment list)
- [ ] Monitor Coverage report for `/admin`, `/crm`, `/agent` — should stay excluded
- [ ] Review Core Web Vitals for `/cars` and `/compare`

### Top 20 pages for priority indexing

1. `/best-evs/under-15-lakh-agent` — Best EVs under ₹15 lakh in India
2. `/best-evs/family-agent` — Best family EVs in India
3. `/best-evs/city-agent` — Best city EVs in India
4. `/best-evs/highway-agent` — Best highway EVs in India
5. `/best-evs/premium-agent` — Best premium EVs in India
6. `/best-evs/budget-agent` — Best budget EVs in India
7. `/compare/tata-curvv-ev-vs-mahindra-be-6-agent` — Tata Curvv EV vs Mahindra BE 6
8. `/compare/tata-punch-ev-vs-mg-windsor-ev-agent` — Tata Punch EV vs MG Windsor EV
9. `/compare/byd-atto-3-vs-hyundai-creta-electric-agent` — BYD Atto 3 vs Hyundai Creta Electric
10. `/best-evs/top-10-agent` — Top 10 EVs in India
11. `/best-evs/fastest-charging-agent` — Fastest charging EVs in India
12. `/best-evs/longest-range-agent` — Longest range EVs in India
13. `/best-evs/safest-agent` — Safest EVs in India
14. `/best-evs/best-value-variants-agent` — Best value EV variants in India
15. `/best-evs/fastest-charging-variants-agent` — Fastest charging EV variants in India
16. `/best-evs/longest-range-variants-agent` — Longest range EV variants in India
17. `/best-evs/tata-nexon-ev-best-value-variant-agent` — Best value variant — Tata Nexon EV
18. `/best-evs/tata-punch-ev-best-value-variant-agent` — Best value variant — Tata Punch EV
19. `/best-evs/tata-nexon-ev-fastest-charging-variant-agent` — Fastest charging variant — Tata Nexon EV
20. `/best-evs/tata-punch-ev-longest-range-variant-agent` — Longest range variant — Tata Punch EV

---

## Commands

```bash
npm run seo:growth-phase2
npm run seo:sitemap-audit
npm run gsc:verify
npm run seo:qa
npm run build
```
