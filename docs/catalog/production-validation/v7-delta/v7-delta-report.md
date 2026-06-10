# Catalog Acquisition v7 — Publish Readiness Delta

Generated: 2026-06-09T10:04:58.189Z

## Success targets vs v7

| Target | Goal | v7 Actual | Met |
|--------|------|-----------|-----|
| Field coverage | >80% | 85.3% | ✓ |
| Feature coverage | >70% | 48.2% | ✗ |
| Price accuracy | >70% | 9.3% | ✗ |
| Quality gate pass | >50% | 37.5% | ✗ |
| Manual corrections | <10 | 21.9 | ✗ |
| Publish readiness | >70 | 50.6 | ✗ |

## Before (v6) vs After (v7)

| Metric | v6 | v7 | Δ |
|--------|----|----|---|
| Avg evidence records | 17.8 | 24.3 | +6.5 |
| Avg coverage | 69.6% | 85.3% | +15.7% |
| Avg feature coverage | 48.2% | 48.2% | 0% |
| Avg price accuracy | 18.9% | 9.3% | -9.6% |
| Avg publish readiness | 47.3 | 50.6 | +3.3 |
| Gate pass rate | 12.5% | 37.5% | +25% |
| Avg manual corrections | 24.8 | 21.9 | -2.9 ✓ |

## Per-vehicle (v7)

| Vehicle | v6 gates | v7 gates | v6 variants | v7 variants | v6 coverage | v7 coverage |
|---------|----------|----------|-------------|-------------|-------------|-------------|
| tata-curvv-ev | FAIL | FAIL | 2 | 2 | 73.9% | 87% |
| tata-nexon-ev | FAIL | FAIL | 9 | 9 | 54.2% | 62.5% |
| tata-punch-ev | FAIL | FAIL | 5 | 5 | 54.2% | 70.8% |
| mahindra-be-6 | FAIL | PASS | 3 | 3 | 80% | 100% |
| mahindra-xev-9e | FAIL | PASS | 3 | 3 | 75% | 90% |
| mg-windsor-ev | FAIL | FAIL | 2 | 2 | 100% | 110% |
| mg-zs-ev | FAIL | FAIL | 3 | 3 | —% | —% |
| hyundai-creta-electric | FAIL | FAIL | 2 | 1 | 60% | 85% |
| byd-atto-3 | PASS | PASS | 3 | 3 | 59.1% | 77.3% |

## Per-vehicle gate blockers (v7 top 10)

### tata-curvv-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 2 vs golden 3
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got 1699000
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 2099000, got 1949000
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got 1699000
- **batteryCapacityKwh** (field_incorrect, impact 50): Golden mismatch: expected 45, got 55
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7.2, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 150, got 70
- **acChargingTimeHours** (field_incorrect, impact 50): Golden mismatch: expected 6.3, got null
- **dcChargingTimeMinutes** (field_incorrect, impact 50): Golden mismatch: expected 30, got 40
- **ncapRating** (field_incorrect, impact 50): Golden mismatch: expected 5, got null

### tata-nexon-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 9 vs golden 13
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 1249000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 1749000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1249000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 489, got 275
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7.2, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 50, got null
- **acChargingTimeHours** (field_incorrect, impact 50): Golden mismatch: expected 4.3, got null
- **powerPs** (field_incorrect, impact 50): Golden mismatch: expected 127, got null
- **torqueNm** (field_incorrect, impact 50): Golden mismatch: expected 215, got null

### tata-punch-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 5 vs golden 6
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 1259000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 969000, got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7.2, got null
- **acChargingTimeHours** (field_incorrect, impact 50): Golden mismatch: expected 4.5, got "14.8"
- **torqueNm** (field_incorrect, impact 50): Golden mismatch: expected 154, got null
- **ncapRating** (field_incorrect, impact 50): Golden mismatch: expected 5, got null
- **sunroof** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"
- **ventilatedSeats** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"
- **camera360** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"

### mahindra-be-6

- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 2690000, got 2190000
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1890000, got null
- **batteryCapacityKwh** (field_incorrect, impact 50): Golden mismatch: expected 59, got "59 to 79"
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 500, got 683
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 11, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 150, got 140
- **ventilatedSeats** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **connectedCar** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2v** (field_incorrect, impact 50): Golden mismatch: expected false, got null

### mahindra-xev-9e

- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 2190000, got null
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "MIDC", got "ARAI"
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 11, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 175, got 140
- **sunroof** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **connectedCar** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2v** (field_incorrect, impact 50): Golden mismatch: expected false, got null
- **sunroof** (feature_missing, impact 45): Feature mismatch: expected true, got null
- **connectedCar** (feature_missing, impact 45): Feature mismatch: expected true, got null

### mg-windsor-ev

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 2 vs golden 3
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 999000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 1689000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 999000, got null
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 331, got 449
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "ARAI", got "MIDC"
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 45, got 50
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"
- **v2v** (field_incorrect, impact 50): Golden mismatch: expected false, got null
- **adas** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"

### hyundai-creta-electric

- **variant_count_mismatch** (variant_count_mismatch, impact 85): Variant count 1 vs golden 3
- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 2499000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 1799000, got null
- **batteryCapacityKwh** (field_incorrect, impact 50): Golden mismatch: expected 42, got 51
- **claimedRangeKm** (field_incorrect, impact 50): Golden mismatch: expected 390, got 510
- **rangeTestStandard** (field_incorrect, impact 50): Golden mismatch: expected "ARAI", got "MIDC"
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 11, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 150, got 50
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected false, got "true"

### byd-atto-3

- **startingPrice** (field_incorrect, impact 50): Golden mismatch: expected 2499000, got null
- **topVariantPrice** (field_incorrect, impact 50): Golden mismatch: expected 3399000, got null
- **exShowroomPrice** (field_incorrect, impact 50): Golden mismatch: expected 2499000, got null
- **acChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 7, got null
- **dcChargingKw** (field_incorrect, impact 50): Golden mismatch: expected 80, got 7.2
- **dcChargingTimeMinutes** (field_incorrect, impact 50): Golden mismatch: expected 30, got 24
- **connectedCar** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2l** (field_incorrect, impact 50): Golden mismatch: expected true, got null
- **v2v** (field_incorrect, impact 50): Golden mismatch: expected false, got null
- **connectedCar** (feature_missing, impact 45): Feature mismatch: expected true, got null
