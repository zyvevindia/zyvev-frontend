# Soft Launch Readiness

Operational validation checklist before exposing EVSavari to real traffic.

## Automated gates

Run from `zyvev-backend`:

```bash
node scripts/audit-soft-launch-readiness.js
node scripts/validate-search-console-readiness.js
node scripts/report-platform-health.js --db
```

Individual audits:

| Script | Purpose |
|--------|---------|
| `audit-internal-links.js` | Broken routes, compare links, SEO orphans |
| `audit-structured-data.js` | JSON-LD / FAQ / Vehicle schema |
| `audit-crawl-simulation.js` | Link graph depth & orphans |
| `audit-lead-pipeline.js` | Lead flow wiring (`--db` for samples) |
| `audit-performance-sanity.js` | Bundle size (requires `npm run build`) |
| `validate-launch-profile.js soft-launch` | Env matches profile |

## Launch profiles

| Profile | Use case |
|---------|----------|
| `staging` | Internal QA, flags off |
| `soft-launch` | Public catalog + static SEO JSON, behavioral off |
| `public-beta` | Full intelligence + events |

See `zyvev-backend/config/launchProfiles.js`.

## SEO & indexing

- [ ] `npm run build` regenerates sitemaps + `robots.txt`
- [ ] `curl /sitemap.xml` returns XML (not HTML)
- [ ] Submit sitemap in Search Console
- [ ] Canonical audit passes
- [ ] Structured-data audit passes

## Routing

- [ ] `/cars/{vehicle-slug}` → detail
- [ ] `/cars/{seo-slug}` → SEO guide
- [ ] `/car/{slug}` → redirects to `/cars/{slug}`
- [ ] Admin/sales paths blocked in robots.txt

## Lead flow

1. Open SEO guide → click vehicle → detail
2. Add to compare → open compare → request callback
3. Submit lead with valid phone
4. Verify lead in admin with `sourcePage`
5. Optional: `GET /api/admin/leads/:id/intent-summary` (admin JWT) — dealer-safe summary only

**Privacy:** behavioral events must not contain name/phone/email.

## Observability

- Structured logs: `[EVSavari]` in browser console; JSON lines on backend
- Health: `report-platform-health.js --db` when Mongo available
- Error boundary: no white screen on React errors

## Rollback

| Risk | Action |
|------|--------|
| Bad SEO pages | Remove slug from registry; rebuild sitemaps |
| Behavioral issues | `BEHAVIORAL_INTELLIGENCE_ENABLED=false` |
| Intelligence UI | `VITE_CATALOG_INTELLIGENCE=false` |
| Full revert | Redeploy previous Vercel deployment |

## Staging validation (15 min)

1. Run `audit-soft-launch-readiness.js` → `launchReady: true`
2. Deploy preview; test 3 URLs + lead submit
3. Confirm `robots.txt` and sitemap on preview host
4. Enable Search Console on production domain after cutover
