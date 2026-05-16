# Common Indexing Failure Scenarios

## Soft 404 on valid pages

**Symptoms:** GSC shows “Soft 404” or empty page for `/cars/{slug}`.

**Causes:**

- SPA returns generic shell with no meaningful content for bots
- Slug not in Tier-1 catalog or SEO registry → client shows not-found

**Actions:**

1. Confirm slug exists: Tier-1 JSON or `seo-pages/registry.js` + `src/data/seoPageSlugs.js`.
2. URL inspection → view rendered page / rich results test.
3. Ensure JSON-LD present (`structuredData.js` on detail/SEO/compare).
4. Rebuild sitemaps and resubmit if slug was newly added.

## Sitemap “Couldn’t fetch”

**Symptoms:** GSC sitemap status failed.

**Actions:**

1. `curl -I https://evsavari.com/sitemap.xml` — expect `200` and `application/xml`.
2. Confirm Vercel does not rewrite sitemap to `index.html`.
3. Re-run `build-sitemaps.mjs` and redeploy frontend `public/`.

## Crawled — currently not indexed

**Symptoms:** URL in sitemap, crawled, not in index.

**Actions:**

- Add internal links from high-traffic pages (`/cars`, homepage, related guides).
- Strengthen unique title/description on page.
- Avoid thin duplicate content across similar SEO guides.
- Wait 2–4 weeks after fix before escalating; do not spam request indexing.

## Discovered — currently not crawled

**Symptoms:** URL listed in sitemap but not crawled.

**Actions:**

- Verify not blocked in robots.txt.
- Check sitemap entry uses canonical `https://evsavari.com/cars/...` path.
- Reduce orphan status: `report-seo-operations.js` → `orphanDetection`.

## Duplicate without user-selected canonical

**Symptoms:** Multiple URLs for same content.

**Actions:**

1. Run `audit-canonical-seo.js`.
2. Ensure legacy `/car/{slug}` 301/redirects to `/cars/{slug}`.
3. Remove query-string URLs from index (robots disallows `/*?*`).

## Reserved slug collision

**Symptoms:** Vehicle 404 or SEO page shows wrong content.

**Actions:**

- SEO slugs in backend registry must match frontend `seoPageSlugs.js`.
- Vehicle slug must not match reserved SEO slug list.
- Run routing integrity audit from `docs/routing-seo-integrity/`.

## Compare or static pages missing

**Symptoms:** `/compare` or `/cars` not indexed.

**Actions:**

- Confirm entries in static sitemap shard.
- Check `index, follow` robots meta on route.
- Verify BreadcrumbList JSON-LD on compare hub.
