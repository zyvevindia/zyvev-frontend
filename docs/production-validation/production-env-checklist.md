# Production Environment Checklist

**Profile:** `public-beta`  
**Canonical domain:** `https://evsavari.com`

Complete on **Vercel (frontend)** and **backend host** before cutover.

---

## Frontend (Vercel)

| Variable | Required value | Notes |
|----------|----------------|-------|
| `VITE_API_URL` | `https://api.evsavari.com` (or prod API URL) | No trailing slash |
| `VITE_LAUNCH_PROFILE` | `public-beta` | Enables beta banner + profile gates |
| `VITE_BEHAVIORAL_INTELLIGENCE` | `true` | Anonymous event tracking |
| `VITE_CATALOG_INTELLIGENCE` | `true` | Trust + decision blocks |
| `VITE_CATALOG_DETAIL_ENRICH` | `true` | Gold-tier detail enrichment |
| `VITE_SEO_PAGES` | `true` | Prefer API when backend flag on |
| `VITE_GA_ID` | Optional | Omit to disable analytics |

**Do not set in production unless intentional:**

- `VITE_LAUNCH_PROFILE=staging` or `soft-launch` (reduces intelligence)

---

## Backend (production host)

| Variable | Required value | Notes |
|----------|----------------|-------|
| `NODE_ENV` | `production` | |
| `USE_EV_MASTER` | `true` | Tier-1 catalog |
| `CATALOG_INTELLIGENCE_ENABLED` | `true` | |
| `SEO_PAGES_ENABLED` | `true` | |
| `BEHAVIORAL_INTELLIGENCE_ENABLED` | `true` | Week 1 learning |
| `SEO_INTELLIGENCE_PUBLIC` | `false` | Keep internal |
| `MONGO_URI` | Set | Leads + behavioral events |
| `SITE_ORIGIN` / `FRONTEND_URL` | `https://evsavari.com` | CORS + canonical |
| `CORS_ORIGIN` | `https://evsavari.com` | Production CORS |

---

## Validate locally against profile

```bash
cd zyvev-backend
node scripts/validate-launch-profile.js public-beta
npm run ops:production-activation
```

---

## Static assets (pre-deploy)

```bash
cd zyvev-backend
node scripts/build-seo-pages-json.mjs   # if SEO JSON changed
node scripts/build-sitemaps.mjs         # refresh sitemaps
```

Copy/sync `public/seo-data`, `public/sitemap*.xml` to frontend before deploy.

---

## Robots & sitemap expectations

| Asset | Expected |
|-------|----------|
| `robots.txt` | Allow `/`, disallow admin/dealer/login, `Sitemap: https://evsavari.com/sitemap.xml` |
| `sitemap.xml` | Index manifest → `sitemaps/*.xml` |
| Crawlable URLs | ~52 (run `npm run ops:seo`) |

---

## Rollback (env)

1. Set `BEHAVIORAL_INTELLIGENCE_ENABLED=false` + `VITE_BEHAVIORAL_INTELLIGENCE=false`
2. Revert to `soft-launch` profile if needed (disables behavioral + API SEO)
3. Redeploy previous Vercel deployment from dashboard
4. See [deploy-verification-checklist.md](./deploy-verification-checklist.md)

---

## Sign-off

- [ ] All frontend vars set on Vercel Production
- [ ] All backend vars set on host
- [ ] `validate-launch-profile.js public-beta` passes on deploy host
- [ ] CORS tested from `https://evsavari.com`
