# SEO Content Operations

Lightweight workflows for expanding programmatic SEO without breaking governance.

## Adding a new SEO guide page

1. **Backend registry** — add slug + metadata in `services/seo-pages/registry.js` (generator config).
2. **Frontend slug list** — sync `src/data/seoPageSlugs.js` (must match registry).
3. **Generate content** — run SEO build/audit scripts per `docs/seo-authority-infrastructure/`.
4. **Static fallback** — ensure `public/seo-data/{slug}.json` exists for soft-launch (`SEO_PAGES_ENABLED=false`).
5. **Internal links** — link from `/cars` hub and related guides/compare where relevant.
6. **Governance check** — see [pre-publish-checklist.md](./pre-publish-checklist.md).
7. **Sitemap** — `node scripts/build-sitemaps.mjs` and deploy.

## Expanding compare pages

Compare URLs are hub-driven (`/compare` + query pairs), not per-slug pages.

- Update compare SEO copy in compare components only when needed.
- Ensure compare pairs in sitemap reflect allowed hub URLs (`compare.xml` shard).
- Run `audit-structured-data.js` after compare schema changes.

## Adding new Tier-1 variants

1. Add variant JSON under `docs/architecture/catalog/tier-1/`.
2. Verify slug uniqueness vs SEO reserved slugs.
3. Run catalog/SEO audits.
4. Rebuild sitemaps.
5. Request GSC indexing for new vehicle URL only (optional).

## Rebuilding sitemaps safely

See [../search-operations/sitemap-refresh.md](../search-operations/sitemap-refresh.md).

Order: catalog change → SEO registry (if any) → `build-sitemaps.mjs` → canonical audit → deploy.

## Validating SEO governance before publish

Use [pre-publish-checklist.md](./pre-publish-checklist.md).

Minimum commands:

```bash
node scripts/audit-canonical-seo.js
node scripts/audit-structured-data.js
node scripts/audit-internal-links.js
node scripts/report-seo-operations.js
```

## Feature flags reminder

| Profile | SEO API | Static JSON |
|---------|---------|-------------|
| soft-launch | off | required |
| public-beta | on | optional backup |

Do not enable `SEO_INTELLIGENCE_PUBLIC` without catalog intelligence review.
