# Production deployment checklist (go / no-go)

Use immediately before and after promoting production traffic. **Human** steps are marked [H].

## Pre-deploy (same day)

- [ ] `npm run deploy:repo-check` — green
- [ ] `npm run ci:full` locally or green CI on the release commit
- [ ] [H] Vercel **Production** env: `VITE_API_URL` = HTTPS API origin (no trailing slash)
- [ ] [H] Vercel: `VITE_LAUNCH_PROFILE`, analytics (`VITE_GA_ID`, …) per [production-env-checklist.md](./production-env-checklist.md)
- [ ] [H] API host: MongoDB reachable, `CORS_ORIGIN` includes `https://evsavari.com`, Turnstile secret present
- [ ] [H] DNS: apex + **www → apex 301** (Vercel redirect + dashboard domains)
- [ ] `npm run launch:validate` against **production** API (optional but strong)

## Post-deploy (first 15 minutes)

- [ ] `EVSAVARI_SITE_ORIGIN=https://evsavari.com EVSAVARI_API_URL=<prod-api> npm run deploy:smoke` — all ✅
- [ ] [H] Browser incognito: homepage, one `/cars/:slug`, one `/compare/:slug`, one `/discover/:preset`
- [ ] [H] Mobile width (375px): same three surfaces — layout + trust blocks usable
- [ ] [H] DevTools: no mixed content; API calls HTTPS **200**
- [ ] [H] View page source or headers: homepage must **not** carry `X-Robots-Tag: noindex` (smoke checks this)

## T+24h

- [ ] GSC: coverage / errors per [domain-seo-deployment.md](./domain-seo-deployment.md)
- [ ] Analytics: sessions firing (internal dashboard)
- [ ] Compare + trust: spot-check flagship pair from ops queue

## Rollback trigger

If `deploy:smoke` fails on production or buyer-critical 5xx: follow [rollback-and-recovery.md](./rollback-and-recovery.md) — promote previous Vercel deployment first, then fix forward.
