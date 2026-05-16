# Controlled Launch & Market Learning Sprint — Execution Report

**Generated:** 2026-05-16

---

## 1. Controlled launch readiness

| Check | Result |
|-------|--------|
| Code + SEO activation | **launchReady: true** |
| Public beta foundation | **betaReady: true** (13/13) |
| Env profile `public-beta` | **Set at deploy** — `npm run ops:controlled-launch` reports `envReady` when vars match |

**New:** `services/controlled-launch/activationChecklist.js`, `npm run ops:controlled-launch`  
**Docs:** [controlled-launch-checklist.md](../controlled-launch-checklist.md)

---

## 2. Indexing activation readiness

- `npm run ops:search-console` — passes
- [weekly-indexing-review.md](../search-console-operations/weekly-indexing-review.md)
- **52** crawlable URLs, **17** SEO guides

---

## 3. Behavioral learning readiness

**New:** `services/market-learning/weeklyMarketLearningReport.js`  
**CLI:** `npm run ops:market-learning [--db] [days]`  
**Admin:** `/admin/editorial/market-learning`

Tracks: compare journeys, SEO entry, trust engagement, lead funnel, first-time EV patterns.

---

## 4. Lead-quality calibration

**Enhanced:** `lead-quality-intelligence/calibration.js` — internal calibration observations  
**Admin:** `/admin/editorial/lead-quality` shows calibration notes  
**DB path:** `buildLeadQualitySummaryFromDb` includes behavioral correlation when available

---

## 5. Observation expansion

**Seeded:** 16 additional observations across 5 variants:

- Nexon Empowered LR, XEV 9e Pack Two, Curvv LR, Tiago XT, MG ZS Excite

**Total verified:** 37 observations, **10** variants with coverage  
**CLI:** `npm run obs:seed-expansion`

---

## 6. Dealer pilot readiness

**Doc:** [dealer-pilot-readiness-checklist.md](../dealer-operations/dealer-pilot-readiness-checklist.md)  
Dealer-safe summaries + internal value signals — no dealer dashboards yet.

---

## 7. Market-health monitoring

**New:** `services/market-health-monitoring/`  
**CLI:** `npm run ops:market-health [--db]`  
**Admin:** `/admin/editorial/market-health`  
**Sample:** healthScore **92**, status **healthy**

---

## 8. Mobile usability

**CLI:** `npm run ops:mobile-readiness` → **mobileReady: true** (automated)  
**Doc:** [mobile-experience-validation.md](../production-validation/mobile-experience-validation.md)  
**Manual:** compare @375px + lead submit still required before scale

---

## 9. Operational validation

| Audit | Result |
|-------|--------|
| acq:audit | ok |
| ops:seo | health ok |
| ops:public-beta | betaReady true |
| audit-soft-launch-readiness | launchReady true |
| validate:production | ready |
| audit-performance-sanity | 0 errors |

---

## 10. Remaining blockers

1. Production env: `VITE_LAUNCH_PROFILE=public-beta` + backend profile vars  
2. GSC/Bing verify + weekly indexing cadence  
3. Manual mobile QA sign-off  
4. **19** variants still without observations  
5. Behavioral learning needs `--db` + `BEHAVIORAL_INTELLIGENCE_ENABLED=true` in prod  

## Recommended next block

1. **Week 1 controlled traffic** — organic + light referral only  
2. **Weekly ops rhythm** — `ops:market-learning --db`, `ops:market-health --db`, indexing review  
3. **Dealer pilot** — 1 metro, 3 models, dealer-safe summaries only  
4. **Observation batch 3** — ZS Exclusive+, Atto 3, Kona  

No git push performed.
