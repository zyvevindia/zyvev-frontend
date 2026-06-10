# Catalog Acquisition v6 — Publish Readiness Delta

Generated: 2026-06-09T08:03:58.933Z

## Targets vs v6

| Target | Goal | v6 Actual | Met |
|--------|------|-----------|-----|
| Field coverage | >60% | 74.8% | ✓ |
| Feature coverage | >50% | 48.2% | ✗ |
| Quality gate pass | >50% | 25% | ✗ |
| Manual corrections | <10 | 24.6 | ✗ |

## Before (v3) vs After (v6)

| Metric | v3 | v6 | Δ |
|--------|----|----|---|
| Avg evidence records | 8.9 | 18.5 | +9.6 |
| Avg coverage | 34.5% | 74.8% | +40.3% |
| Avg feature coverage | 0% | 48.2% | +48.2% |
| Avg publish readiness | 35.3 | 44.5 | +9.2 |
| Gate pass rate | 0% | 25% | +25% |
| Avg manual corrections | 33.1 | 24.6 | -8.5✓ |

## Per-vehicle gate blockers (v6 top 10)

### tata-curvv-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 2 vs golden 3
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got "1699000"
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 2099000, got "1949000"
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got null
- **batteryCapacityKwh** (field_incorrect, impact 50): Golden mismatch: expected 45, got "55"
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "MIDC", got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 150, got "70"
- **acChargingTimeHours** (field_incorrect, impact 50): Golden mismatch: expected 6.3, got "7.9"
- **dcChargingTimeMinutes** (field_incorrect, impact 50): Golden mismatch: expected 30, got "40"
- **airbags** (field_incorrect, impact 50): Golden mismatch: expected 6, got null

### tata-nexon-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 9 vs golden 13
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 1249000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 1749000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1249000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 489, got "275"
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "MIDC", got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7.2, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 50, got null
- **acChargingTimeHours** (field_incorrect, impact 50): Golden mismatch: expected 4.3, got null
- **dcChargingTimeMinutes** (field_incorrect, impact 50): Golden mismatch: expected 56, got null

### tata-punch-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 5 vs golden 6
- **batteryCapacityKwh** (unresolved_conflicts, impact 75): Unresolved evidence conflict: batteryCapacityKwh
- **claimedRangeKm** (unresolved_conflicts, impact 75): Unresolved evidence conflict: claimedRangeKm
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 1259000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 969000, got null
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "MIDC", got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7.2, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 65, got null
- **acChargingTimeHours** (field_incorrect, impact 50): Golden mismatch: expected 4.5, got "14.8"
- **torqueNm** (field_incorrect, impact 50): Golden mismatch: expected 154, got null

### mahindra-be-6

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 2 vs golden 3
- **batteryCapacityKwh** (unresolved_conflicts, impact 75): Unresolved evidence conflict: batteryCapacityKwh
- **claimedRangeKm** (unresolved_conflicts, impact 75): Unresolved evidence conflict: claimedRangeKm
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 1890000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 2690000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1890000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 500, got "557"
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "MIDC", got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 11, got "7.2"
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 150, got "140"

### mahindra-xev-9e

- **claimedRangeKm** (unresolved_conflicts, impact 75): Unresolved evidence conflict: claimedRangeKm
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 2190000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 656, got "500"
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "MIDC", got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 175, got "140"
- **airbags** (field_incorrect, impact 50): Golden mismatch: expected 6, got null
- **sunroof** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **connectedCar** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2v** (field_incorrect, impact 50): Golden mismatch: expected false, got null

### mg-windsor-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 2 vs golden 3
- **batteryCapacityKwh** (unresolved_conflicts, impact 75): Unresolved evidence conflict: batteryCapacityKwh
- **claimedRangeKm** (unresolved_conflicts, impact 75): Unresolved evidence conflict: claimedRangeKm
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 999000, got "1399800"
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 1689000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 999000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 331, got "332 km – 449 km"
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "ARAI", got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 45, got "50"
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"

### hyundai-creta-electric

- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 2499000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 390, got "420"
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "ARAI", got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 11, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 150, got null
- **airbags** (field_incorrect, impact 50): Golden mismatch: expected 6, got null
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"
- **v2v** (field_incorrect, impact 50): Golden mismatch: expected false, got null
- **v2l** (feature_missing, impact 45): Feature mismatch: expected false, got true

### byd-atto-3

- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 2499000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 3399000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 2499000, got null
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "ARAI", got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 80, got null
- **dcChargingTimeMinutes** (field_incorrect, impact 50): Golden mismatch: expected 30, got null
- **airbags** (field_incorrect, impact 50): Golden mismatch: expected 6, got null
- **connectedCar** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected true, got null
