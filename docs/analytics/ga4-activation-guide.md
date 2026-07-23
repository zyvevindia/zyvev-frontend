# GA4 Activation Guide

**Scope:** Pre–Sprint 3 operational readiness  
**Site:** https://evsavari.com

---

## Prerequisites

- Analytics architecture deployed (centralized `src/analytics/`)
- Vercel access to production environment variables
- Google Analytics account

---

## Recommended Property Setup

| Field | Recommendation |
|-------|----------------|
| **Property name** | EVSavari Production |
| **Reporting time zone** | (GMT+05:30) Asia/Kolkata |
| **Currency** | INR |
| **Industry** | Automotive / E-commerce |
| **Business size** | Small |

---

## Step 1 — Create GA4 Property

1. Open [Google Analytics](https://analytics.google.com/)
2. Admin → Create → **Property**
3. Name: **EVSavari Production**

---

## Step 2 — Create Web Data Stream

1. Admin → Data streams → **Add stream** → **Web**
2. Website URL: `https://evsavari.com`
3. Stream name: **EVSavari Web Production**

---

## Step 3 — Copy Measurement ID

From the stream details page, copy **Measurement ID** (format `G-XXXXXXXXXX`).

**Do not paste this ID into source code.**

---

## Step 4 — Configure Vercel Environment Variables

In Vercel → Project → Settings → Environment Variables → **Production**:

```
VITE_GA_ID=G-XXXXXXXXXX
VITE_ANALYTICS_ENABLED=true
```

Optional:

```
VITE_ANALYTICS_DEBUG=false
VITE_ANALYTICS_REQUIRE_CONSENT=false
VITE_CLARITY_ID=your_clarity_id
```

---

## Step 5 — Redeploy Production

Trigger a production deployment after env vars are saved. Analytics scripts load only at build/runtime when IDs are present.

---

## Step 6 — Verify Real-Time Events

1. GA4 → Reports → **Realtime**
2. Open https://evsavari.com in an incognito window
3. Navigate: Home → Browse → Brand landing → Vehicle detail
4. Confirm events within 30 seconds:

| Event | Trigger |
|-------|---------|
| `page_view` | Every route change |
| `homepage_viewed` | `/` |
| `browse_viewed` | `/cars` |
| `landing_viewed` | `/brands/tata`, `/best-evs/city` |
| `vehicle_view` | `/cars/tata-nexon-ev` |
| `guide_viewed` | `/ownership-guides/*` |

---

## GTM vs Direct GA4

| Approach | When to use |
|----------|-------------|
| **Direct GA4** (`VITE_GA_ID`) | Simplest — single measurement ID |
| **GTM-first** (`VITE_GTM_ID`) | When marketing needs tag management without redeploys |

If `VITE_GTM_ID` is set, direct GA4 init is skipped — configure GA4 Configuration tag inside GTM.

See [gtm-activation-guide.md](./gtm-activation-guide.md).

---

## Recommended GA4 Settings

### Enhanced measurement

Enable in stream settings:

- Page views (browser — our SPA sends manually)
- Outbound clicks
- Site search (supplement with `search_used` custom event)
- Scrolls

### Data retention

- Event data: **14 months**
- User data: per Google defaults

### Google Signals

Enable after privacy policy update (cross-device, remarketing).

---

## Manual Steps Checklist

- [ ] Create GA4 property
- [ ] Create web data stream
- [ ] Copy Measurement ID
- [ ] Add `VITE_GA_ID` to Vercel Production
- [ ] Redeploy
- [ ] Verify Realtime events
- [ ] Link Search Console (see search-console-integration-guide.md)
- [ ] Mark conversions (see conversion-tracking-guide.md)
