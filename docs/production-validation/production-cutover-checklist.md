# Production Cutover Checklist

**Profile:** `public-beta` · **Domain:** `https://evsavari.com`  
Use with [production-env-checklist.md](./production-env-checklist.md) and [deploy-verification-checklist.md](./deploy-verification-checklist.md).

---

## Pre-deploy (T-24h)

### Frontend (Vercel Production)

- [ ] `VITE_LAUNCH_PROFILE=public-beta`
- [ ] `VITE_BEHAVIORAL_INTELLIGENCE=true`
- [ ] `VITE_CATALOG_INTELLIGENCE=true`
- [ ] `VITE_CATALOG_DETAIL_ENRICH=true`
- [ ] `VITE_SEO_PAGES=true`
- [ ] `VITE_API_URL` → production API (no trailing slash)

### Backend (production host)

- [ ] `NODE_ENV=production`
- [ ] `USE_EV_MASTER=true`
- [ ] `CATALOG_INTELLIGENCE_ENABLED=true`
- [ ] `SEO_PAGES_ENABLED=true`
- [ ] `BEHAVIORAL_INTELLIGENCE_ENABLED=true` *(enable at cutover or Day 0+1 per policy)*
- [ ] `MONGO_URI` set
- [ ] `SITE_ORIGIN` / `FRONTEND_URL` = `https://evsavari.com`
- [ ] CORS allows `https://evsavari.com`

### Static assets

- [ ] `npm run` build sitemaps + SEO JSON (backend scripts)
- [ ] `public/sitemap.xml`, `public/robots.txt` synced to frontend repo
- [ ] Sitemap domain = `https://evsavari.com`

### Profile validation

```bash
cd zyvev-backend
node scripts/validate-launch-profile.js public-beta
npm run ops:controlled-launch
npm run ops:public-beta
```

- [ ] `launchReady: true`
- [ ] `betaReady: true`
- [ ] `cutoverCodeReady: true` (`ops:production-activation`)

---

## Deploy

- [ ] Deploy backend first (or atomic with frontend if coordinated)
- [ ] Deploy frontend (Vercel production)
- [ ] No accidental preview URL as canonical

---

## Post-deploy (T+0)

- [ ] [production-smoke-checklist.md](./production-smoke-checklist.md)
- [ ] [live-indexing-checklist.md](../search-console-operations/live-indexing-checklist.md)
- [ ] [behavioral-activation-checklist.md](../controlled-launch-operations/behavioral-activation-checklist.md) *(when enabling learning)*

---

## Sign-off

| Role | Date | Notes |
|------|------|-------|
| Deploy | | |
| Ops | | |
