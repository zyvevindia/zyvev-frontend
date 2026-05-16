# Live Smoke Test Report

**Generated:** 2026-05-16  
**Origin:** https://evsavari.com  
**Tool:** `npm run ops:live-smoke` (`services/live-smoke-test/`)

## Automated HTTP probes

| Path | Expected | Automated result |
|------|----------|------------------|
| `/` | 200 HTML | Run locally post-deploy |
| `/cars` | 200 | Run locally post-deploy |
| `/cars/tata-nexon-ev-creative-plus` | 200 + canonical | Run locally post-deploy |
| `/compare` | 200 | Run locally post-deploy |
| `/cars/best-evs-for-apartment-living` | 200 | Run locally post-deploy |
| `/robots.txt` | Sitemap directive | Run locally post-deploy |
| `/sitemap.xml` | XML index | Run locally post-deploy |

**Build-agent note:** Probes returned `fetch failed` from isolated environment — **not** a product failure. Execute smoke from your network after deploy.

## Manual checklist (required)

### Desktop Chrome

- [ ] Homepage loads; beta banner if profile enabled  
- [ ] Vehicle detail — trust block after hydration  
- [ ] Compare — add 2 vehicles; trust panel visible  
- [ ] SEO guide — recommendations + link to detail  
- [ ] Lead form — submit test lead  
- [ ] View source — canonical link present  

### Android Chrome

- [ ] Detail readable at 375px  
- [ ] Compare usable without horizontal scroll  
- [ ] Lead keyboard does not hide submit  

### Slow 4G (DevTools)

- [ ] Home interactive within acceptable time  
- [ ] SEO guide JSON loads once  

## API probes

| Endpoint | Check |
|----------|--------|
| `GET /api/catalog/vehicles` | 200 JSON |
| `GET /api/seo/pages` | 200 JSON |
| `POST /api/behavioral/events` | 2xx with CORS from frontend origin |

## Sign-off

| Role | Pass | Date |
|------|------|------|
| Ops | ☐ | |
| Product | ☐ | |
