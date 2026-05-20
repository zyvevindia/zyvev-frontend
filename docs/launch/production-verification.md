# Production verification — EVSavari

Run after deploy to confirm production is safe for founder QA and dealer traffic.

---

## Automated (local terminal)

```bash
cd zyvev-frontend

# Build + SEO + sitemaps
npm run build

# SEO manifest integrity
npm run seo:qa

# Cloudinary tier-1 probe (needs network)
npm run media:audit -- --probe

# API + launch families (set VITE_API_URL for production API)
npm run launch:validate

# Optional: local backend check before dev
npm run check:api
```

| Command | Pass criteria |
|---------|---------------|
| `npm run build` | Exit 0 |
| `npm run seo:qa` | 0 errors |
| `npm run media:audit -- --probe` | 18/18 URLs (or current tier-1 count) |
| `npm run launch:validate` | All checks OK |

---

## Production URL probes

Replace origin if using staging.

| Resource | Expected |
|----------|----------|
| `GET https://evsavari.com/` | 200 |
| `GET https://evsavari.com/cars/tata-nexon-ev` | 200 |
| `GET https://evsavari.com/compare` | 200 |
| `GET https://evsavari.com/robots.txt` | 200, Sitemap directive |
| `GET https://evsavari.com/sitemap.xml` | 200, valid XML |
| `GET {API_URL}/cars?limit=1` | 200 JSON |

---

## Admin UI verification

1. Log in as admin → `/admin/launch-status`
2. **Run launch validation**
3. Confirm:
   - API health — catalog reachable
   - Image health — tier-1 Cloudinary probe OK
   - Launch families — 6/6 in catalog
   - Environment — `VITE_API_URL`, Cloudinary, WhatsApp as expected

---

## Environment (Vercel production)

| Variable | Recommended |
|----------|-------------|
| `VITE_API_URL` | Production API base (no trailing slash) |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dznvmumze` |
| `VITE_BEHAVIORAL_INTELLIGENCE` | `true` when backend enabled |
| `VITE_WHATSAPP_SALES_NUMBER` | Sales line with country code |
| `VITE_LAUNCH_PROFILE` | `soft-launch` or `public-beta` |

---

## Architecture guardrails (do not change during launch week)

- Routing: `/cars/:slug` SEO vs detail split unchanged
- Canonicals: family URLs only
- Compare: `compareCars` localStorage contract unchanged
- No backend API contract changes without coordinated deploy

---

## Sign-off

| Check | Owner | Date |
|-------|-------|------|
| Automated scripts green | | |
| Launch status page green | | |
| Founder live QA scheduled | | |

Next: `post-deploy-checklist.md` for hour-by-hour monitoring.
