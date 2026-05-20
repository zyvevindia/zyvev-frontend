# Google Search Console and indexing readiness

Operational checklist for EVSavari controlled public soft launch. Pair with admin **Indexing observability** (`/admin/traffic-intelligence` or ops QA) and `npm run gsc:verify`.

## 1. Property and verification

1. In [Google Search Console](https://search.google.com/search-console), add the **URL-prefix** property for production origin (for example `https://evsavari.com/`).
2. Complete **DNS** or **HTML file** verification as offered by Google. For SPA deployments, prefer DNS TXT at the registrar when available.
3. Confirm **owners** and **full users** for the ops team (least privilege for contractors).

## 2. Sitemaps

1. Submit the sitemap index URL: `https://evsavari.com/sitemap.xml`.
2. After each meaningful deploy, use **Sitemaps → Resubmit** or wait for automatic recrawl (no need to resubmit on every trivial change if the index URL is stable).
3. Locally validate before deploy:
   - `npm run gsc:verify` — robots, sitemap index children, discovery hygiene.
   - `npm run seo:qa` — static SEO JSON and manifest checks.

## 3. Coverage and indexing observation

1. **Pages** report: watch **Excluded** and **Crawled – currently not indexed** for spikes after releases.
2. **Sitemaps** report: ensure **Success** and discovered URL counts move in line with manifest growth.
3. **Removals** (temporary): use only for urgent mistakes; do not use for routine soft launch.

## 4. Crawl issues (internal)

Use admin **Indexing observability** for this build:

- Canonical consistency warnings (manifest sample).
- Sitemap vs **discovery-index** drift (orphan registry paths, sitemap-only URLs).
- Conditional **noindex** presets (thin-result discovery pages).

Fix source data and rebuild static SEO assets; avoid patching only in Search Console unless necessary.

## 5. Experience and signals

1. **Core Web Vitals** and **HTTPS** should stay green; regressions block scaling traffic.
2. **Mobile Usability**: spot-check compare and discovery templates on real devices.
3. **Links**: prefer internal links from high-traffic hubs to new discovery URLs (reduces “discovered – currently not indexed” lag).

## 6. Cadence

| When | Action |
|------|--------|
| Daily (first 2 weeks) | GSC Pages + Sitemaps; admin indexing card; note anomalies in ops discipline hub checklist |
| Weekly | `gsc:verify` + `seo:qa` in CI or before promote; review orphan / weak discovery lists |
| Post-release | Compare smoke, trust smoke, catalog ops smoke (`npm run post-launch:smoke`) |

## 7. What we do not do here

- No third-party enterprise SEO suites in product.
- No “fake” index or impression data in-app; estimates are manifest-based and clearly labeled in the UI.
