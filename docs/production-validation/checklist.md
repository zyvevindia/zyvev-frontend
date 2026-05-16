# Production Validation Checklist

## Immediately after deploy

1. **Sitemap** — `curl -I https://evsavari.com/sitemap.xml` → 200, `application/xml`
2. **Robots** — `curl https://evsavari.com/robots.txt` → Sitemap line present
3. **CLI** — `npm run validate:production` → `"ready": true`
4. **Unified audit** — `npm run validate:real-world` → `"ready": true`
5. **Smoke URLs** — open one vehicle, one SEO guide, `/compare`
6. **Lead** — submit test lead; confirm in admin/CRM
7. **Flags** — confirm behavioral on/off matches launch profile

## Within 48 hours

- [ ] GSC sitemap processed
- [ ] URL inspection: no “blocked by robots”
- [ ] `report-crawl-observations.js` — orphans documented
- [ ] `report-validation-dashboard.js --db` if DB live

## Rollback triggers

- Canonical audit errors &gt; 0 after deploy
- Sitemap 404 or returns HTML
- Lead API 5xx on submit
- Widespread vehicle 404s

See [../runbooks/deploy-rollback.md](../runbooks/deploy-rollback.md).
