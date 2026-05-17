# Day-2 deployment summary

**Date:** 2026-05-17

## Pre-push validation

| Command | Result |
|---------|--------|
| `npm run build` | PASS |
| `npm run seo:qa` | PASS (121 pages, 0 errors) |
| `npm run media:audit -- --probe` | PASS (18/18 Cloudinary URLs) |
| `npm run check:api` | PASS (30 vehicles, tier-1 files) |

## Commits pushed

### Frontend (`zyvev-frontend` → `origin/main`)

| SHA | Message |
|-----|---------|
| `f4973d8` | feat: Day-2 soft-launch readiness — Cloudinary media and ops tooling |

Previous: `05168be`

### Backend (`zyvev-backend` → `origin/main`)

| SHA | Message |
|-----|---------|
| `d5a4a7f` | feat: tier-1 Cloudinary media URLs, ops audit, and local CORS hardening |

Previous: `3450024`

## Systems updated

- **Cloudinary:** `dznvmumze`, canonical family public IDs, 18/18 probe OK
- **Media layer:** `src/media/*`, `VehicleImage`, family manifest, audit/fix scripts
- **Launch ops:** smoke script, Media QA, Operational QA, feedback, local `check:api`
- **SEO:** discovery batch + 147 sitemap URLs (unchanged canonical structure)
- **Docs:** `docs/launch/*`, dealer pilot guides, day-2 smoke report
- **Backend:** tier-1 Cloudinary URLs in variant JSON, dev CORS ports, ops audit

## Architecture preserved

- No routing changes
- No SEO canonical / family URL structure changes
- No compare architecture changes

## Vercel

Push to `main` should trigger Vercel production auto-deploy for `zyvev-frontend`.

Confirm in Vercel dashboard: deployment from `f4973d8`, build log green.

Set production env if missing: `VITE_CLOUDINARY_CLOUD_NAME=dznvmumze`

## Launch readiness

**Automated:** READY  
**Production deploy:** Pending Vercel build confirmation  
**Founder QA:** PENDING (manual)

## Remaining manual founder QA

1. Confirm Vercel production deploy succeeded; hard-refresh `https://evsavari.com`
2. Home + `/cars/tata-nexon-ev` + `/cars/mg-comet-ev` — real Cloudinary images (not SVG fallback)
3. `docs/launch/production-smoke-test.md` (15 min, mobile 375px)
4. Test lead + WhatsApp CTA; verify Admin → Leads
5. `npm run media:audit -- --probe` against production after CDN cache settles

## Local dev reminder

```bash
# Terminal 1
cd zyvev-backend && npm run dev

# Terminal 2
cd zyvev-frontend && npm run check:api && npm run dev
```
