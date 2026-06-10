# Audit Agent v1 — Validation

Generated: 2026-06-10T04:12:37.633Z

## Summary

| Metric | Result |
|--------|--------|
| Scenarios passed | 7/7 |
| Detection accuracy | 100% |
| False positive rate (healthy baseline) | 0% |
| Autonomous actions | 0 |

## Recommendation

**READY FOR ANALYTICS AGENT**

## Scenarios

### duplicate_variant
- **Pass:** Yes
- **Expected:** catalog_duplicate_variant
- **Detected:** catalog_duplicate_variant
- **Recommendation:** BLOCKED

### missing_score
- **Pass:** Yes
- **Expected:** catalog_missing_score
- **Detected:** catalog_missing_score
- **Recommendation:** REVIEW_REQUIRED

### broken_seo_metadata
- **Pass:** Yes
- **Expected:** seo_missing_metadata
- **Detected:** seo_missing_metadata
- **Recommendation:** REVIEW_REQUIRED

### missing_approval
- **Pass:** Yes
- **Expected:** governance_missing_approval
- **Detected:** governance_missing_approval
- **Recommendation:** BLOCKED

### registry_failure
- **Pass:** Yes
- **Expected:** registry_broken_url
- **Detected:** registry_broken_url, registry_missing_brochure
- **Recommendation:** BLOCKED

### critical_monitoring_alert
- **Pass:** Yes
- **Expected:** monitoring_unresolved_critical
- **Detected:** monitoring_unresolved_critical
- **Recommendation:** BLOCKED

### healthy_baseline
- **Pass:** Yes
- **Expected:** none
- **Detected:** 
- **Recommendation:** NO_ACTION

See [`audit-agent-v1-validation.json`](./audit-agent-v1-validation.json).
