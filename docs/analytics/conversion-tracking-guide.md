# Conversion Tracking Guide

**Scope:** Analytics architecture only — no backend changes  
**Platform:** GA4 (direct or via GTM)

---

## Conversion Architecture

Conversions are **marked in GA4 Admin** from existing custom events. No code changes required after analytics activation.

| Conversion | Source event | Parameters to register |
|------------|--------------|------------------------|
| **Lead Submitted** | `lead_submitted` | `form_type`, `family_slug`, `source_page` |
| **Callback Requested** | `callback_requested` | `source_page` |
| **Dealer Assistance** | `cta_clicked` where `cta_type=dealer_assistance` | Filter in GTM or GA4 |
| **Best Deal** | `cta_clicked` where `cta_type` contains `best_deal` | `source_page`, `surface` |
| **Compare Completed** | `compare_completed` | `vehicle_slugs`, `compare_depth` |
| **EMI Calculator Used** | `cta_clicked` where `cta_type=emi_interaction` | `source_page`, `action` |
| **Guide Read** | `guide_viewed` | `guide_slug`, `guide_type` |
| **Landing Engagement** | `landing_viewed` | `landing_type`, `landing_slug` |

---

## GA4 Admin Setup

For each conversion:

1. Admin → Events
2. Wait for event to appear in **Recent events** (after Realtime traffic)
3. Toggle **Mark as conversion**

Recommended primary conversions (in order):

1. `lead_submitted`
2. `callback_requested`
3. `compare_completed`

---

## GTM Conversion Tags (optional)

For `cta_clicked` with type filtering:

```
Trigger: Custom Event cta_clicked
Condition: cta_type equals dealer_assistance
Tag: GA4 Event → conversion_dealer_assistance
```

---

## Funnel Definitions

### Lead funnel

```
page_view → vehicle_view → lead_form_opened → lead_started → lead_submitted
```

### Compare funnel

```
page_view → compare_view → compare_started → compare_completed → lead_submitted
```

### Landing funnel

```
landing_viewed → internal_link_clicked → vehicle_view → lead_submitted
```

---

## Attribution Notes

- SPA `page_view` uses manual send (`send_page_view: false` on GA4 config)
- UTM params captured in `campaign_context` on event envelope when present
- Session ID is anonymous (`sessionStorage`) — not cross-device until Google Signals enabled

---

## Manual Checklist

- [ ] Activate GA4 (see ga4-activation-guide.md)
- [ ] Generate real traffic on key events
- [ ] Mark conversions in GA4 Admin
- [ ] Configure GTM conversion tags if using GTM
- [ ] Validate in GA4 → Advertising → Conversions
