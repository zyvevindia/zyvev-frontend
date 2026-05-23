# EVSavari frontend — required environment variables

Inventory from `import.meta.env`, `process.env` (scripts), and `.env.example`.  
Vite only exposes variables prefixed with `VITE_` to the browser bundle.

**Compared project (Production + Preview):** `zyvev-frontend-kbod` (Vercel, `zyvevindias-projects`)  
**Snapshot date:** 2026-05-20 — via `vercel env ls` after `vercel link --project zyvev-frontend-kbod`.

---

## Vercel: `zyvev-frontend-kbod` (currently set)

| Variable | Environments |
|----------|----------------|
| `VITE_API_URL` | Production, Preview |
| `VITE_CLOUDINARY_CLOUD_NAME` | Production, Preview |
| `VITE_SITE_ORIGIN` | Production, Preview |

Reference project `zyvev-frontend` (same team) also sets: `VITE_LAUNCH_PROFILE`, `VITE_BEHAVIORAL_INTELLIGENCE`, `VITE_CATALOG_INTELLIGENCE`, `VITE_CATALOG_DETAIL_ENRICH`, `VITE_SEO_PAGES`.

---

## Runtime (Vite → browser bundle)

### Required

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_API_URL` | HTTPS backend API base (no trailing slash). Used by `src/config.js` for all `/cars`, `/leads`, admin API calls. | `https://evsavari-api.onrender.com` | **Yes** (explicit set; else `PROD_FALLBACK` in code) | Set to live API origin on **Production** and **Preview**. Never `localhost` in production builds. |

### Strongly recommended

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_LAUNCH_PROFILE` | Launch banner, ops copy gates (`src/config/launchProfiles.js`). | `public-beta` \| `soft-launch` \| `staging` | No | `public-beta` for controlled public launch. |
| `VITE_CLOUDINARY_CLOUD_NAME` | Catalog image CDN cloud name (`src/config/media.js`). | `dznvmumze` | No (default in code) | Set explicitly to avoid drift; **not** `evsavari` (folder prefix only). |
| `VITE_GA_ID` | Google Analytics 4 (`src/analytics/config.js`). | `G-XXXXXXXXXX` | No | Set for production analytics; omit to disable GA. |
| `VITE_SITE_ORIGIN` | Canonical site URL for discovery meta (`IntelligenceDiscoveryPage.jsx`). | `https://evsavari.com` | No (defaults to `https://evsavari.com`) | Set if production host is not `evsavari.com`. |

### Public-beta feature flags (optional but expected in prod cutover)

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_BEHAVIORAL_INTELLIGENCE` | Enables anonymous buyer events (`src/config.js`). Needs `BEHAVIORAL_INTELLIGENCE_ENABLED` on API. | `true` | No | `true` when behavioral learning is on. |
| `VITE_CATALOG_INTELLIGENCE` | Intelligence UI on listing/detail (`src/utils/catalogIntelligence.js`). | `true` | No | `true` when ops approves intelligence blocks in prod. |
| `VITE_CATALOG_DETAIL_ENRICH` | Master-catalog detail enrich (`src/utils/catalogExperience.js`). | `true` | No | `true` only after catalog QA; else `false`. |
| `VITE_SEO_PAGES` | Prefer live API SEO payloads when backend flag on (`src/config.js`). | `true` | No | `true` when `SEO_PAGES_ENABLED` on API. |
| `VITE_WHATSAPP_SALES_NUMBER` | WhatsApp CTA line (`src/config.js`). | `9198xxxxxxxx` (digits, country code) | No | Set for dealer WhatsApp CTAs; omit to hide. |

### Analytics & monitoring (optional)

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_POSTHOG_KEY` | PostHog project key (`src/analytics/config.js`). | `phc_xxxxxxxx` | No | Optional product analytics. |
| `VITE_POSTHOG_HOST` | PostHog ingest host. | `https://us.i.posthog.com` | No | Default US cloud if PostHog used. |
| `VITE_SENTRY_DSN` | Sentry browser DSN (`src/analytics/config.js`, `src/monitoring/sentry.js`). | `https://xxx@xxx.ingest.sentry.io/xxx` | No | Recommended for prod error monitoring. |
| `VITE_APP_ENV` | Logical env label for analytics/Sentry. | `production` | No | `production` on Production deploys. |
| `VITE_APP_RELEASE` | Sentry release name. | `evsavari-frontend@1.0.0` | No | Match deploy tag or `package.json` version. |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Sentry performance sample rate. | `0.1` | No | `0.05`–`0.1` typical for prod. |
| `VITE_ANALYTICS_ENABLED` | Master analytics switch (default on unless `false`). | `true` | No | Leave unset or `true`. |
| `VITE_ANALYTICS_REQUIRE_CONSENT` | Gate analytics until consent. | `false` | No | `false` unless CMP required. |
| `VITE_ANALYTICS_DEBUG` | Verbose analytics logging. | `false` | No | **Never** `true` in production. |

### Forms & abuse prevention (optional)

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (`src/utils/turnstile.js`). | Turnstile site key string | No | Set when low-intent forms use Turnstile; secret stays on API only. |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key (`src/utils/recaptchaV3.js`). | reCAPTCHA site key | No | Alternative to Turnstile if used; API verifies with `RECAPTCHA_SECRET_KEY`. |

