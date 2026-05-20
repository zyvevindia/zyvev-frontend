# EVSavari frontend

Vite + React marketplace UI for [EVSavari](https://evsavari.com).

## Prerequisites

- Node.js 20+
- Backend API running locally (default `http://localhost:5000`) or a reachable staging/production API

## Deployment

- **[docs/deploy/README.md](./docs/deploy/README.md)** — automation sprint index: architecture, runbook, env checklist, rollback, CI, `deploy:smoke`.
- **[docs/production-deployment-guide.md](./docs/production-deployment-guide.md)** — step-by-step Vercel + Render execution, env lists, compatibility checks, smoke tests, and ordered launch sequence.
- **[docs/soft-launch-readiness.md](./docs/soft-launch-readiness.md)** — risks, blockers, and supplemental QA notes.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (or rely on dev/prod fallbacks in `src/config.js`) | Base URL for the EVSavari API (no trailing slash) |
| `VITE_GA_ID` | No | Google Analytics 4 measurement ID; omit to disable GA |

### Local development

1. Copy the template and adjust (recommended — file is gitignored):

   ```bash
   cp .env.example .env.local
   ```

2. Ensure `VITE_API_URL` points at your local API, e.g. `http://localhost:5000`.

3. The committed `.env` file ships a **localhost-safe default** for `vite dev`. `.env.local` overrides it when present.

### Production / CI builds

Set `VITE_API_URL` (and optionally `VITE_GA_ID`) in your hosting provider or CI environment. Do not rely on committing production secrets. The committed `.env.production` file only documents intent; missing values fall back to `src/config.js` production defaults when appropriate.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run post-launch:smoke
npm run deploy:smoke -- https://evsavari.com
npm run ci:full
npm run lint
```

## Stack

React 19, React Router 7, Vite 8, react-helmet-async.
