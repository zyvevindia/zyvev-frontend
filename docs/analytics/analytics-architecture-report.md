# EVSavari Analytics Architecture Report

**Phase:** Pre–Sprint 3 Analytics Foundation  
**Status:** Architecture freeze — single centralized engine  
**Last updated:** 2026-07-12

---

## Executive Summary

EVSavari uses **exactly one analytics engine** under `src/analytics/`. All measurement flows through a provider-agnostic dispatcher. React components never call `window.gtag`, `dataLayer.push`, `fbq`, or Clarity directly.

---

## Layer Diagram

```
React Components / Pages
        ↓
  trackAnalytics() / trackPageView()
  funnel.js / traffic.js / launchTelemetry.js
        ↓
  track.js (Analytics Service)
    • consent gate
    • PII sanitization
    • dedupe (StrictMode safe)
    • event envelope (name, category, timestamp, page, session)
        ↓
  providers/index.js (Event Dispatcher)
        ↓
  ┌─────────┬─────────┬──────────┬────────┬──────────┬────────────┐
  │  GA4    │  GTM    │ PostHog  │ Clarity│   Meta   │  LinkedIn  │
  │ ga4.js  │ gtm.js  │posthog.js│clarity │ meta.js  │ linkedin.js│
  └─────────┴─────────┴──────────┴────────┴──────────┴────────────┘
                              ↓
                    serverSide.js (future batch endpoint)
```

---

## Module Inventory

| Module | Role |
|--------|------|
| `config.js` | Env-only IDs (`VITE_GA_ID`, `VITE_GTM_ID`, etc.) |
| `init.js` | One-time provider bootstrap |
| `track.js` | **Single entry** for all custom events + SPA page views |
| `events.js` | Canonical event name constants (snake_case) |
| `categories.js` | Event categories + future extension categories |
| `envelope.js` | Standard payload: name, category, timestamp, page, session, dealer/campaign stubs |
| `pageContext.js` | Path → page type (homepage, browse, landing, vehicle, guide) |
| `dedupe.js` | 1.2s burst dedupe |
| `consent.js` | Opt-out via localStorage |
| `listeners.js` | Delegated internal link click tracking (no landing component changes) |
| `traffic.js` | Phase 3 catalog events |
| `funnel.js` | Lead, compare, CTA events |
| `launchTelemetry.js` | Buyer intent + GA4 fan-out bridge |
| `webVitals.js` | LCP, INP, CLS → `web_vital` event |
| `AnalyticsBootstrap.jsx` | App mount: Sentry + analytics + vitals |

---

## SPA Page Tracking

`App.jsx` calls `trackPageView(location.pathname)` on route change.

`trackPageView` emits:

1. **`page_view`** — once per path (deduped)
2. Typed follow-up (deduped separately):
   - `homepage_viewed` → `/`
   - `browse_viewed` → `/cars`
   - `landing_viewed` → `/brands/*`, `/best-evs/*` (with `landing_type`, `landing_slug`)
   - `guide_viewed` → guide paths (also bridged from `discoveryAnalytics.js`)

**Fix (2026-07-12):** Removed duplicate `page_view` firing (previously gtag + trackAnalytics both sent page_view).

---

## Behavioral Intelligence Boundary

`src/event-tracking/` posts anonymized events to the backend API for buyer intelligence. This is **not** a second analytics engine — it is server-side behavioral storage. Guide views now **also** fan out to GA4 via `discoveryAnalytics.js` → `trackAnalytics`.

---

## Provider Activation

| Provider | Env var | Default |
|----------|---------|---------|
| GA4 direct | `VITE_GA_ID` | Off until set |
| GTM | `VITE_GTM_ID` | Off until set (GA4 via GTM when set) |
| Clarity | `VITE_CLARITY_ID` | Off until set |
| PostHog | `VITE_POSTHOG_KEY` | Off until set |
| Meta Pixel | `VITE_META_PIXEL_ID` | Stub — off until set |
| LinkedIn | `VITE_LINKEDIN_PARTNER_ID` | Stub — off until set |
| Server-side | `VITE_ANALYTICS_SERVER_ENDPOINT` | Stub — off until set |

**Never commit measurement IDs to source.**

---

## Architecture Certification

| Rule | Status |
|------|--------|
| Exactly one Analytics Engine | PASS |
| Exactly one Event Dispatcher | PASS |
| Exactly one Provider Layer | PASS |
| Exactly one Event Taxonomy | PASS |
| Exactly one Configuration Layer | PASS |
| No duplicate page views | PASS (fixed) |
| No direct provider calls in components | PASS |

Run: `npm run analytics:certify:foundation`
