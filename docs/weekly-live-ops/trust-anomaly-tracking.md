# Trust Anomaly Tracking

**Purpose:** Log editorial trust/calibration anomalies for human review.  
**Never:** Auto-overwrite Tier-1 or public trust blocks from this log.

---

## How to generate

```bash
cd zyvev-backend
npm run ops:weekly-live-ops -- --db
```

Review `trustOperations.topAnomalies` in JSON output.

---

## Anomaly types

| Type | Meaning | Action |
|------|---------|--------|
| `mixed_signals` | Positive + caution observations on same theme | Editorial reconcile copy |
| `trust_mismatch` | Catalog band vs observation weights | Adjust trust bands manually |
| `stale_observation` | Observation past freshness window | Refresh or archive |
| `recurring_*` | 3+ observations on same theme | Confirm copy alignment |

---

## Active log

| Date | Variant slug | Anomaly | Severity | Owner | Status |
|------|--------------|---------|----------|-------|--------|
| 2026-05-16 | `tata-tiago-ev-xt` | 2 anomalies (mixed signals / mismatch) — review after batch 5 deepen | medium | Editorial | Open |
| 2026-05-16 | Fleet | 112 obs, 29/29 variants, 1 variant with anomalies | low | Ops | Monitoring |

---

## Fleet calibration readiness

Variants with `calibrationReady: false` need either more observations or conflict resolution.

**Target:** Resolve high-severity mismatches before dealer pilot conversations reference trust language.

---

## Governance

- `autoApply: false` always
- Observations remain internal-only
- Dealer summaries use qualitative patterns only
