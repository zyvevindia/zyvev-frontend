# Trusted beta readiness — EVSavari

**Sprint:** Trusted EV Intelligence Beta  
**Date:** 2026-05-20

---

## Executive recommendation

**Proceed to trusted public beta** when two consecutive weekly reviews show:

1. **Beta stability ≥ 75** and `betaConfidenceEvolution` = `trusted_beta_ready` on `/admin/public-beta-ops`
2. **≥70%** compare pairs TRUSTED+GOOD on `/admin/recommendation-realism`
3. **≥85%** active tier-1 **PREMIUM_READY** on `/admin/premium-journeys`
4. **Authority depth score ≥ 70** (six topic clusters)
5. **Conversion trust ≥ 60** on `/admin/conversion-quality`
6. Operational confidence index ≥ **65**

---

## Recommendation realism maturity

| Metric | Dashboard |
|--------|-----------|
| TRUSTED / GOOD / NEEDS_REVIEW | `/admin/recommendation-realism` |
| Realism, ownership, charging, nuance, confidence maturity scores | Per pair |
| Human review queue | `humanReviewQueue` |
| Weak clusters | `weakRecommendationClusters` |

**Maturity:** Developing — editorial oversight required weekly.

---

## Premium EV readiness

| Family | Target |
|--------|--------|
| Nexon, Punch, Tiago, Comet, Atto 3, XUV400, Curvv | PREMIUM_READY |
| Windsor | PREMIUM_READY when catalog live |

**Dashboard:** `/admin/premium-journeys` — goal **85% PREMIUM_READY** on in-catalog families.

---

## Authority depth maturity

| Topic | Support |
|-------|---------|
| Charging reality | `/charging-guides/*`, discovery presets |
| Ownership cost | `/ownership/running-cost` |
| Apartment charging | `/discover/apartment-living` |
| City vs highway | `/discover/city-driving`, `/discover/highway-evs` |
| Battery degradation | `/ownership/battery-health` |
| Running cost | Ownership + discovery hubs |

**Module:** `authorityDepthOps` — compare ↔ guide links, no spam pages.

---

## Trust confidence maturity

| Layer | Status |
|-------|--------|
| Why recommended + caveats | Compare hub |
| Estimated vs verified nuance | Compare trust explain |
| Confidence impacted by missing data | Score tooltip |
| Score maturity hints | Score tooltip |
| Compare reliability evolution | `compareTrustCopy` |

---

## Operational confidence

| Trend | Source |
|-------|--------|
| Recommendation trust % | Weekly trust snapshot |
| Premium ready % | Weekly trust snapshot |
| Authority depth | Weekly trust snapshot |
| Conversion trust | Weekly trust snapshot |
| Ops confidence | Live probe + metrics buffer |

**Hub:** `/admin/public-beta-ops`

---

## Conversion quality maturity

| Signal | Dashboard |
|--------|-----------|
| Conversion trust score | `/admin/conversion-quality` |
| Lead quality confidence | Per journey row |
| Abandoned lead clusters | Buffer + report |
| Trust-driven uplift proxy | Tooltip engagement vs leads |

---

## Remaining trust weaknesses

1. Traffic-backed scoring needs admin token  
2. Per-browser metrics buffer — export for team alignment  
3. MG Windsor awaiting catalog  
4. Tier-1 media often below 85% manifest completeness  
5. GA4 multi-session accuracy needs production analytics pipeline  

---

## Validation

```bash
npm run build
npm run post-launch:smoke
npm run seo:qa
```

Governance: `docs/operations/trusted-beta-governance.md`
