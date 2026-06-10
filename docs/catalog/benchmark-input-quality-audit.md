# Benchmark Input Quality Audit

Generated: 2026-06-09

Audit-only analysis. No extraction, prompt, or benchmark code was modified.

## Primary finding

**44.4%** of OpenAI benchmark failures are caused by **missing source evidence** (Category A).

**55.6%** are caused by **extraction quality, normalization, or golden/source mismatch** (Categories B, C, D).

---

## Aggregate summary

| Metric | Value |
|--------|-------|
| Golden fields analyzed | 173 |
| Source supports golden value | 103 (59.5%) |
| Source missing golden evidence | 70 (40.5%) |
| Total OpenAI extraction failures | 133 |
| **A — Source lacked evidence** | 59 (44.4%) |
| **B — Evidence in source, extraction failed** | 59 |
| **C — Evidence in source, normalization failed** | 4 |
| **D — Golden/source benchmark mismatch** | 11 |

### Root cause verdict

Benchmark failures split roughly **44.4% missing source evidence** vs **55.6% extraction/normalization/mismatch**. Poor scores reflect **both** sparse synthetic HTML and grounded extraction returning null on fields that are present in source.

---

## Per-vehicle analysis

### Tata Nexon EV (`tata-nexon-ev`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 24 |
| Source fields present (golden value found) | 12 |
| **Coverage %** | 50% |
| **Missing evidence %** | 50% |

**Source present for:** brand, model, bodyType, familySlug, rangeTestStandard, acChargingKw, dcChargingKw, airbags, ncapRating, sunroof, ventilatedSeats, camera360

**Missing from source:** startingPrice (exact INR price); topVariantPrice (exact INR price); exShowroomPrice (exact INR price); claimedRangeKm (range km); acChargingTimeHours (not in sparse benchmark HTML); dcChargingTimeMinutes (not in sparse benchmark HTML); powerPs (not in sparse benchmark HTML); torqueNm (not in sparse benchmark HTML); adas (ADAS absent); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| model | "Nexon EV" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "tata-nexon-ev" | null | B — extraction failed |
| startingPrice | 1249000 | "1499000" | D — golden/source mismatch |
| topVariantPrice | 1749000 | null | D — golden/source mismatch |
| exShowroomPrice | 1249000 | null | D — golden/source mismatch |
| claimedRangeKm | 489 | "275" | D — golden/source mismatch |
| rangeTestStandard | "MIDC" | null | B — extraction failed |
| acChargingKw | 7.2 | "3.3" | C — normalization failed |
| acChargingTimeHours | 4.3 | null | A — no source evidence |
| dcChargingTimeMinutes | 56 | null | A — no source evidence |
| powerPs | 127 | null | A — no source evidence |
| torqueNm | 215 | null | A — no source evidence |
| ncapRating | 5 | "5 star Bharat NCAP" | C — normalization failed |
| sunroof | false | null | B — extraction failed |
| ventilatedSeats | false | null | B — extraction failed |
| camera360 | false | null | B — extraction failed |
| connectedCar | true | null | A — no source evidence |
| v2l | false | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | false | "true" | D — golden/source mismatch |

### Tata Curvv EV (`tata-curvv-ev`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 23 |
| Source fields present (golden value found) | 14 |
| **Coverage %** | 60.9% |
| **Missing evidence %** | 39.1% |

**Source present for:** brand, model, bodyType, familySlug, startingPrice, topVariantPrice, exShowroomPrice, batteryCapacityKwh, claimedRangeKm, rangeTestStandard, acChargingKw, dcChargingKw, airbags, adas

**Missing from source:** acChargingTimeHours (not in sparse benchmark HTML); dcChargingTimeMinutes (not in sparse benchmark HTML); ncapRating (NCAP stars); sunroof (sunroof keyword); ventilatedSeats (ventilated seats); camera360 (360 camera); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| brand | "Tata" | null | B — extraction failed |
| model | "Curvv EV" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "tata-curvv-ev" | null | B — extraction failed |
| startingPrice | 1799000 | null | B — extraction failed |
| topVariantPrice | 2099000 | null | B — extraction failed |
| exShowroomPrice | 1799000 | null | B — extraction failed |
| claimedRangeKm | 502 | "502–585" | C — normalization failed |
| rangeTestStandard | "MIDC" | null | B — extraction failed |
| acChargingTimeHours | 6.3 | null | A — no source evidence |
| dcChargingTimeMinutes | 30 | null | A — no source evidence |
| ncapRating | 5 | null | D — golden/source mismatch |
| sunroof | true | null | A — no source evidence |
| ventilatedSeats | true | null | A — no source evidence |
| camera360 | true | null | A — no source evidence |
| connectedCar | true | null | A — no source evidence |
| v2l | true | null | A — no source evidence |
| v2v | false | null | A — no source evidence |

