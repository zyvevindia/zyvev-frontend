# EVSavari Analytics Event Taxonomy

**Version:** Analytics Foundation (Pre–Sprint 3)  
**Transport:** GA4 (direct or GTM dataLayer), PostHog (optional), Clarity (sessions)  
**Naming:** snake_case only

---

## Event Envelope (all events)

Every `trackAnalytics` call includes:

| Field | Type | Description |
|-------|------|-------------|
| `event_name` | string | Same as GA4 event name |
| `event_category` | string | See categories below |
| `timestamp` | ISO8601 | Event time |
| `page_path` | string | Current SPA path |
| `page_url` | string | Full URL |
| `session_id` | string | Anonymous sessionStorage ID |
| `app_env` | string | production / development |
| `dealer_context` | null | Reserved Sprint 5+ |
| `campaign_context` | object\|null | UTM params when present |

---

## Categories

| Category | Value | Use |
|----------|-------|-----|
| Navigation | `navigation` | page_view, homepage_viewed |
| Catalog | `catalog` | vehicle_view, browse_viewed, search_used |
| Landing | `landing` | landing_viewed |
| Compare | `compare` | compare_* |
| Lead | `lead` | lead_* |
| CTA | `cta` | cta_clicked |
| Search | `search` | search_used |
| Guide | `guide` | guide_viewed |
| Engagement | `engagement` | internal_link_clicked |
| Performance | `performance` | web_vital |
| AI | `ai` | assistant_* (future primary) |

**Future (architecture only):** `dealer`, `oem`, `finance`, `charging`, `marketplace`, `editorial`, `authentication`, `crm`

---

## Core Journey Events

| Event | Category | Parameters | Trigger |
|-------|----------|------------|---------|
| `page_view` | navigation | `page_path`, `page_title` | SPA route change |
| `homepage_viewed` | navigation | `page_path` | `/` |
| `browse_viewed` | catalog | `page_path` | `/cars` |
| `landing_viewed` | landing | `landing_type`, `landing_slug` | `/brands/*`, `/best-evs/*` |
| `guide_viewed` | guide | `guide_type`, `guide_slug`, `seo_page_slug` | Guide pages |
| `vehicle_view` | catalog | `family_slug`, `variant_slug`, `brand` | Vehicle detail |
| `compare_view` | compare | `vehicle_slugs`, `compare_depth` | Compare tool / guide |
| `compare_started` | compare | `vehicle_slugs`, `source_page` | Add to compare |
| `compare_completed` | compare | `vehicle_slugs` | Compare session complete |
| `search_used` | search | `search_query`, `result_count` | Listing search |
| `filter_used` | catalog | `filter_type`, `filter_value` | Listing filters |
| `lead_form_opened` | lead | `form_type`, `family_slug` | Open lead modal |
| `lead_started` | lead | `form_type` | First field interaction |
| `lead_submitted` | lead | `form_type`, `family_slug` | **Conversion** |
| `callback_requested` | lead | `source_page` | **Conversion** |
| `cta_clicked` | cta | `cta_type`, `source_page`, `label` | Any CTA |
| `internal_link_clicked` | engagement | `link_href`, `link_text`, `link_domain` | SEO internal links |

---

## CTA Type Values (`cta_clicked.cta_type`)

| cta_type | Journey |
|----------|---------|
| `dealer_assistance` | Dealer help CTA |
| `emi_interaction` | EMI calculator / slider |
| `get_best_deal` / surfaces | Best deal CTAs on vehicle page |
| `whatsapp` | WhatsApp lead |
| `finance_help` | Finance help |
| `compare_cta` | Compare page CTA |

---

## Landing Types (`landing_viewed.landing_type`)

| Value | Paths |
|-------|-------|
| `brand` | `/brands/:slug` |
| `price` | `/best-evs/under-*-lakh`, `/best-evs/premium` |
| `use_case` | `/best-evs/city`, `/best-evs/family`, etc. |

---

## Implementation Map

| Module | Role |
|--------|------|
| `track.js` | Central dispatcher + envelope + typed page views |
| `providers/index.js` | Fan-out to all providers |
| `traffic.js` | `trackVehicleView`, `trackSearchUsed`, etc. |
| `funnel.js` | Lead, compare, CTA events |
| `launchTelemetry.js` | Buyer intent bridge |
| `listeners.js` | `internal_link_clicked` (delegated) |
| `discoveryAnalytics.js` | `guide_viewed` → GA4 bridge |
| `App.jsx` | SPA `trackPageView` |

---

## Quality Rules

| Rule | Enforcement |
|------|-------------|
| snake_case names | `events.js` constants |
| No duplicate page_view | Single `dispatchPageView` |
| Dedupe bursts | `dedupe.js` 1.2s TTL |
| No PII | `sanitizeProps()` |
| No direct gtag in components | Lint + cert scan |

---

## GTM dataLayer Shape

```js
dataLayer.push({
  event: "landing_viewed",
  event_name: "landing_viewed",
  event_category: "landing",
  landing_type: "brand",
  landing_slug: "tata",
  page_path: "/brands/tata",
  session_id: "...",
  app_env: "production",
});
```

---

## Debug

```bash
VITE_ANALYTICS_DEBUG=true npm run dev
```

Console: `[analytics] <event> <envelope>`

---

## Certification

```bash
npm run analytics:certify:foundation
```
