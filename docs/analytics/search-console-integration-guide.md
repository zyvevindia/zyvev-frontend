# Search Console Integration Guide

**Scope:** Pre–Sprint 3 — manual Google setup  
**Prerequisite:** Sprint 2.7 GSC readiness certified (robots.txt + sitemaps)

---

## Property Recommendation

| Option | Recommendation |
|--------|----------------|
| **Domain property** | **Recommended** — `evsavari.com` (covers www, https, all paths) |
| URL-prefix | Fallback: `https://evsavari.com/` |

---

## Step 1 — Create Search Console Property

1. [Google Search Console](https://search.google.com/search-console)
2. Add property → **Domain** → `evsavari.com`
3. Verify via **DNS TXT record** at your domain registrar

---

## Step 2 — Submit Sitemap

After verification:

1. Sitemaps → Add new sitemap
2. Submit: `https://evsavari.com/sitemap.xml`
3. Confirm child sitemaps discovered:

| Sitemap | URLs (approx) |
|---------|---------------|
| static.xml | 13 |
| cars.xml | 25 |
| seo-pages.xml | 183 |
| compare.xml | 29 |
| ownership.xml | 202 |
| reviews.xml | 25 |

---

## Step 3 — URL Inspection

Inspect and request indexing for:

- `https://evsavari.com/`
- `https://evsavari.com/brands/tata`
- `https://evsavari.com/best-evs/city`
- `https://evsavari.com/cars/tata-nexon-ev`
- `https://evsavari.com/compare/nexon-ev-vs-mg-zs-ev`

---

## Step 4 — Link GA4 with Search Console

1. GA4 Admin → **Search Console links**
2. Link the verified Search Console property
3. Enables Search Console reports inside GA4 (queries, landing pages, countries)

---

## Recommended Filters (GA4)

Create data filters after bot traffic review:

| Filter | Type | Action |
|--------|------|--------|
| Internal traffic | Developer IP | Exclude |
| Admin paths | `page_path` contains `/admin` | Exclude (defense in depth) |

---

## Recommended Audiences

| Audience | Definition |
|----------|------------|
| Vehicle viewers | `vehicle_view` in last 7 days |
| Compare engagers | `compare_started` OR `compare_completed` |
| Lead intent | `lead_form_opened` OR `lead_started` |
| Landing explorers | `landing_viewed` ≥ 2 pages |
| Organic only | Session medium = organic (after GSC link) |

---

## Exclusions

Do not request indexing for:

- `/admin/*`
- `/dealer/*`
- `/crm/*`

These are blocked in `robots.txt`.

---

## Manual Checklist

- [ ] Create domain property
- [ ] DNS TXT verification
- [ ] Submit sitemap.xml
- [ ] URL inspection (5 priority URLs)
- [ ] Link GA4 ↔ Search Console
- [ ] Monitor Coverage report weekly
