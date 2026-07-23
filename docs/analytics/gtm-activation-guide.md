# GTM Activation Guide

**Scope:** Pre–Sprint 3  
**When:** Marketing needs tag changes without code deploys

---

## Architecture

When `VITE_GTM_ID` is set:

1. `initGtm()` loads the GTM container
2. `initGa4()` is **skipped** (GA4 managed inside GTM)
3. All events flow via `dataLayer.push({ event, ...params })`

Event shape from EVSavari:

```js
{
  event: "vehicle_view",
  event_name: "vehicle_view",
  event_category: "catalog",
  page_path: "/cars/tata-nexon-ev",
  session_id: "...",
  family_slug: "tata-nexon-ev",
  app_env: "production"
}
```

---

## Step 1 — Create GTM Container

1. [Google Tag Manager](https://tagmanager.google.com/)
2. Create container: **EVSavari Web**
3. Target platform: **Web**
4. Copy **Container ID** (`GTM-XXXXXXX`)

---

## Step 2 — Vercel Configuration

```
VITE_GTM_ID=GTM-XXXXXXX
VITE_ANALYTICS_ENABLED=true
```

Do **not** set `VITE_GA_ID` when using GTM-first (avoid double-loading GA4).

Redeploy production.

---

## Step 3 — GTM Tags to Configure

### Tag 1: GA4 Configuration

- Type: Google Analytics: GA4 Configuration
- Measurement ID: your `G-XXXXXXXXXX`
- Trigger: All Pages (Initialization)
- **Send page view:** OFF (EVSavari sends SPA page_view)

### Tag 2: GA4 Event — page_view

- Type: GA4 Event
- Event name: `page_view`
- Trigger: Custom Event → `page_view`

### Tag 3: GA4 Event — All Custom Events

- Type: GA4 Event
- Event name: `{{Event}}`
- Trigger: Custom Event → matches RegEx `.*` excluding `gtm.*`

Or create individual triggers per event in [event-taxonomy.md](./event-taxonomy.md).

---

## Recommended Triggers

| Trigger name | Condition |
|--------------|-----------|
| CE - page_view | Event equals `page_view` |
| CE - landing_viewed | Event equals `landing_viewed` |
| CE - vehicle_view | Event equals `vehicle_view` |
| CE - lead_submitted | Event equals `lead_submitted` |
| CE - compare_completed | Event equals `compare_completed` |

---

## Variables

Create Data Layer Variables for:

- `page_path`
- `landing_type`
- `landing_slug`
- `family_slug`
- `event_category`
- `session_id`

---

## Clarity via GTM (optional)

Instead of `VITE_CLARITY_ID`, deploy Microsoft Clarity tag in GTM.

---

## Manual Checklist

- [ ] Create GTM container
- [ ] Add `VITE_GTM_ID` to Vercel Production
- [ ] Redeploy
- [ ] Configure GA4 Configuration tag (page_view OFF)
- [ ] Configure custom event tags
- [ ] Use GTM Preview mode on evsavari.com
- [ ] Publish container
- [ ] Verify GA4 Realtime
