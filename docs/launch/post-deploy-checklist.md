# Post-deploy checklist — EVSavari

Use immediately after production deploy completes (Vercel green).

---

## T+0 (first 5 minutes)

- [ ] Vercel deployment status: **Ready**
- [ ] Note deploy commit SHA: `____________`
- [ ] `npm run launch:validate` against production API (or use `/admin/launch-status`)
- [ ] `EVSAVARI_SITE_ORIGIN=https://evsavari.com EVSAVARI_API_URL=<prod-api> npm run deploy:smoke` — all green
- [ ] Hard-refresh homepage — no console errors (buyer site)

---

## T+15 (buyer smoke)

- [ ] Homepage — curated sections, no pagination
- [ ] Flagship detail pages load with real images
- [ ] Compare with 2 vehicles
- [ ] Test lead submit → visible in Admin CRM
- [ ] Complete `founder-live-qa.md` or abbreviated mobile pass

---

## T+60 (ops)

- [ ] Admin → Leads — QA test lead assigned or deleted
- [ ] Media QA — no new broken-image alerts
- [ ] Traffic intelligence — events flowing (if behavioral tracking on)
- [ ] Search Console — no new crawl errors (if configured)

---

## T+24h

- [ ] Review lead volume and dealer response times
- [ ] Check Cloudinary CDN cache on top 3 families
- [ ] Remove or archive QA test data
- [ ] Note any launch telemetry anomalies (`metadata.launchHook: day2_launch`)

---

## Rollback trigger

Rollback if any of:

- Catalog API unreachable for >5 min
- Mass broken images on tier-1 families
- Lead form 5xx on submit
- Critical routing/404 on flagship URLs

See `docs/deploy/rollback-and-recovery.md` (this repo) and `critical-issue-playbook.md` if present.

---

## Cleanup (after stabilization)

Removable launch-only code (safe to delete when stable):

- `src/launch/launchTelemetry.js` and call sites
- `src/launch/devDiagnostics.js` (if unused)
- `/admin/launch-status` route (optional keep for ops)
- `npm run launch:validate` script (optional keep)

Keep: `safeFetch.js`, media fallbacks, ops QA pages.
