# Controlled public launch — operational checklists

Complements `docs/ops/controlled-public-cadence.md` (editorial / catalog ops). This file is **deployment + exposure** focused.

## Launch day (T+0)

- [ ] Production deploy completed; `deploy:smoke` green
- [ ] [H] War-room: one owner for **frontend** Vercel, one for **API** host
- [ ] [H] Status page / comms: only if user-visible incident (keep noise low)
- [ ] Soft-launch / public-beta copy reviewed (`VITE_LAUNCH_*`, `VITE_OPS_*`)
- [ ] [H] GSC: sitemap already submitted; no duplicate conflicting properties for www vs apex

## First 24 hours (T+24h)

- [ ] Re-run `deploy:smoke` twice (morning / evening) or after any API deploy
- [ ] Compare monitoring: completion / drop-off in analytics (same window as pre-launch baseline)
- [ ] Trust monitoring: no spike in trust-related feedback category (local buffer + support)
- [ ] SEO: GSC “Pages” + **enhancements** errors; fix forward only with human review
- [ ] Ingestion: no unapproved bundles applied; queue depth normal

## First week cadence

- [ ] Daily: ops discipline hub snapshot (15 min) — see `docs/ops/controlled-public-cadence.md`
- [ ] Weekly: GSC indexing review + internal `seo:qa` on main after content merges
- [ ] Real-user learning: theme triage from `/admin/real-usage-learning`

## GSC monitoring checklist

- [ ] Property = **canonical** `https://evsavari.com/` (or domain property aligned with apex)
- [ ] Sitemap: `https://evsavari.com/sitemap.xml` — **Success** fetch
- [ ] Page indexing: watch “Discovered / crawled — not indexed” for **compare** and **discovery** templates
- [ ] Manual URL inspection: 2× compare URLs + 2× discovery URLs after major deploy

## Analytics monitoring checklist

- [ ] GA4 (or PostHog): realtime users during launch window
- [ ] Key events: compare start/complete, lead submit (if tagged)
- [ ] Error rate: Sentry (if enabled) — new release tag `VITE_APP_RELEASE`

## Compare monitoring checklist

- [ ] Editorial compare URLs load on **hard refresh** (SPA rewrite)
- [ ] Share URLs use `/compare/:slug` canonical pattern
- [ ] Trust blocks render on mobile width for top pair

## Trust monitoring checklist

- [ ] No accidental “stale” or “unverified” copy regression on flagship families
- [ ] Governance audit partials unchanged vs baseline (trust smoke in CI)

## Ingestion monitoring checklist

- [ ] Local/browser queue: stale pending &gt;7d addressed or intentionally deferred
- [ ] Telemetry: repeated taxonomy hints reviewed (`/admin/catalog-ingestion`)
- [ ] No autonomous publish — bundles only through approved pipeline

## API / backend (sibling repo)

- [ ] Rate limits enabled; Turnstile on public forms
- [ ] Logs: error rate stable; no DB connection pool exhaustion
