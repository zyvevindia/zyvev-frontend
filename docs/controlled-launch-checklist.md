# Controlled Launch Checklist

Use before enabling **limited public traffic** on production.

## Automated (backend)

```bash
cd zyvev-backend
npm run ops:controlled-launch      # launch + beta gates
npm run ops:public-beta
node scripts/audit-soft-launch-readiness.js
npm run ops:search-console
npm run ops:mobile-readiness
```

Expected: `launchReady: true`, `betaReady: true`, canonical/structured data **0 errors**.

## Environment

| Surface | Setting |
|---------|---------|
| Frontend | `VITE_LAUNCH_PROFILE=public-beta` |
| Backend | `LAUNCH_PROFILE=public-beta` (if gated) |
| Behavioral | `BEHAVIORAL_INTELLIGENCE_ENABLED=true` when ready to learn |
| Origin | `SITE_ORIGIN=https://evsavari.com` |

Validate: `node scripts/validate-launch-profile.js public-beta`

## Public UX

- [ ] `PublicBetaBanner` visible only under `public-beta` profile
- [ ] Homepage → catalog → detail trust flow readable
- [ ] Compare + lead CTA work on mobile (375px manual QA)
- [ ] No admin/sales routes indexed (`robots.txt`)

## SEO / crawl

- [ ] `npm run build-sitemaps` run after last catalog/SEO change
- [ ] `sitemap.xml` submitted in GSC + Bing
- [ ] URL inspection: 1 vehicle, 1 SEO guide, `/compare`

## Rollback

1. Revert launch profile to `soft-launch`
2. Disable behavioral ingestion
3. Redeploy previous sitemap if URL set changed

See [controlled-launch-operations.md](./controlled-launch-operations.md).
