# Customer Intelligence Production Certification

**Release:** v2.0.2 – Customer Intelligence Foundation  
**Release ID:** R-ANALYTICS  
**Generated:** 2026-07-13T10:29:45Z  
**Site:** https://evsavari.com  
**Verdict:** **PASS_WITH_WARNINGS**  
**Customer Intelligence Health Score:** 99/100

---

## Certification Summary

| Area | Result | Score |
|------|--------|------:|
| Architecture (exactly-one engine) | PASS | 100 |
| Event taxonomy (core journey) | PASS | 100 |
| Privacy & PII sanitization | PASS | 100 |
| Environment configuration | PASS | 100 |
| No direct provider calls in components | PASS | 100 |
| Production probe (graceful degradation) | PASS | 95 |
| Analytics smoke (`ops:analytics-smoke`) | PASS | — |

**Warning (non-blocking):** GA4/GTM measurement IDs are not set on production Vercel. Tracking is env-gated and degrades gracefully — zero analytics console errors observed.

**Command:** `npm run analytics:certify:foundation`

---

## Step 2 — Architecture Verification

### Exactly One

| Component | Path | Status |
|-----------|------|--------|
| Analytics Engine | `src/analytics/track.js` | ✓ |
| Event Dispatcher | `src/analytics/providers/index.js` | ✓ |
| Provider Layer | `src/analytics/providers/*.js` | ✓ |
| Event Taxonomy | `src/analytics/events.js` | ✓ |
| Event Categories | `src/analytics/categories.js` | ✓ |
| Configuration Layer | `src/analytics/config.js` | ✓ |
| Session Manager | `src/analytics/session.js` | ✓ |
| Page Context Resolver | `src/analytics/pageContext.js` | ✓ |
| Event Envelope | `src/analytics/envelope.js` | ✓ |
| Dedupe | `src/analytics/dedupe.js` | ✓ |
| SPA Listeners | `src/analytics/listeners.js` | ✓ |
| Bootstrap | `src/components/AnalyticsBootstrap.jsx` | ✓ |

### Architecture Compliance Checks

| Check | Result | Evidence |
|-------|--------|----------|
| No duplicate tracking | PASS | Single `trackPageView` in `App.jsx`; dedupe in `track.js` |
| No direct `gtag()` outside providers | PASS | Only `src/analytics/providers/ga4.js` |
| No direct `dataLayer.push` outside providers | PASS | Only `ga4.js` (gtag shim) and `gtm.js` |
| No provider code in React components | PASS | Components use `trackAnalytics` / `funnel` / `traffic` only |
| No hardcoded measurement IDs | PASS | All IDs via `VITE_*` env vars |
| No PII captured | PASS | `sanitizeProps()` blocks email, phone, name fields |
| No duplicate `page_view` | PASS | `send_page_view: false` + single `dispatchPageView` |
| No architecture drift | PASS | ADR-Analytics-Foundation honored; no parallel engines |

**Event flow:** `Component → track.js → envelope → providers/index.js → GA4 | GTM | Clarity | PostHog | Meta | LinkedIn | Server-side`

---

## Step 3 — Production Readiness (Providers)

| Provider | Implementation | Configured (prod) | Status |
|----------|----------------|-------------------|--------|
| **GA4** | Full adapter (`providers/ga4.js`) | No `VITE_GA_ID` | **Implemented — awaiting activation** |
| **GTM** | Full adapter (`providers/gtm.js`) | No `VITE_GTM_ID` | **Implemented — awaiting activation** |
| **Clarity** | Full adapter (`providers/clarity.js`) | No `VITE_CLARITY_ID` | **Implemented — optional** |
| **PostHog** | Full adapter (`providers/posthog.js`) | No `VITE_POSTHOG_KEY` | **Implemented — optional** |
| **Meta Pixel** | Init + custom events (`providers/meta.js`) | No `VITE_META_PIXEL_ID` | **Stub — future extension** |
| **LinkedIn Insight** | Init only (`providers/linkedin.js`) | No `VITE_LINKEDIN_PARTNER_ID` | **Stub — future extension** |
| **Server-side** | Batched queue (`providers/serverSide.js`) | No `VITE_ANALYTICS_SERVER_ENDPOINT` | **Stub — future extension** |

