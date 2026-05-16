# Search Console & Indexing Readiness

Infrastructure checklist — no automated GSC/Bing API yet.

## Prerequisites

- [ ] Production domain serves static `sitemap.xml` (not SPA HTML)
- [ ] `robots.txt` references sitemap index
- [ ] Canonical tags match sitemap URLs (`https://evsavari.com/cars/{slug}`)
- [ ] Reserved SEO slugs do not collide with vehicle slugs (audited)

## Google Search Console

1. Add property: `https://evsavari.com`
2. Verify via DNS or HTML file
3. Submit sitemap: `https://evsavari.com/sitemap.xml`
4. URL inspection samples:
   - Vehicle: `/cars/tata-nexon-ev-empowered-lr`
   - SEO: `/cars/best-evs-for-city-driving`
   - Compare: `/compare`

## Indexability signals (in app)

| Page | robots | canonical | JSON-LD |
|------|--------|-----------|---------|
| Vehicle detail | index | `/cars/{slug}` | Vehicle, Breadcrumb, FAQ* |
| SEO guide | index | `/cars/{seo-slug}` | Breadcrumb, FAQPage |
| Compare hub | index | `/compare` | Breadcrumb, ItemList |

\* FAQ when catalog provides FAQ blocks

## Bing Webmaster Tools

Mirror GSC steps with the same sitemap URL.

## Diagnostics to watch

- Soft 404 on SPA routes → ensure Vercel serves static XML before rewrite
- Duplicate without user-selected canonical → run `audit-canonical-seo.js`
- Crawled not indexed → strengthen internal links from `/cars` and SEO guides
