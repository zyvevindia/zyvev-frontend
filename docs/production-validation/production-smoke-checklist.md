# Production Smoke Checklist

Run from a machine with **network egress** to `https://evsavari.com` immediately after deploy.

---

## Automated

```bash
cd zyvev-backend
npm run ops:live-smoke https://evsavari.com
npm run ops:production-activation -- --live https://evsavari.com
npm run ops:seo
```

| Command | Pass criteria |
|---------|---------------|
| `ops:live-smoke` | `smokePass: true` |
| `ops:production-activation --live` | `cutoverReady: true` (with prod env) |
| `ops:seo` | `health: ok`, canonical errors `0` |

---

## HTTP probes

| Resource | Expected |
|----------|----------|
| `GET /` | 200 |
| `GET /cars/{flagship-slug}` | 200 |
| `GET /compare` | 200 |
| `GET /guides/{seo-slug}` or SEO route | 200 |
| `GET /robots.txt` | 200, Sitemap directive |
| `GET /sitemap.xml` | 200, valid XML |
| `GET /api/catalog/vehicles` | 2xx JSON |
| `GET /api/seo/pages` | 2xx JSON |

---

## Manual (5 min)

| Flow | Pass |
|------|------|
| Homepage loads, no console errors | ☐ |
| Vehicle detail — trust block visible | ☐ |
| Compare — 2 vehicles, trust panel | ☐ |
| SEO guide — intro + vehicle links | ☐ |
| Lead modal opens | ☐ |
| Test lead submit (staging label if needed) | ☐ |

**Mobile:** [mobile-qa-signoff.md](./mobile-qa-signoff.md)

---

## Canonical spot-check

Inspect HTML (view-source or DevTools) on:

- [ ] One vehicle detail → canonical `https://evsavari.com/cars/...`
- [ ] One SEO guide → canonical matches slug

---

## Failure handling

If smoke fails → [rollback-checklist.md](./rollback-checklist.md)

Log results in [production-cutover-report.md](./production-cutover-report.md).