**GTM-first mode:** When `VITE_GTM_ID` is set, direct GA4 init is skipped; GA4 tag expected inside GTM container.

**Activation gate:** `analyticsConfig.analyticsEnabled` (default true) + `hasAnalyticsConsent()` + provider env ID present.

---

## Step 7 — Production Probe Results

| Check | Result | Detail |
|-------|--------|--------|
| SPA navigation | PASS | `/` → `/brands/tata` navigates correctly |
| Graceful without IDs | PASS | No gtag/dataLayer on prod (expected) |
| Analytics console errors | PASS | 0 analytics-related errors |
| Tracking scripts active | EXPECTED NO | Awaiting Vercel env + redeploy |
| Session generation | PASS (local smoke) | Anonymous `sessionStorage` ID in envelope |
| Event envelope | PASS | All events carry standard envelope fields |
| Performance impact | PASS | No blocking scripts when IDs absent |
| Privacy | PASS | IP anonymization, no PII, consent gate available |

### Production Probe Snapshot

```json
{
  "hasGtag": false,
  "hasDataLayer": false,
  "analyticsInitFlag": false,
  "spaNavigationOk": true,
  "gracefulWithoutIds": true,
  "analyticsConsoleErrors": []
}
```

---

## Core Journey Events (Taxonomy Verified)

| Event | Taxonomy | Dedupe |
|-------|----------|--------|
| `page_view` | ✓ | Per path |
| `homepage_viewed` | ✓ | Per path |
| `browse_viewed` | ✓ | Per path |
| `landing_viewed` | ✓ | Per landing slug |
| `guide_viewed` | ✓ | Per guide path |
| `vehicle_view` | ✓ | Per family |
| `compare_started` / `compare_completed` | ✓ | Per session |
| `search_used` | ✓ | Per query |
| `lead_submitted` / `callback_requested` | ✓ | Conversion events |
| `cta_clicked` | ✓ | Per CTA |
| `internal_link_clicked` | ✓ | Delegated listener |

---

## Privacy Compliance

| Control | Status |
|---------|--------|
| Email/phone/name stripped from properties | ✓ |
| GA4 `anonymize_ip: true` | ✓ |
| SPA-controlled `send_page_view: false` | ✓ |
| Consent gate (`VITE_ANALYTICS_REQUIRE_CONSENT`) | ✓ Available |
| No measurement IDs in source | ✓ |
| Dealer context stub (no PII) | ✓ |

---

## Manual Activation Required (Post-Deploy)

1. Create GA4 property + Web Data Stream for https://evsavari.com
2. Set `VITE_GA_ID=G-XXXXXXXX` (or `VITE_GTM_ID` for GTM-first) in Vercel Production
3. Optional: `VITE_CLARITY_ID`, `VITE_POSTHOG_KEY`
4. Redeploy production
5. Verify GA4 Realtime: `page_view`, `landing_viewed`, `vehicle_view`
6. Link GA4 ↔ Search Console
7. Configure conversions per `docs/analytics/conversion-tracking-guide.md`

---

## References

- [ADR — Analytics Foundation](../architecture/adr-analytics-foundation.md)
- [Event Taxonomy](../analytics/event-taxonomy.md)
- [GA4 Activation Guide](../analytics/ga4-activation-guide.md)
- [GTM Activation Guide](../analytics/gtm-activation-guide.md)
- [Privacy Compliance Report](../analytics/privacy-compliance-report.md)

**JSON artifact:** [`analytics-foundation-certification-2026-07-13.json`](./analytics-foundation-certification-2026-07-13.json)
