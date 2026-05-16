# Runbook: Failed Deploy Rollback

## Symptoms

- Site blank or widespread 500
- API health check fails
- Spike in client errors (`productionLog` / host logs)

## Frontend (Vercel)

1. Vercel dashboard → Deployments → previous **Production** deployment → **Promote**.
2. Confirm `vercel.json` rewrites still serve static sitemap/robots.
3. Smoke: `/`, `/cars`, one vehicle URL, one SEO guide, `/compare`.

## Backend

1. Redeploy last known good API image/commit.
2. Verify env matches intended launch profile (`validate-launch-profile.js`).
3. Do **not** change `MONGO_URI` or secrets during rollback.

## Post-rollback

- Run `audit-soft-launch-readiness.js` if available
- Note incident time and commit SHA
- Root-cause before re-attempting deploy

## Feature-flag fast disable

If issue is intelligence/behavioral only:

- Set `BEHAVIORAL_INTELLIGENCE_ENABLED=false` and `VITE_BEHAVIORAL_INTELLIGENCE=false`
- Redeploy API + frontend
- See [disable-behavioral-tracking.md](./disable-behavioral-tracking.md)
