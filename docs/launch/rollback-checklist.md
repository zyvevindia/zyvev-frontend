# Rollback checklist

**Goal:** Restore last known-good buyer experience without SEO/routing churn.

## Frontend (Vercel / static host)

1. Identify last green deploy in hosting dashboard
2. Roll back to previous deployment (instant on Vercel)
3. Verify: `/`, `/cars`, `/cars/tata-nexon-ev`, `/compare`, one SEO guide
4. Confirm `robots.txt` and sitemaps unchanged vs prior deploy

## Backend (Render)

1. Roll back API service to previous deploy
2. Smoke: `GET /cars?limit=1`, `POST /api/feedback` (optional), test lead
3. If Mongo migration was part of bad deploy, restore DB snapshot per host policy

## Do not rollback

- SEO JSON in `public/seo-data/` unless a specific page is corrupt
- Family/variant URL structure
- Canonical tags without SEO owner approval

## After rollback

- [ ] Post in ops channel: scope, root cause (if known), next fix window
- [ ] Run `npm run media:audit` and `npm run seo:qa` on rolled-back frontend commit
- [ ] Schedule fix-forward PR with smaller diff
