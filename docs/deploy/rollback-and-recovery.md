# Rollback + recovery — EVSavari frontend

## Vercel rollback (fastest)

1. Open **Vercel** → Project → **Deployments**.
2. Find last **Ready** deployment before the bad release.
3. **⋯** → **Promote to Production** (or **Redeploy** previous commit).
4. Confirm `https://evsavari.com` returns expected HTML within 1–2 minutes.

**Reversible:** Yes — no DNS change.

## Failed deployment (build did not go live)

- Fix CI failure or build error; push a new commit.
- Production stays on previous deployment automatically if the new build fails.

## Smoke failure after a “green” deploy

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `deploy:smoke` robots/sitemap fail | Static files missing from artifact | Verify `npm run build` locally; check `dist/` contains `robots.txt`, `sitemap.xml` |
| `/compare` not HTML | SPA rewrite missing / wrong host | Check `vercel.json` rewrites; custom domain attached to same project |
| `content-manifest` 404 | `public/seo-data` not in deploy | Ensure `prebuild` ran; not using stripped artifact |
| API check fails | API down or wrong `EVSAVARI_API_URL` | `curl` API directly; check Render status |

## Production sanity (5 minutes)

1. Homepage load, no console errors.
2. Open flagship `/cars/:slug`.
3. Start compare with two vehicles.
4. Submit a **test** lead (then delete in admin).

## When to invoke broader incident process

- Data breach / secret leak → rotate keys, audit access logs.
- Sustained 5xx on API → scale or rollback **API** deployment (separate from frontend).

## Ingestion rollback (catalog)

- **Frontend** does not auto-publish from the ingestion UI; rollback is **do not apply** the pending publish bundle.
- If a bad bundle was already applied on the **API** / database: follow the backend runbook (`docs/ingestion/`, backend migrations) — restore from backup or forward-fix with a reviewed corrective import. Never “patch” production data without human review.

## Catalog / SEO artifact rollback

- If a release wrongly changed `public/seo-data` or sitemaps: **revert the git commit** and redeploy, or promote the previous Vercel deployment that contained known-good static files.
- Re-run `npm run seo:qa` and `npm run deploy:smoke` after rollback.

## Smoke failure responses

| Failed check | First action |
|--------------|----------------|
| `robots.txt` / `sitemap.xml` | Confirm `prebuild` ran in the build; inspect `dist/` on the broken deployment artifact |
| Deep route not HTML | `vercel.json` rewrites; custom domain pointing at wrong project |
| API `/cars` | Render (or host) logs; DB connectivity; `CORS_ORIGIN` if browser-only failures |
| Homepage `noindex` | Remove `X-Robots-Tag` at edge or meta robots in `index.html` / server middleware |

## Related

- `docs/launch/post-deploy-checklist.md` — T+0 / T+24h items
- `docs/launch/google-search-console-readiness.md` — GSC cadence
- [production-deployment-checklist.md](./production-deployment-checklist.md) — go / no-go
