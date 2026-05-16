# Canonical Mismatch Troubleshooting

## Principles

- **Canonical vehicle URL:** `https://evsavari.com/cars/{tier1-slug}`
- **Canonical SEO guide URL:** `https://evsavari.com/cars/{seo-slug}` (reserved slugs only)
- **Legacy:** `/car/{slug}` must redirect to `/cars/{slug}`

## Diagnostic steps

1. View page source → `<link rel="canonical" href="...">`.
2. Compare to sitemap URL for same path (`report-seo-operations.js` → `canonicalConsistency`).
3. GSC URL inspection → user-declared vs Google-selected canonical.

## Common mismatches

| Issue | Fix |
|-------|-----|
| Canonical still `/car/...` | Update `vehicleRoutes.js` / Helmet canonical helper |
| HTTP vs HTTPS | Force `https://evsavari.com` in `siteOrigin` |
| Trailing slash drift | Standardize no trailing slash except root |
| SEO slug treated as vehicle | Add slug to SEO registry; remove from vehicle resolver |
| Compare URL wrong | Compare page canonical must be `/compare` only |

## Pre-deploy gate

```bash
cd zyvev-backend
node scripts/audit-canonical-seo.js
node scripts/report-seo-operations.js
```

Deploy only when `canonicalConsistency.errors === 0`.

## Rollback

If bad canonicals shipped:

1. Revert routing/SEO commit.
2. Rebuild sitemaps.
3. Request indexing for affected URLs only after fix is live.
