# Production Cutover Report

**Generated:** 2026-05-16  
**Target origin:** https://evsavari.com

## Cutover readiness (codebase)

| Gate | Status |
|------|--------|
| Tier-1 catalog (29 variants) | Pass |
| Sitemap / robots (repo) | Pass — 52 URLs |
| Canonical audit (local) | 0 errors |
| Structured data audit | 0 errors |
| Public beta checklist | 13/13 |
| Controlled launch | launchReady true |
| Observation coverage | **22 / 29** variants |

## Environment cutover (deploy host)

Set on **frontend** (Vercel):

```env
VITE_LAUNCH_PROFILE=public-beta
VITE_CATALOG_INTELLIGENCE=true
VITE_CATALOG_DETAIL_ENRICH=true
VITE_BEHAVIORAL_INTELLIGENCE=true
VITE_SEO_PAGES=true
VITE_API_URL=<production-api-url>
```

Set on **backend**:

```env
BEHAVIORAL_INTELLIGENCE_ENABLED=true
CATALOG_INTELLIGENCE_ENABLED=true
SEO_PAGES_ENABLED=true
SITE_ORIGIN=https://evsavari.com
USE_EV_MASTER=true
```

Validate: `node scripts/validate-launch-profile.js public-beta`

## Live verification commands (run post-deploy)

```bash
cd zyvev-backend
npm run ops:production-activation -- --live https://evsavari.com
npm run ops:live-smoke https://evsavari.com
node scripts/validate-production-deployment.js --live https://evsavari.com
npm run ops:daily-live-ops -- --db
```

**Note:** Automated live HTTP probes from the build environment may fail (network/DNS). Re-run from operator machine or CI with egress to production.

## Rollback

1. Disable `BEHAVIORAL_INTELLIGENCE_ENABLED`  
2. Revert `VITE_LAUNCH_PROFILE` to `soft-launch`  
3. Redeploy previous artifact + sitemap if URL set changed  

## Sign-off

| Check | Owner | Done |
|-------|-------|------|
| Env vars on Vercel | Ops | ☐ |
| Backend env | Ops | ☐ |
| Live smoke pass | Ops | ☐ |
| GSC sitemap submit | Ops | ☐ |
