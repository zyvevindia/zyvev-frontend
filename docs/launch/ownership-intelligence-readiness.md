# Ownership intelligence readiness — EVSavari

**Phase:** Premium Trusted EV Ownership Intelligence  
**Date:** 2026-05-20

---

## Positioning

EVSavari evolves from **trustworthy EV compare** toward **trusted EV ownership intelligence** — premium tier-1 journeys with realistic charging and ownership context, supported by a controlled authority ecosystem.

---

## Proceed when

1. **≥90%** in-catalog tier-1 at **PREMIUM_READY** on `/admin/premium-ownership-journeys`
2. **Authority ecosystem score ≥70** on `/admin/ownership-authority`
3. Avg ownership realism maturity ≥**72** across active families
4. Avg charging practicality maturity ≥**72**
5. Weekly governance cadence active (`docs/operations/premium-ownership-governance.md`)

---

## Premium journey maturity

| Metric | Dashboard |
|--------|-----------|
| PREMIUM_READY / GOOD / NEEDS_IMPROVEMENT | Premium ownership journeys |
| Ownership + charging sub-scores | Per family row |
| Weak ownership clusters | Cluster list |

---

## Authority maturity

| Metric | Dashboard |
|--------|-----------|
| Authority ecosystem score | Ownership authority |
| Buyer personas | Guidance confidence per persona |
| Compare ↔ guide maturity | compareGuideLinkMaturity |
| Weak authority clusters | Editorial queue |

---

## Buyer-facing trust

| Surface | Status |
|---------|--------|
| Detail ownership expectation | Below trust strip |
| Compare why recommended + charging/ownership caveats | Compare hub |
| Score maturity + data quality | Tooltips |

---

## Remaining weaknesses

1. MG Windsor and partial families await catalog + media  
2. Guide completeness is path-presence heuristic — not content depth NLP  
3. Traffic-weighted guide support needs admin token  
4. 90% PREMIUM_READY requires sustained catalog + manifest work  

---

## Validation

```bash
npm run build
npm run post-launch:smoke
npm run seo:qa
```
