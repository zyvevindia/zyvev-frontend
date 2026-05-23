# Public beta readiness — EVSavari

**Sprint:** Public Beta Trust & Authority Optimization  
**Date:** 2026-05-20  
**Principle:** Trust, quality, and calibration — not feature quantity.

---

## Executive recommendation

**Proceed with public beta** when all of the following hold for two consecutive weekly ops reviews:

1. **Beta stability score** ≥ **70** on `/admin/public-beta-ops`  
2. ≥ **50%** tier-1 in-catalog families at **PREMIUM_READY** or **GOOD** on `/admin/tier1-experience`  
3. Compare trust ≥ **60%** CALIBRATED+ACCEPTABLE on `/admin/compare-calibration`  
4. Tier-1 manifest media **avg completeness ≥ 75%** (target >85% before broad marketing)  
5. No unowned **immediate** freshness escalations on `/admin/catalog-freshness`

---

## Tier-1 EV readiness

| Check | Dashboard |
|-------|-----------|
| PREMIUM_READY / GOOD / NEEDS_IMPROVEMENT | `/admin/tier1-experience` |
| Compare + trust + lead + SEO scores | Same |
| Priority by traffic / compare / leads | `priorityScore` column |

**Families tracked:** Nexon EV, Punch EV, Tiago EV, Comet EV, Windsor EV (when catalog live), Atto 3, XUV400, Curvv EV.

---

## Compare trust maturity

| Layer | Status |
|-------|--------|
| Why recommended + ownership caveat | Compare hub |
| City vs highway nuance | Compare hub |
| Compare reliability line | Non-alarmist copy |
| Score tooltip → `trust_tooltip_opened` | GA4-ready |
| Calibration statuses | `/admin/compare-calibration` |

**Maturity:** **Developing** — suitable for public beta with weekly editorial review.

---

## SEO authority readiness

| Area | Dashboard |
|------|-----------|
| Topical + cluster authority | `/admin/seo-authority` |
| Six controlled guide targets | `AUTHORITY_GUIDE_TARGETS` |
| Compare → guide linking | `compareToGuideLinks` |
| No mass-generated spam pages | Policy — quality clusters only |

---

## Conversion readiness

| Signal | Dashboard |
|--------|-----------|
| Compare → lead funnels | `/admin/conversion-insights` |
| Detail → lead funnels | Same |
| Friction severity | Per-path rows |
| WhatsApp vs callback | Channel preference block |

---

## Analytics readiness

| Signal | Mechanism |
|--------|-----------|
| `compare_started` / `completed` / `abandoned` | GA4 + PostHog + local buffer |
| `lead_started` / `lead_submitted` | GA4 + buffer |
| `trust_tooltip_opened` | GA4 + buffer |
| Mobile vs desktop split | Client buffer + traffic-ops when token set |
| Scroll-depth approximation | `scroll_depth` buffer events |

**Dashboard:** Analytics section on `/admin/public-beta-ops`.

---

## Media maturity

| Metric | Target |
|--------|--------|
| Tier-1 role completeness | >85% |
| Placeholder usage | Trending down |
| Roadmap | `docs/operations/tier1-media-completion-roadmap.md` |

---

## Operational confidence

| Component | Source |
|-----------|--------|
| Operational confidence index | Live probe + metrics buffer |
| Weekly snapshots | `public-beta-ops` localStorage |
| Beta stability score | Weighted composite |

---

## Remaining weaknesses

1. Traffic dashboards need admin token — empty funnels without login  
2. GA4 device split requires production GA4 + traffic-ops — buffer is UA-based only  
3. MG Windsor not in catalog — tracked as NEEDS_IMPROVEMENT until API adds family  
4. Metrics buffer is per-browser — export JSON for team reviews  
5. True LCP RUM not wired — route paint remains a proxy  

---

## Validation commands

```bash
npm run build
npm run post-launch:smoke
npm run seo:qa
```

Manual: compare pages (2+ EVs), detail leads, mobile compare scroll, admin exports.
