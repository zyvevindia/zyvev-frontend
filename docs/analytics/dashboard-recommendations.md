# GA4 Dashboard Recommendations

**Scope:** Documentation only — configure in GA4 after activation  
**Property:** EVSavari Production

---

## Dashboard 1 — Traffic Overview

| Card | Metric / Dimension |
|------|-------------------|
| Users (28d) | Active users |
| Sessions | Sessions |
| Organic share | Session default channel = Organic Search |
| Top landing pages | Landing page + views |
| Device split | Device category |

---

## Dashboard 2 — Landing Pages

| Card | Filter |
|------|--------|
| Brand landings | Event `landing_viewed`, `landing_type=brand` |
| Price segments | `landing_type=price` |
| Use cases | `landing_type=use_case` |
| Top landing slugs | Dimension `landing_slug` |

---

## Dashboard 3 — Vehicles & Catalog

| Card | Event |
|------|-------|
| Top vehicles | `vehicle_view` → `family_slug` |
| Browse engagement | `browse_viewed` |
| Search terms | `search_used` → `search_query` |
| Filter usage | `filter_used` → `filter_type` |

---

## Dashboard 4 — Compare Funnel

| Step | Event |
|------|-------|
| Compare tool views | `compare_view` |
| Started | `compare_started` |
| Completed | `compare_completed` |
| Drop-off | Calculated |

---

## Dashboard 5 — Lead Funnel

| Step | Event |
|------|-------|
| Form opened | `lead_form_opened` |
| Started | `lead_started` |
| Submitted | `lead_submitted` (conversion) |
| Callback | `callback_requested` (conversion) |

---

## Dashboard 6 — CTAs

| Card | Event |
|------|-------|
| All CTAs | `cta_clicked` by `cta_type` |
| Best deal | `cta_type` contains `best_deal` |
| Dealer assistance | `cta_type=dealer_assistance` |
| EMI | `cta_type=emi_interaction` |

---

## Dashboard 7 — Guides & Content

| Card | Event |
|------|-------|
| Guide views | `guide_viewed` |
| Internal navigation | `internal_link_clicked` |
| Related link domain | `link_domain` |

---

## Dashboard 8 — Performance

| Card | Event |
|------|-------|
| LCP p75 | `web_vital` where `metric_name=LCP` |
| INP p75 | `web_vital` where `metric_name=INP` |
| CLS p75 | `web_vital` where `metric_name=CLS` |

---

## Dashboard 9 — Returning Users

| Card | Definition |
|------|------------|
| New vs returning | Built-in GA4 segment |
| Repeat vehicle views | `vehicle_view` count > 1 per user |
| Multi-session compare | Custom event if enabled |

---

## Exploration Templates

1. **Path exploration:** `homepage_viewed` → `landing_viewed` → `vehicle_view` → `lead_submitted`
2. **Funnel exploration:** Lead funnel (see conversion-tracking-guide.md)
3. **Free form:** Organic traffic + landing_type breakdown (requires GSC link)

---

## Manual Setup

- [ ] Create custom dimensions: `landing_type`, `landing_slug`, `family_slug`, `cta_type`, `event_category`
- [ ] Register event parameters in GA4 Admin
- [ ] Build dashboards after 7 days of data
- [ ] Share view-only access with stakeholders
