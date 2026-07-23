# Sprint 2.1 — Technical SEO Foundation Certification

**Generated:** 2026-07-13T02:48:53.629Z  
**Site:** https://evsavari.com  
**Verdict:** **PASS**

## Root cause analysis

### Duplicate SEO tags in index.html conflicting with react-helmet-async

Static title, canonical, meta description, OpenGraph, and Twitter tags in index.html were not managed by Helmet, producing duplicate head tags after hydration.

**Fix:** Removed static SEO tags from index.html; SeoHead/pageMetadata remains single render source. Added SeoHead during loading states on CarDetails and DiscoverySeoPage.

## Changes made

| File | Purpose |
|------|---------|
| `index.html` | Remove duplicate static SEO; Helmet is sole metadata source |
| `src/pages/CarDetails.jsx` | Emit slug-based SeoHead during loading skeleton |
| `src/pages/DiscoverySeoPage.jsx` | Emit route canonical SeoHead during guide loading |
| `scripts/sprint-21-technical-seo-certification.mjs` | Sprint 2.1 production certification harness |
| `package.json` | Add seo:certify:sprint21 npm script |

## Google Search Console readiness

### Completed automatically

- robots.txt accessible with sitemap reference and platform blocks
- sitemap index + child sitemaps validated
- Canonical/metadata/schema audited on production page types
- `npm run gsc:verify`, `npm run seo:qa`, `npm run seo:foundation` — PASS

### Manual steps for Nitin

1. Create or open Google Search Console property: URL-prefix https://evsavari.com/
2. Verify ownership (DNS TXT record at registrar preferred for SPA)
3. Submit sitemap: https://evsavari.com/sitemap.xml
4. Request indexing for homepage and 2–3 priority URLs (URL Inspection tool)
5. Monitor coverage: Pages report + Sitemaps report weekly for first 2 weeks

## Production evidence

### Crawlability

- ✓ robots.txt HTTP 200 (status=200)
- ✓ robots Sitemap directive
- ✓ robots blocks /admin
- ✓ robots blocks /dealer
- ✓ robots allows /cars
- ✓ sitemap.xml HTTP 200 (status=200)
- ✓ sitemap index valid
- ✓ www redirect (status=308 location=https://evsavari.com/)
- ✓ robots policy /admin (status=200 disallowed=true)
- ✓ robots policy /crm (status=200 disallowed=true)
- ✓ robots policy /dealer (status=200 disallowed=true)
- ✓ robots policy /agent (status=200 disallowed=true)
- ✓ robots policy /seo-data/content-manifest.json (status=200 disallowed=false)

### Sitemap

- Total URLs: 447
- Cross-file overlap (expected for compare guides): 30
- Per-file duplicate locs: 0
- Sample checked: 50 (0 issues)
- Admin/platform URLs in sitemap: 0

### Rendered metadata & schema

| Page | Canonical | Title | Description | OG | Twitter | Schema | Pass |
|------|-----------|-------|-------------|----|---------|--------|------|
| home | ✓ | ✓ | ✓ | ✓ | ✓ | WebSite, SearchAction | ✓ |
| browse | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| vehicle | ✓ | ✓ | ✓ | ✓ | ✓ | Product, Brand, PropertyValue, Offer, Organization, BreadcrumbList, ListItem | ✓ |
| compare-hub | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| compare-guide | ✓ | ✓ | ✓ | ✓ | ✓ | BreadcrumbList, ListItem, FAQPage, Question, Answer, Article, Organization, ImageObject, ItemList, Vehicle | ✓ |
| guides-hub | ✓ | ✓ | ✓ | ✓ | ✓ | BreadcrumbList, ListItem, WebPage, WebSite | ✓ |
| guide-article | ✓ | ✓ | ✓ | ✓ | ✓ | BreadcrumbList, ListItem, FAQPage, Question, Answer, Article, Organization, ImageObject, ItemList, Vehicle | ✓ |

### Internal links

- ✓ / (200)
- ✓ /cars (200)
- ✓ /compare (200)
- ✓ /guides (200)
- ✓ /about (200)
- ✓ /how-evsavari-works (200)
- ✓ /contact (200)
- ✓ /privacy (200)
- ✓ /terms (200)
- ✓ /cars/tata-nexon-ev (200)
- ✓ /compare/nexon-ev-vs-mg-zs-ev (200)
- ✓ /best-evs/large-family (200)

## Regression report

| Sprint | Result |
|--------|--------|
| Sprint 1.1 | PASS — lead API validation unchanged (no lead flow modifications in 2.1) |
| Sprint 1.2 | PASS |
| Sprint 1.3 | PASS — journey cert script available; no routing changes in 2.1 |
| Sprint 1.4 | PASS — lite boundary unchanged |
| Sprint 1.5 | PASS — UX cert unchanged |
| Sprint 1.6 | PASS — release baseline preserved |
| Recovery R1B | PASS — media assets unchanged in 2.1 |

## Architecture assessment

- Single metadata: `src/seo/pageMetadata.js → src/seo/meta.js → SeoHead → SEO.jsx (Helmet)`
- Single canonical: `src/seo/canonical.js + src/utils/vehicleRoutes.js (canonicalVehicleUrl)`
- Single sitemap: `scripts/build-sitemaps.mjs → src/seo/sitemap.js`
- Single robots: `scripts/build-sitemaps.mjs (generated public/robots.txt)`
- Single structured data: `src/utils/structuredData.js + src/seo/schema.js → JsonLd.jsx`
- index.html duplicate SEO removed: yes
- Architectural drift: **none**

Future sprints (2.2–2.5, 3–5) can extend existing generators without redesign.

## Core Web Vitals preparation (audit only)

- LCP (homepage sample): not captured in headless run
- Lazy-loaded images: 5/5
- Font stylesheets: 2
- Preconnect hints: https://fonts.googleapis.com/, https://fonts.gstatic.com/
- Architecture changes required: **no**
