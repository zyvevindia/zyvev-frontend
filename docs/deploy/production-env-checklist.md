# Production environment checklist — frontend

Use before promoting **Production** on Vercel (or copying env to another host). **Never** paste secrets into tickets or commit history.

## Required for a working buyer site

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | HTTPS API origin, no trailing slash (e.g. `https://evsavari-api.onrender.com`) |

## Strongly recommended

| Variable | Purpose |
|----------|---------|
| `VITE_GA_ID` | GA4 measurement ID |
| `VITE_LAUNCH_PROFILE` | `soft-launch` \| `public-beta` \| `staging` — controls banner + feature gates |
| `VITE_CLOUDINARY_CLOUD_NAME` | If not using code default |

## Optional (feature-gated)

| Variable | Purpose |
|----------|---------|
| `VITE_SEO_PAGES` | `true` when backend serves live SEO payloads |
| `VITE_BEHAVIORAL_INTELLIGENCE` | `true` when API accepts behavioral events |
| `VITE_WHATSAPP_SALES_NUMBER` | Digits-only sales line for CTAs |
| `VITE_TURNSTILE_SITE_KEY` | Public site key; **secret stays on API only** |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | Product analytics |
| `VITE_SENTRY_DSN` | Frontend errors; pair with `VITE_APP_ENV`, `VITE_APP_RELEASE`, `VITE_SENTRY_TRACES_SAMPLE_RATE` |
| `VITE_ANALYTICS_ENABLED` / `VITE_ANALYTICS_REQUIRE_CONSENT` / `VITE_ANALYTICS_DEBUG` | Analytics gating |
| `VITE_CATALOG_DETAIL_ENRICH` / `VITE_CATALOG_INTELLIGENCE` | Usually **false** in prod unless ops-approved |
| `VITE_LAUNCH_ACK_LINE`, `VITE_LAUNCH_KNOWN_LIMITATION`, `VITE_MAINTENANCE_NOTE`, `VITE_INTERNAL_BETA_TAG` | Controlled copy (see `.env.example`) |

## Missing-env detection (human + automated)

1. **Human**: Open production site → browser devtools → Network: `/cars` or API calls should be **HTTPS** and **200** (not mixed content or CORS errors).
2. **Script**: `npm run launch:validate` with `VITE_API_URL` set to production API.
3. **Post-deploy**: `EVSAVARI_SITE_ORIGIN=https://evsavari.com npm run deploy:smoke`.

## Backend / API (separate service)

| Variable (typical) | Role |
|--------------------|------|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` (or equivalent) | Auth signing |
| `CORS_ORIGIN` | Allowlist; must include buyer origin(s), e.g. `https://evsavari.com` |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification |
| `TURNSTILE_SITE_KEY` | Must match public site key in Vite |
| `PORT` | Injected by Render/Railway |
| `NODE_ENV` | `production` |
| `BEHAVIORAL_INTELLIGENCE_ENABLED` | If API gates behavioral ingest |
| Sentry / log drain vars | Per backend `.env.example` |

Documented in [backend-production.md](./backend-production.md) and `docs/deploy/examples/render-backend.service.yaml`. **Do not** duplicate secret values in this frontend repo.

### Missing-env detection (backend)

1. [H] Render (or host) **Environment** tab: required keys present, **sync: false** secrets set.
2. Deploy logs: no crash loop on DB URI.
3. `curl -sS "$API/health"` or `curl -sS "$API/cars?limit=1"` from a trusted machine.

## Secrets policy

- **Never** commit `.env`, `.env.production.local`, or API keys.
- **Turnstile**: site key in Vite; **secret** only on server.
- **Sentry DSN**: public by design; still treat as sensitive for abuse prevention.
- Rotate keys if leaked; redeploy both API and frontend if CORS or auth coupling changes.