### Tata Punch EV (`tata-punch-ev`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 24 |
| Source fields present (golden value found) | 10 |
| **Coverage %** | 41.7% |
| **Missing evidence %** | 58.3% |

**Source present for:** brand, model, bodyType, familySlug, rangeTestStandard, acChargingKw, adas, sunroof, ventilatedSeats, camera360

**Missing from source:** startingPrice (exact INR price); topVariantPrice (exact INR price); exShowroomPrice (exact INR price); claimedRangeKm (range km); dcChargingKw (kW in source: [25, 35, 7.2, 50]); acChargingTimeHours (not in sparse benchmark HTML); dcChargingTimeMinutes (not in sparse benchmark HTML); powerPs (not in sparse benchmark HTML); torqueNm (not in sparse benchmark HTML); airbags (airbag count); ncapRating (NCAP stars); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "tata-punch-ev" | null | B — extraction failed |
| startingPrice | 969000 | null | D — golden/source mismatch |
| topVariantPrice | 1259000 | null | D — golden/source mismatch |
| exShowroomPrice | 969000 | null | D — golden/source mismatch |
| claimedRangeKm | 468 | "315" | D — golden/source mismatch |
| rangeTestStandard | "MIDC" | null | B — extraction failed |
| dcChargingKw | 65 | "50" | D — golden/source mismatch |
| acChargingTimeHours | 4.5 | null | A — no source evidence |
| dcChargingTimeMinutes | 26 | null | A — no source evidence |
| powerPs | 87 | null | A — no source evidence |
| torqueNm | 154 | null | A — no source evidence |
| airbags | 6 | null | A — no source evidence |
| ncapRating | 5 | null | A — no source evidence |
| sunroof | false | null | B — extraction failed |
| ventilatedSeats | false | null | B — extraction failed |
| camera360 | false | null | B — extraction failed |
| connectedCar | true | null | A — no source evidence |
| v2l | false | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | false | null | B — extraction failed |

### MG Windsor EV (`mg-windsor-ev`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 20 |
| Source fields present (golden value found) | 14 |
| **Coverage %** | 70% |
| **Missing evidence %** | 30% |

**Source present for:** brand, model, bodyType, familySlug, startingPrice, topVariantPrice, exShowroomPrice, batteryCapacityKwh, claimedRangeKm, rangeTestStandard, acChargingKw, dcChargingKw, airbags, adas

**Missing from source:** sunroof (sunroof keyword); ventilatedSeats (ventilated seats); camera360 (360 camera); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| brand | "MG" | null | B — extraction failed |
| model | "Windsor EV" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "mg-windsor-ev" | null | B — extraction failed |
| exShowroomPrice | 999000 | null | B — extraction failed |
| rangeTestStandard | "ARAI" | null | B — extraction failed |
| sunroof | true | null | A — no source evidence |
| ventilatedSeats | true | null | A — no source evidence |
| camera360 | true | null | A — no source evidence |
| connectedCar | true | null | A — no source evidence |
| v2l | false | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | false | null | B — extraction failed |

### Mahindra BE 6 (`mahindra-be-6`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 20 |
| Source fields present (golden value found) | 13 |
| **Coverage %** | 65% |
| **Missing evidence %** | 35% |

**Source present for:** brand, model, bodyType, familySlug, startingPrice, topVariantPrice, exShowroomPrice, batteryCapacityKwh, claimedRangeKm, rangeTestStandard, acChargingKw, dcChargingKw, adas

**Missing from source:** airbags (airbag count); sunroof (sunroof keyword); ventilatedSeats (ventilated seats); camera360 (360 camera); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| brand | "Mahindra" | null | B — extraction failed |
| model | "BE 6" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "mahindra-be-6" | null | B — extraction failed |
| exShowroomPrice | 1890000 | null | B — extraction failed |
| rangeTestStandard | "MIDC" | null | B — extraction failed |
| airbags | 6 | null | A — no source evidence |
| sunroof | true | null | A — no source evidence |
| ventilatedSeats | true | null | A — no source evidence |
| camera360 | true | null | A — no source evidence |
| connectedCar | true | null | A — no source evidence |
| v2l | true | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | true | null | B — extraction failed |

### Mahindra XEV 9e (`mahindra-xev-9e`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 20 |
| Source fields present (golden value found) | 13 |
| **Coverage %** | 65% |
| **Missing evidence %** | 35% |

**Source present for:** brand, model, bodyType, familySlug, startingPrice, topVariantPrice, exShowroomPrice, batteryCapacityKwh, claimedRangeKm, rangeTestStandard, acChargingKw, dcChargingKw, adas

