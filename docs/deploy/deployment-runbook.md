# Deployment runbook — EVSavari frontend

Audience: engineer or technical founder running a controlled production release.

---

## Pre-launch checklist (before merge / promote)

- [ ] **PR green**: GitHub Actions `CI` workflow passed (`build`, `post-launch:smoke`).
- [ ] **Lint** (optional local): `npm run lint` — not required in CI until backlog is cleared.
- [ ] **Env**: Production variables set per [production-env-checklist.md](./production-env-checklist.md).
- [ ] **API**: `VITE_API_URL` points to production API; CORS allows `https://evsavari.com`.
- [ ] **DNS**: Apex (+ optional `www` redirect) point to Vercel as per [domain-seo-deployment.md](./domain-seo-deployment.md).
- [ ] **Secrets**: No secrets in repo; Turnstile secret only on API ([secrets-handling.md](./secrets-handling.md)).

---

## Standard release (happy path)

1. **Merge** to `main` (or your production branch) after CI passes.
2. **Vercel** builds with:
   - **Install**: `npm ci` (recommended) or `npm install`
   - **Build command**: `npm run build` (must run `prebuild` for content + sitemaps)
   - **Output directory**: `dist`
3. Wait for deployment **Ready**.
4. Run **post-deploy smoke** from any machine:
   ```bash
   EVSAVARI_SITE_ORIGIN=https://evsavari.com EVSAVARI_API_URL=https://<your-api-host> npm run deploy:smoke
   ```
5. Run **API + media validation** (optional but launch days):
   ```bash
   VITE_API_URL=https://<your-api-host> npm run launch:validate
   ```
6. Complete **human** checks in `docs/launch/post-deploy-checklist.md` (compare, lead, mobile).

---

## Launch-day operational checklist (hour 0–2)

- [ ] `deploy:smoke` all green
- [ ] Homepage + one flagship detail + compare (2 cars)
- [ ] Test lead → appears in admin CRM
- [ ] Admin login (if applicable) on production
- [ ] GSC: property verified; sitemap submitted (if not already)
- [ ] Analytics: real-time / debug view shows session (GA4 or PostHog)
- [ ] No spike of 4xx on `/seo-data/` in CDN logs

---

## First 24 hours monitoring

- [ ] GSC **Coverage** / **Pages** — no sudden spike in errors
- [ ] Error tracking (Sentry) — no new release regression
- [ ] API latency and 5xx rate on host dashboard (Render/Railway)
- [ ] Lead volume vs baseline; failed submits
- [ ] Ops dashboards: traffic intelligence, indexing observability (admin)

---

## Rollback

See [rollback-and-recovery.md](./rollback-and-recovery.md) — promote previous Vercel deployment.

---

## Backend deploy (same release window)

Coordinate API deploy with frontend when **breaking** API changes ship. Order of operations:

1. Deploy **backward-compatible** API first (if needed).
2. Deploy **frontend** with new env expectations.
3. If API must break: maintenance note via `VITE_MAINTENANCE_NOTE`, then deploy API, then frontend.

Details: [backend-production.md](./backend-production.md).
