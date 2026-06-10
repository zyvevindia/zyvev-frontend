# EVSavari Growth Phase 3 — Traffic and Analytics

Generated: 2026-06-10  
Prior phase: Growth Phase 2 — **READY_FOR_TRAFFIC**  
Platform agents, catalog acquisition, score engine core, SEO infrastructure, UX: **not modified**

---

## Recommendation

**READY_FOR_REAL_TRAFFIC**

---

## Instrumentation summary

| Layer | Implementation | Env var |
|-------|----------------|---------|
| **GA4** | Direct gtag or via GTM dataLayer | `VITE_GA_ID` |
| **GTM** | Central tag container + dataLayer events | `VITE_GTM_ID` |
| **Microsoft Clarity** | Session replay + heatmaps | `VITE_CLARITY_ID` |
| **PostHog** | Optional product analytics (existing) | `VITE_POSTHOG_KEY` |
| **Dedupe** | `shouldEmitEvent` 1.2s TTL (StrictMode safe) | — |

When `VITE_GTM_ID` is set, GA4 loads through GTM; app events push to `dataLayer` for tag routing.

---

## Canonical GA4 events (Phase 3)

| Event | Status | Wired in |
|-------|--------|----------|
| `page_view` | ✅ | `App.jsx` → `trackPageView` |
| `vehicle_view` | ✅ | `trackLaunchEvViewed` → CarDetails |
| `compare_view` | ✅ | `ComparePage`, compare guides |
| `search_used` | ✅ | `ListingPage` catalog search |
| `filter_used` | ✅ | `ListingPage` brand/sort/price/body/intel |
| `score_panel_opened` | ✅ | `CompareScoreInsight` |
| `variant_recommendation_clicked` | ✅ | `SeoRecommendationList` variant/agent guides |

Full taxonomy: [`docs/analytics/event-taxonomy.md`](event-taxonomy.md)

---

## Validation

| Check | Result |
|-------|--------|
| Required events defined | 7/7 |
| GTM provider | ✅ |
| Clarity provider | ✅ |
| Duplicate event guard | ✅ `src/analytics/dedupe.js` |
| Build | ✅ Pass |
| Checks passed | 16 |
| Issues | 0 |



---

## Deploy configuration

```bash
# .env.local (production)
VITE_GTM_ID=GTM-XXXXXXX
VITE_GA_ID=G-XXXXXXXXXX   # optional if GA4 tag lives in GTM only
VITE_CLARITY_ID=xxxxxxxxxx
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_DEBUG=false
```

### GTM container tags (configure in GTM UI)

1. **GA4 Configuration** — Measurement ID from `VITE_GA_ID`
2. **GA4 Event** tags — trigger on Custom Event matching dataLayer `event` names
3. **Microsoft Clarity** — Custom HTML or template (optional if using `VITE_CLARITY_ID` direct load)

---

## Search Console

Playbook: [`docs/analytics/search-console-playbook.md`](search-console-playbook.md)

---

## Commands

```bash
npm run analytics:growth-phase3
npm run build
# Enable debug: VITE_ANALYTICS_DEBUG=true npm run dev
```

---

## Build output (tail)

```
│ gzip:   8.43 kB
dist/assets/Admin-4LFz_PVh.js                             34.08 kB │ gzip:   9.05 kB
dist/assets/PublicBetaOpsPage-DXS9WcDO.js                 37.37 kB │ gzip:   8.12 kB
dist/assets/catalogImportApi-B4cyc2Pv.js                  43.43 kB │ gzip:  14.10 kB
dist/assets/manifest-D_1G7N3A.js                          62.14 kB │ gzip:   7.37 kB
dist/assets/betaStabilizationOps-BLuG4G7g.js              63.07 kB │ gzip:  13.07 kB
dist/assets/CarDetails-zmtmiW_M.js                        85.52 kB │ gzip:  24.44 kB
dist/assets/react-BpOrghXw.js                            260.38 kB │ gzip:  84.53 kB
dist/assets/SalesAnalytics-DuT5129C.js                   357.73 kB │ gzip: 107.52 kB
dist/assets/index-YCLEwC9I.js                            569.92 kB │ gzip: 156.63 kB

✓ built in 2.50s
```
