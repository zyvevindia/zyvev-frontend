# PCS-01 Feature Flag Status

**Date:** 2026-07-07  
**Policy:** Every flag is **Production ON**, **Production OFF**, **Shadow**, **Canary**, or **Experimental** — no ambiguity.

---

## Catalog Platform (`src/catalog/platform/featureFlags.js`)

| Flag | Classification | Production Value | Rollout Strategy |
|---|---|---|---|
| `CATALOG_PUBLISHER_ENABLED` | **Production OFF** | `0` | Manual `npm run catalog:publish` + commit artifacts (PCS-01 model) |
| `CATALOG_PUBLISHER_STRICT` | **Production OFF** | `0` | Enable in CI publish jobs only when desired |
| `CATALOG_SNAPSHOT_RUNTIME` | **Production OFF** | `0` | Enable only after shadow drill |
| `CATALOG_SHADOW_MODE` | **Production OFF** | `0` | **Next:** staging `CATALOG_RUNTIME_MODE=shadow` for 48h |
| `CATALOG_RUNTIME_MODE` | **Production OFF** | `off` | Ladder: off → shadow → canary → primary |
| `CATALOG_CANARY_PERCENT` | **Production OFF** | `0` | Increase after shadow clean |
| `CATALOG_LEGACY_FALLBACK` | **Production ON** | `1` | Keep ON until PRIMARY stable 30 days |

---

## Buyer / Frontend (`src/config.js`, `.env.example`)

| Flag | Classification | Production Value | Notes |
|---|---|---|---|
| `VITE_SEO_PAGES` | **Production OFF** | `false` | Static `/seo-data/*.json` is authoritative |
| `VITE_BEHAVIORAL_INTELLIGENCE` | **Production OFF** | `false` | Requires backend flag + lead E2E |
| `VITE_CATALOG_INTELLIGENCE` | **Production OFF** | `false` | Editorial UI; enable post-RC |
| `VITE_CATALOG_DETAIL_ENRICH` | **Production OFF** | `false` | Extra API load |
| `VITE_ANALYTICS_ENABLED` | **Production ON** | `true` (default) | Unless explicitly set false in Vercel |
| `VITE_ANALYTICS_REQUIRE_CONSENT` | **Production OFF** | `false` | Enable if legal requires |

---

## Analytics & Monitoring

| Flag | Classification | Production Value | PCS-01 Action |
|---|---|---|---|
| `VITE_GA_ID` | **Production ON** | Set in Vercel | **Manual verify** — see `03_Configuration_Report.md` |
| `VITE_GTM_ID` | **Production OFF** | Unset unless used | Optional |
| `VITE_CLARITY_ID` | **Experimental** | Unset | Optional post-RC |
| `VITE_POSTHOG_KEY` | **Experimental** | Unset | Not required for RC |
| `VITE_SENTRY_DSN` | **Production ON** (required) | **Manual set in Vercel** | Blocker if unset — see config report |
| `VITE_APP_ENV` | **Production ON** | Should be `production` | Set with Sentry |
| `VITE_APP_RELEASE` | **Production ON** | Per deploy SHA | Vercel injects via build |

---

## Security

| Flag | Classification | Production Value | PCS-01 Action |
|---|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | **Production ON** (required for leads) | **Manual set** | Backend secret required — sibling repo |
| `VITE_RECAPTCHA_SITE_KEY` | **Experimental** | Unset | Not used if Turnstile active |

---

## Launch / Ops Copy

| Flag | Classification | Default |
|---|---|---|
| `VITE_LAUNCH_PROFILE` | **Production OFF** | unset (no beta banner) |
| `VITE_MAINTENANCE_NOTE` | **Production OFF** | unset |
| `VITE_INTERNAL_BETA_TAG` | **Experimental** | Must never be `true` on public prod |
| `VITE_WHATSAPP_SALES_NUMBER` | **Production ON** when pilot starts | Set before August pilot |

---

## Agent Registry (`placeholder: true`)

| Agent | Classification |
|---|---|
| Vehicle Creation | **Production ON** (human-in-loop) |
| Change Detection | **Production ON** |
| Score Engine | **Production ON** (read-only) |
| SEO / Audit / Monitoring / Analytics agents | **Experimental** — UI only, not implemented |

---

## Dealer AI / OEM AI

| Product | Classification |
|---|---|
| Dealer AI | **Not implemented** — no flags |
| OEM AI | **Not implemented** — no flags |

---

## Rollout Strategy Summary

```
NOW (PCS-01):     Legacy catalog + committed snapshot artifacts ON CDN
NEXT (pre-RC):    Shadow mode on staging → canary 5% → 25% → primary
PARALLEL:         Turnstile + Sentry ON in Vercel (manual)
DEFERRED:         Behavioral intel, live SEO API, CRS primary in prod
```
