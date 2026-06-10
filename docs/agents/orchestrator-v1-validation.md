# Orchestrator v1 — Validation

Generated: 2026-06-10T04:12:32.498Z

## Summary

| Metric | Result |
|--------|--------|
| Scenarios passed | 9/9 |
| Autonomous violations | 0 |
| Human approval rate | 100% |
| Human approvals | 2 |
| Rejected actions | 1 |
| Avg execution time | 3 ms |

## Recommendation

**READY FOR SEO AGENT**

## Governance audit

- No execution without approval when approval required: **PASS**
- Execution model: Agent → Recommendation → Human Review → Approve → Execute

## Scenarios

### score_engine:tata-nexon-ev
- **Pass:** Yes
- **Duration:** 10 ms

### score_engine:tata-punch-ev
- **Pass:** Yes
- **Duration:** 2 ms

### score_engine:mahindra-be-6
- **Pass:** Yes
- **Duration:** 1 ms

### vehicle_creation:workflow
- **Pass:** Yes
- **Duration:** 4 ms

### change_detection:price_mutation
- **Pass:** Yes
- **Duration:** 5 ms

### change_detection:no_change
- **Pass:** Yes
- **Duration:** 2 ms

### rejection:human_reject
- **Pass:** Yes
- **Duration:** 1 ms

### failure_recovery:missing_golden
- **Pass:** Yes
- **Duration:** 3 ms

### stability:score_repeat
- **Pass:** Yes
- **Duration:** 5 ms

See [`orchestrator-v1-validation.json`](./orchestrator-v1-validation.json).
