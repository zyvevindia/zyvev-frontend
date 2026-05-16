# Runbook: Broken Route Response

## Symptoms

- 404 on `/cars/{slug}` that should exist
- SEO guide shows vehicle detail or vice versa
- Legacy `/car/{slug}` not redirecting

## Steps

1. Confirm slug in Tier-1 catalog vs SEO reserved list.
2. Check `CarsSlugRouter` / `vehicleDetailResolver` / `seoPageSlugs.js` sync.
3. Run routing docs audit path from `docs/routing-seo-integrity/`.
4. Verify `vercel.json` SPA fallback does not swallow static assets.

## Fix patterns

- Vehicle 404: add/fix Tier-1 JSON; rebuild sitemaps
- Wrong template: slug missing from SEO registry → add or rename vehicle slug
- Redirect loop: check `LegacyCarRedirect` and canonical helpers

## Verify

- Manual: vehicle URL, SEO URL, `/compare`, `/cars`
- `node scripts/audit-internal-links.js`

## Rollback

Revert routing commit; redeploy frontend only if API unchanged.