### Launch / ops copy (optional)

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_LAUNCH_ACK_LINE` | Beta banner acknowledgment line. | Short sentence | No | Optional; keep under ~120 chars. |
| `VITE_LAUNCH_KNOWN_LIMITATION` | Known limitation under banner. | Short sentence | No | Optional controlled-public copy. |
| `VITE_MAINTENANCE_NOTE` | Maintenance notice. | Short sentence | No | Set only during maintenance windows. |
| `VITE_INTERNAL_BETA_TAG` | Internal beta label. | `Internal beta` | No | Staging/internal only. |
| `VITE_BETA_FEEDBACK_ACK_LINE` | Feedback form acknowledgment. | Short sentence | No | Optional. |
| `VITE_OPS_RELEASE_SUMMARY` | Ops-facing release note. | Short sentence | No | Optional; admin/ops surfaces. |
| `VITE_OPS_KNOWN_ISSUES` | Comma-separated known issues. | `Issue one,Issue two` | No | Optional. |

---

## Vite built-ins (not set in Vercel)

| Variable | Purpose | Set by |
|----------|---------|--------|
| `import.meta.env.MODE` | `development` \| `production` | Vite |
| `import.meta.env.DEV` | Dev server flag | Vite |
| `import.meta.env.PROD` | Production build flag | Vite |
| `import.meta.env.BASE_URL` | Asset base path | Vite |
| `import.meta.env.SSR` | SSR flag | Vite |

---

## Build-time injects (not env vars)

Defined in `vite.config.js` at build: `__EVSAVARI_BUILD_COMMIT__`, `__EVSAVARI_BUILD_TIME__`, `__EVSAVARI_RELEASE_VERSION__` (from `npm_package_version`).

---

## CI / scripts only (not read by Vite client)

Use in GitHub Actions, local CLI, or Vercel **Build** env if scripts run during deploy.

| Variable | Purpose | Example format | Required | Production recommendation |
|----------|---------|----------------|----------|---------------------------|
| `VITE_SITE_ORIGIN` | Sitemap + SEO QA canonical host (`scripts/build-sitemaps.mjs`, `seo-qa.mjs`). | `https://evsavari.com` | No | Set on Vercel **Build** if sitemaps must match non-default host. |
| `EVSAVARI_SITE_ORIGIN` | `npm run deploy:smoke` live site probe. | `https://evsavari.com` | No | CI smoke only. |
| `EVSAVARI_API_URL` | Deploy smoke API probe. | `https://evsavari-api.onrender.com` | No | CI smoke only. |
| `EVSAVARI_CLOUDINARY_NAME` | Deploy smoke Cloudinary check. | `dznvmumze` | No | CI smoke only. |
| `EVSAVARI_DEPLOY_SMOKE_COMPARE_PATH` | Deep compare path for smoke. | `/compare/tata-nexon-ev-vs-mg-zs-ev` | No | Optional override. |
| `EVSAVARI_DEPLOY_SMOKE_DISCOVER_PATH` | Discovery path for smoke. | `/discover/city-driving` | No | Optional override. |
| `CLOUDINARY_CLOUD_NAME` | Admin script `cloudinary-fix-publicids.mjs`. | `dznvmumze` | No | **Never** expose to Vite; local/CI only. |
| `CLOUDINARY_API_KEY` | Cloudinary Admin API scripts. | API key | No | Secrets store only. |
| `CLOUDINARY_API_SECRET` | Cloudinary Admin API scripts. | API secret | No | Secrets store only. |
| `npm_package_version` | Release string in Vite define. | `0.0.0` | No | Set by npm during build. |

---

## Missing from `zyvev-frontend-kbod`

Variables in the inventory above that are **not** configured on `zyvev-frontend-kbod` (Production or Preview):

### Strongly recommended / public-beta (parity with `zyvev-frontend`)

- `VITE_LAUNCH_PROFILE`
- `VITE_BEHAVIORAL_INTELLIGENCE`
- `VITE_CATALOG_INTELLIGENCE`
- `VITE_CATALOG_DETAIL_ENRICH`
- `VITE_SEO_PAGES`
- `VITE_GA_ID`

### Optional (also absent)

- `VITE_WHATSAPP_SALES_NUMBER`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_SENTRY_DSN`
- `VITE_APP_ENV`
- `VITE_APP_RELEASE`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `VITE_ANALYTICS_ENABLED`
- `VITE_ANALYTICS_REQUIRE_CONSENT`
- `VITE_ANALYTICS_DEBUG`
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_RECAPTCHA_SITE_KEY`
- `VITE_LAUNCH_ACK_LINE`
- `VITE_LAUNCH_KNOWN_LIMITATION`
- `VITE_MAINTENANCE_NOTE`
- `VITE_INTERNAL_BETA_TAG`
- `VITE_BETA_FEEDBACK_ACK_LINE`
- `VITE_OPS_RELEASE_SUMMARY`
- `VITE_OPS_KNOWN_ISSUES`

### Already set on `zyvev-frontend-kbod` (not missing)

- `VITE_API_URL`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_SITE_ORIGIN`

---

## Verification

1. Vercel → Project **zyvev-frontend-kbod** → Settings → Environment Variables.
2. After changes: **Redeploy** Production (Vite bakes env at build time).
3. `npm run launch:validate` with production `VITE_API_URL`.
4. `/admin/system-status` — API URL, Cloudinary, analytics flags.
5. `EVSAVARI_SITE_ORIGIN=https://evsavari.com npm run deploy:smoke` post-deploy.

See also: [production-env-checklist.md](../production-validation/production-env-checklist.md), [.env.example](../../.env.example).
