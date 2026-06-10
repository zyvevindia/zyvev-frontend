# EVSavari Analytics Event Taxonomy

Generated: Growth Phase 3  
Transport: GA4 (direct or GTM dataLayer), PostHog (optional), Microsoft Clarity (sessions)

---

## Phase 3 canonical events (GA4)

| Event | Parameters | Page(s) | Purpose |
|-------|------------|---------|---------|
| `page_view` | `page_path`, `page_title`, `app_env` | All routes | SPA navigation; fired once per path change (deduped) |
| `vehicle_view` | `family_slug`, `variant_slug`, `source_page`, `brand` | `/cars/:slug` | Vehicle detail engagement — primary catalog intent signal |
| `compare_view` | `vehicle_slugs`, `compare_depth`, `source_page` | `/compare`, `/compare/:slug` guides | Compare tool or editorial compare guide loaded with 2+ vehicles |
| `search_used` | `search_query`, `result_count`, `source_page` | `/cars`, listing segments | Catalog search with at least one matching result |
| `filter_used` | `filter_type`, `filter_value`, `active_filter_count`, `source_page` | `/cars` | Brand, sort, price, body, or intelligence filter applied |
| `score_panel_opened` | `family_slug`, `source_page`, `panel_type` | Compare cards, score insight | User opens EVSavari score explanation panel |
| `variant_recommendation_clicked` | `target_slug`, `variant_name`, `seo_page_slug`, `source_page`, `rank` | `/best-evs/*-agent`, variant guides | Click from ranked variant recommendation to vehicle detail |

---

## Implementation

| Module | Role |
|--------|------|
| `src/analytics/traffic.js` | Phase 3 canonical `track*` functions |
| `src/analytics/track.js` | Central fan-out + dedupe + sanitization |
| `src/analytics/dedupe.js` | 1.2s burst dedupe (React StrictMode safe) |
| `src/analytics/providers/ga4.js` | gtag direct or GTM dataLayer |
| `src/analytics/providers/gtm.js` | GTM container bootstrap |
| `src/analytics/providers/clarity.js` | Microsoft Clarity bootstrap |

---

## Extended funnel events (existing)

Legacy and funnel events remain in `src/analytics/events.js` and `src/analytics/funnel.js` for backward compatibility:

| Event | Purpose |
|-------|---------|
| `ev_viewed` | Legacy alias — still fired alongside `vehicle_view` |
| `compare_started` / `compare_completed` | Compare session lifecycle |
| `intelligence_filter_applied` | Intelligence chip toggles (also emits `filter_used` on listing) |
| `discovery_page_engaged` | `/discover/:preset` engagement |
| `lead_started` / `lead_submitted` | Lead funnel |
| `web_vital` | Core Web Vitals (LCP, INP, CLS) |

---

## GTM dataLayer shape

Every `trackAnalytics` call produces:

```js
dataLayer.push({
  event: "vehicle_view",      // event name
  family_slug: "tata-nexon-ev",
  source_page: "/cars/tata-nexon-ev",
  app_env: "production",
});
```

Configure GTM triggers: **Custom Event** → Event name equals `event` parameter.

---

## Privacy

- No email, phone, or `name` fields in analytics payloads (`sanitizeProps` in `track.js`)
- IP anonymization enabled for direct GA4 load
- Consent gate: `VITE_ANALYTICS_REQUIRE_CONSENT=true` + `localStorage` key `evsavari_analytics_consent_v1`

---

## Debug

```bash
VITE_ANALYTICS_DEBUG=true npm run dev
```

Console: `[analytics] <event> <props>`
