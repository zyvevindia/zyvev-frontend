# Beta intelligence readiness — EVSavari

**Sprint:** Beta Intelligence Calibration  
**Date:** 2026-05-20  
**Principle:** Calibration and operational maturity — no speculative AI agents.

---

## Executive recommendation

**Proceed to controlled public beta** when:

1. ≥60% compare pairs are **CALIBRATED** or **ACCEPTABLE** on `/admin/compare-calibration`
2. Operational confidence index ≥**65** on Launch monitor
3. Tier-1 freshness queue has no **immediate** escalations without owner assignment
4. Weekly ops cadence from `docs/operations/post-launch-governance.md` is active

---

## Compare calibration status

| Metric | Target | How to measure |
|--------|--------|----------------|
| CALIBRATED pairs | Growing week-on-week | `/admin/compare-calibration` |
| NEEDS_TUNING | &lt;30% of scored pairs | Same |
| Editorial queue | Triage within 7 days | `needsEditorial` rows |

**Signals scored:** score separation, duplicate strengths, charging/ownership practicality, traffic completion.

---

## Trust maturity

| Layer | Status |
|-------|--------|
| Compare “Why recommended?” | Live on 2+ EV compares |
| Compare reliability summary | Live |
| Score tooltip + data quality note | Live |
| Estimated vs verified labels | Trust strip + spec hints |
| Overconfident tone guard | Low-confidence → directional copy |

**Maturity:** **Developing** — suitable for beta with editorial oversight.

---

## Catalog freshness maturity

| Automation | Status |
|------------|--------|
| Stale price alerts | Automated |
| Missing verification | Automated |
| Outdated charging | Automated |
| Stale media | Automated |
| High traffic + stale escalation | Automated |

**Dashboard:** `/admin/catalog-freshness` (priority queue + CSV/JSON export).

---

## SEO authority readiness

| Area | Status |
|------|--------|
| Cluster authority score | Static + traffic heuristics |
| Compare SEO maturity | developing / mature per traffic |
| Internal link recommendations | `/admin/seo-authority` |
| Guide opportunities | Charging, ownership, best-EV-under-X presets |

**GSC:** Still manual — no API integration by design.

---

## Operational confidence

| Component | Source |
|-----------|--------|
| API health confidence | Live probe |
| Compare performance confidence | Metrics buffer |
| Image reliability | Fallback counts |
| Route confidence | Slow route buffer |
| **Operational confidence index** | Weighted composite |
| Historical snapshots | localStorage (14 days) |

**Dashboard:** `/admin/soft-launch-monitor` + `/admin/performance-learning`

---

## Performance confidence

- Route paint proxy (not true LCP RUM)
- Regression alerts for API latency, fallback spikes, slow routes
- **Recommendation:** Add GA4 Web Vitals in next ops phase (no code required for beta gate)

---

## Top remaining weaknesses

1. Traffic/device splits need backend or GA4 for mobile vs desktop
2. Compare calibration requires **Refresh** with admin token + behavioral data
3. Metrics buffer is per-browser — ops team should align on shared export JSON
4. Tier-1 media gaps (46% manifest) — placeholders acceptable but cap marketing on weak pairs
5. Render API cold start — mitigated, not eliminated

---

## New admin systems (beta sprint)

| Route | Purpose |
|-------|---------|
| `/admin/compare-calibration` | CALIBRATED / ACCEPTABLE / NEEDS_TUNING |
| `/admin/high-intent-journeys` | Funnel quality + friction |
| `/admin/seo-authority` | Clusters, links, guide opportunities |
| *(upgraded)* `/admin/catalog-freshness` | Automation queue |
| *(upgraded)* `/admin/feedback-learning` | Impact prioritization |
| *(upgraded)* `/admin/soft-launch-monitor` | Ops confidence index |

**Exports:** CSV + JSON with build commit, timestamp, environment on all major reports.

---

## Validation

```bash
npm run build
npm run post-launch:smoke
npm run seo:qa
```

---

## Related docs

- `docs/launch/soft-launch-readiness-report.md`
- `docs/operations/post-launch-governance.md`
