# ADR — Analytics Foundation (Pre–Sprint 3)

## Status

Accepted — 2026-07-12

## Context

Sprint 2 certified SEO on production. Before Sprint 3 (Content Engine), EVSavari requires a measurable analytics foundation so content, dealer, OEM, and AI initiatives can be tracked from Day 1.

## Decision

**Extend** the existing centralized analytics layer in `src/analytics/` — do not introduce parallel tracking systems.

### Single engine

All events flow: Components → `track.js` → `providers/index.js` → provider adapters.

### Provider abstraction

GA4, GTM, Clarity, PostHog, Meta, LinkedIn, and server-side batching are provider adapters. Pages never call `window.gtag` or `dataLayer.push` directly.

### Event envelope

Every event includes: `event_name`, `event_category`, `timestamp`, `page_path`, `session_id`, `dealer_context` (null stub), `campaign_context` (UTM when present).

### Typed SPA page views

`trackPageView` emits `page_view` once per path, then typed events (`homepage_viewed`, `browse_viewed`, `landing_viewed`, `guide_viewed`) based on path patterns — without modifying Landing Framework or routing.

### Internal link tracking

Delegated click listener in `listeners.js` — no changes to landing section components.

### Configuration only

All IDs via environment variables. Never commit measurement IDs.

### Duplicate page_view fix

Removed double `page_view` dispatch (gtag + trackAnalytics).

## Consequences

- GA4 activation is a **manual Vercel env + redeploy** step
- GTM-first supported via `VITE_GTM_ID`
- Future providers add files under `providers/` and register in `providers/index.js`
- Behavioral API (`event-tracking/`) remains separate server-side intelligence — guide views bridge to GA4

## Verification

```bash
npm run analytics:certify:foundation
```

## References

- [analytics-architecture-report.md](../analytics/analytics-architecture-report.md)
- [ga4-activation-guide.md](../analytics/ga4-activation-guide.md)
- [event-taxonomy.md](../analytics/event-taxonomy.md)
