# Real-World Content Expansion Helpers

Operator workflows during validation — no platform redesign.

## Add SEO guide

1. Registry: `zyvev-backend/services/seo-pages/registry.js`
2. Frontend slugs: `src/data/seoPageSlugs.js`
3. Static JSON: `public/seo-data/{slug}.json`
4. Pre-publish: [pre-publish-checklist.md](./pre-publish-checklist.md)
5. `node scripts/build-sitemaps.mjs` → deploy
6. GSC: URL inspection + optional indexing request

## Add Tier-1 vehicle

1. Variant JSON in tier-1 catalog path
2. Slug ≠ reserved SEO slug
3. `audit-catalog-slugs.js` / canonical audit
4. Rebuild sitemaps → deploy
5. GSC indexing request for new vehicle URL only

## Compare operations

- Compare is hub `/compare` — no new compare “pages” per pair
- Tune copy/CTAs from `ops:behavioral-quality` top pairs
- Ensure compare in sitemap shard unchanged unless hub URL changes

## Rebuild sitemaps (safe)

```bash
node scripts/build-sitemaps.mjs
npm run validate:production
npm run ops:crawl
```

## Before every publish

```bash
node scripts/audit-canonical-seo.js
node scripts/audit-structured-data.js
npm run validate:real-world
```

## Record market learning

After publish, log GSC impressions/clicks in `ops/traffic-observations.jsonl` for the new URL.
