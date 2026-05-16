# Production Deployment Validation

Post-deploy confidence checks for EVSavari real-world launch.

## CLI (backend repo)

```bash
cd zyvev-backend

# Static artifact + code audits (no network)
npm run validate:production

# After deploy — live HTTP checks
node scripts/validate-production-deployment.js --live https://evsavari.com

# Include lead continuity DB sample
node scripts/validate-production-deployment.js --db --continuity
```

## What is validated

| Area | Static | Live (`--live`) |
|------|--------|-----------------|
| robots.txt | file present + Sitemap directive | HTTP 200 |
| sitemap.xml + shards | files present | HTTP 200 + index XML |
| Canonical consistency | audit (0 errors) | — |
| Structured data | static SEO JSON + builders | — |
| Vehicle / SEO / compare routes | catalog + JSON fallback | HTTP 200 (SPA shell) |
| Lead pipeline code | wired end-to-end | — |
| Behavioral ingestion | route exists | `/api/behavioral/status` |

**SPA note:** Live HTML is the app shell. Canonical and JSON-LD are validated via static/code audits, not live HTML parsing.

## Post-deploy checklist

- [ ] `validate:production` exits 0
- [ ] `audit-real-world-validation.js` exits 0
- [ ] GSC URL inspection on 1 vehicle + 1 SEO guide
- [ ] Test lead submit in production (staging first)
- [ ] `validate-launch-profile.js` matches intended profile

## Admin API (read-only)

`GET /api/admin/ops/validation-summary?days=7` — aggregated dashboard, admin auth required.

See [checklist.md](./checklist.md).

## Deploy readiness (cutover block)

| Doc | Use |
|-----|-----|
| [production-cutover-checklist.md](./production-cutover-checklist.md) | Master cutover (pre/deploy/post) |
| [production-env-checklist.md](./production-env-checklist.md) | Env var reference |
| [production-smoke-checklist.md](./production-smoke-checklist.md) | Post-deploy smoke |
| [deploy-verification-checklist.md](./deploy-verification-checklist.md) | Full verification |
| [rollback-checklist.md](./rollback-checklist.md) | Incident rollback |
| [mobile-qa-signoff.md](./mobile-qa-signoff.md) | 375px / Android sign-off |
| [mobile-friction-observations.md](./mobile-friction-observations.md) | Friction log |
