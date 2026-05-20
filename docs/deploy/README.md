# EVSavari — deployment documentation

Lightweight, production-focused references for the **frontend** repo (Vite + Vercel). The API lives in a **sibling backend** service (e.g. Render + MongoDB Atlas + Cloudinary).

| Document | Purpose |
|----------|---------|
| [deployment-architecture-validation.md](./deployment-architecture-validation.md) | Target architecture, URLs, readiness summary, blockers |
| [production-deployment-checklist.md](./production-deployment-checklist.md) | One-page go / no-go before traffic |
| [production-env-checklist.md](./production-env-checklist.md) | Frontend + pointer to backend env vars |
| [domain-seo-deployment.md](./domain-seo-deployment.md) | HTTPS, www, canonical, sitemaps, GSC |
| [backend-production.md](./backend-production.md) | API process, health, CORS, Turnstile, logging |
| [rollback-and-recovery.md](./rollback-and-recovery.md) | Vercel rollback, smoke failures, ingestion/catalog notes |
| [controlled-public-launch-checklist.md](./controlled-public-launch-checklist.md) | Launch day, T+24h, week 1, monitoring |
| [frontend-production-config.md](./frontend-production-config.md) | `vercel.json`, SPA fallback, cache, SEO artifact shipping |
| [examples/render-backend.service.yaml](./examples/render-backend.service.yaml) | Example Render blueprint (copy to backend repo) |

## Scripts

| Command | When |
|---------|------|
| `npm run deploy:repo-check` | Before merge; static checks (no network) |
| `npm run build` | Production artifact; runs content + sitemaps |
| `npm run post-launch:smoke` | CI + pre-release |
| `npm run ingestion:smoke` | CI + ingestion changes |
| `EVSAVARI_SITE_ORIGIN=https://evsavari.com npm run deploy:smoke` | After production deploy (HTTP probes) |
| `npm run launch:validate` | API + Cloudinary + launch slugs (network) |

Human verification is still required for DNS, secrets, GSC ownership, and host dashboards.
