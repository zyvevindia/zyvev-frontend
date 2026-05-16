# Pre-Publish SEO Governance Checklist

## Content

- [ ] Unique title and meta description per page
- [ ] H1 matches search intent (not duplicate across guides)
- [ ] FAQ blocks valid for JSON-LD (if present)
- [ ] No placeholder or lorem copy

## Technical

- [ ] Slug in backend registry **and** frontend `seoPageSlugs.js`
- [ ] `public/seo-data/{slug}.json` for soft-launch path
- [ ] Canonical = `https://evsavari.com/cars/{slug}`
- [ ] BreadcrumbList + FAQPage (guides) or Vehicle (detail) schema
- [ ] No collision with Tier-1 vehicle slug

## Links

- [ ] Linked from at least one high-traffic internal page
- [ ] No broken outbound or internal links (`audit-internal-links.js`)

## Crawl

- [ ] Included in `seo-pages.xml` after sitemap rebuild
- [ ] Not blocked by robots.txt
- [ ] Orphan audit clean (`report-seo-operations.js`)

## Launch profile

- [ ] `validate-launch-profile.js` passes for target profile
- [ ] Behavioral flags match privacy review if leads attach intent context

## Post-publish

- [ ] GSC URL inspection on new URL (optional)
- [ ] Note publish date in content ops log
