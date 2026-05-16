# Production Activation Checklist

Use immediately **before and after** first production deploy with controlled public beta.

## Pre-deploy (local/staging)

```bash
cd zyvev-backend
npm run ops:controlled-launch
npm run ops:public-beta
node scripts/audit-soft-launch-readiness.js
node scripts/build-sitemaps.mjs
```

## Frontend environment (Vercel / host)

```env
VITE_LAUNCH_PROFILE=public-beta
VITE_CATALOG_INTELLIGENCE=true
VITE_CATALOG_DETAIL_ENRICH=true
VITE_BEHAVIORAL_INTELLIGENCE=true
VITE_SEO_PAGES=true
VITE_API_URL=https://api.evsavari.com
```

## Backend environment

```env
NODE_ENV=production
SITE_ORIGIN=https://evsavari.com
USE_EV_MASTER=true
CATALOG_INTELLIGENCE_ENABLED=true
SEO_PAGES_ENABLED=true
BEHAVIORAL_INTELLIGENCE_ENABLED=true
MONGO_URI=...
```

Validate profile locally:

```bash
node scripts/validate-launch-profile.js public-beta
```

## Post-deploy verification

```bash
node scripts/audit-production-activation.js --live https://evsavari.com
node scripts/validate-production-deployment.js --live https://evsavari.com
npm run ops:search-console
```

## Smoke tests (manual)

- [ ] Homepage loads; PublicBetaBanner visible
- [ ] `/cars/tata-nexon-ev-creative-plus` — trust block renders
- [ ] `/compare` — add 2 vehicles; trust panel shows
- [ ] SEO guide e.g. `/cars/best-evs-for-apartment-living`
- [ ] Lead form submit (staging or prod test lead)
- [ ] `robots.txt` + `sitemap.xml` on live origin

## Rollback

1. Revert env to `soft-launch`; disable `BEHAVIORAL_INTELLIGENCE_ENABLED` first  
2. Redeploy previous frontend build  
3. Resubmit prior sitemap only if URL set changed  