**Missing from source:** airbags (airbag count); sunroof (sunroof keyword); ventilatedSeats (ventilated seats); camera360 (360 camera); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| brand | "Mahindra" | null | B — extraction failed |
| model | "XEV 9e" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "mahindra-xev-9e" | null | B — extraction failed |
| exShowroomPrice | 2190000 | null | B — extraction failed |
| rangeTestStandard | "MIDC" | null | B — extraction failed |
| airbags | 6 | null | A — no source evidence |
| sunroof | true | null | A — no source evidence |
| ventilatedSeats | true | null | A — no source evidence |
| camera360 | true | null | A — no source evidence |
| connectedCar | true | null | A — no source evidence |
| v2l | true | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | true | null | B — extraction failed |

### BYD Atto 3 (`byd-atto-3`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 22 |
| Source fields present (golden value found) | 14 |
| **Coverage %** | 63.6% |
| **Missing evidence %** | 36.4% |

**Source present for:** brand, model, bodyType, familySlug, startingPrice, topVariantPrice, exShowroomPrice, batteryCapacityKwh, claimedRangeKm, rangeTestStandard, acChargingKw, dcChargingKw, airbags, adas

**Missing from source:** acChargingTimeHours (not in sparse benchmark HTML); dcChargingTimeMinutes (not in sparse benchmark HTML); sunroof (sunroof keyword); ventilatedSeats (ventilated seats); camera360 (360 camera); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| brand | "BYD" | null | B — extraction failed |
| model | "Atto 3" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "byd-atto-3" | null | B — extraction failed |
| startingPrice | 2499000 | null | B — extraction failed |
| topVariantPrice | 3399000 | null | B — extraction failed |
| exShowroomPrice | 2499000 | null | B — extraction failed |
| rangeTestStandard | "ARAI" | null | B — extraction failed |
| acChargingTimeHours | 9.5 | null | A — no source evidence |
| dcChargingTimeMinutes | 30 | null | A — no source evidence |
| sunroof | true | null | A — no source evidence |
| ventilatedSeats | true | null | A — no source evidence |
| camera360 | true | null | A — no source evidence |
| connectedCar | true | null | A — no source evidence |
| v2l | true | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | true | null | B — extraction failed |

### Hyundai Creta Electric (`hyundai-creta-electric`)

| Metric | Value |
|--------|-------|
| Golden fields expected | 20 |
| Source fields present (golden value found) | 13 |
| **Coverage %** | 65% |
| **Missing evidence %** | 35% |

**Source present for:** brand, model, bodyType, familySlug, startingPrice, topVariantPrice, exShowroomPrice, batteryCapacityKwh, claimedRangeKm, rangeTestStandard, acChargingKw, dcChargingKw, adas

**Missing from source:** airbags (airbag count); sunroof (sunroof keyword); ventilatedSeats (ventilated seats); camera360 (360 camera); connectedCar (not stated in benchmark HTML); v2l (not stated in benchmark HTML); v2v (not stated in benchmark HTML)

#### Failed extraction fields (OpenAI grounded run)

| Field | Expected | Actual | Category |
|-------|----------|--------|----------|
| brand | "Hyundai" | null | B — extraction failed |
| model | "Creta Electric" | null | B — extraction failed |
| bodyType | "SUV" | null | B — extraction failed |
| familySlug | "hyundai-creta-electric" | null | B — extraction failed |
| exShowroomPrice | 1799000 | null | B — extraction failed |
| claimedRangeKm | 390 | "390–473" | C — normalization failed |
| rangeTestStandard | "ARAI" | null | B — extraction failed |
| airbags | 6 | null | A — no source evidence |
| sunroof | true | null | A — no source evidence |
| ventilatedSeats | true | null | A — no source evidence |
| camera360 | true | null | A — no source evidence |
| connectedCar | true | null | A — no source evidence |
| v2l | false | null | A — no source evidence |
| v2v | false | null | A — no source evidence |
| adas | true | null | B — extraction failed |

## Category definitions

- **A — Source did not contain evidence:** Benchmark HTML lacks the golden value and lacks field-type evidence.
- **B — Source contained evidence but extraction failed:** Golden value appears in source; model returned null/missing.
- **C — Source contained evidence but normalization failed:** Model returned a value present in source but not the golden target (e.g. wrong kW tier, wrong range endpoint).
- **D — Source contained evidence but benchmark mismatch:** Source has field-type data that contradicts golden dossier (verified production values vs synthetic abbreviated HTML).

## Methodology

- Golden dossiers: `docs/catalog/golden-dataset/vehicles/*.json`
- Benchmark inputs: `BENCHMARK_SAMPLE_HTML` (synthetic sparse HTML)
- Extraction failures: latest OpenAI grounded benchmark reports in `docs/catalog/benchmark-reports/llm/`
- Source presence: deterministic text/price/range/kW matching against golden field values
