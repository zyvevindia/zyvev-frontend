# Monitoring Agent v1 — Validation

Generated: 2026-06-10T04:12:36.257Z

## Summary

| Metric | Result |
|--------|--------|
| Scenarios passed | 7/7 |
| Detection accuracy | 100% |
| False positives (healthy baseline) | 0 |
| Autonomous actions | 0 |

## Recommendation

**READY FOR AUDIT AGENT**

## Scenarios

### broken_oem_url
- **Pass:** Yes
- **Expected:** oem_unreachable
- **Detected:** oem_unreachable, registry_unverified_url, registry_missing_brochure
- **Recommendation:** BLOCKED

### missing_brochure
- **Pass:** Yes
- **Expected:** registry_missing_brochure
- **Detected:** registry_unverified_url, registry_missing_brochure
- **Recommendation:** BLOCKED

### stale_score
- **Pass:** Yes
- **Expected:** score_generation_stale
- **Detected:** registry_unverified_url, score_generation_stale, registry_missing_brochure
- **Recommendation:** BLOCKED

### duplicate_seo_slug
- **Pass:** Yes
- **Expected:** seo_duplicate_slug
- **Detected:** registry_unverified_url, seo_duplicate_slug, registry_missing_brochure, seo_unpublished_drafts
- **Recommendation:** BLOCKED

### agent_failure
- **Pass:** Yes
- **Expected:** agent_recent_failure
- **Detected:** agent_high_failure_rate, registry_unverified_url, agent_recent_failure, registry_missing_brochure
- **Recommendation:** BLOCKED

### score_drift
- **Pass:** Yes
- **Expected:** score_large_drift
- **Detected:** registry_unverified_url, score_large_drift, registry_missing_brochure
- **Recommendation:** BLOCKED

### healthy_baseline
- **Pass:** Yes
- **Expected:** none
- **Detected:** 
- **Recommendation:** NO_ACTION

See [`monitoring-agent-v1-validation.json`](./monitoring-agent-v1-validation.json).
