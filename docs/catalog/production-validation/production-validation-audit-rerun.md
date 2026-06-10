# Production Validation Audit — Registry Re-Run

Generated: 2026-06-09T07:29:49.700Z

Uses **source-registry.json** OEM URLs and brochure URLs. Pipeline unchanged (v3). Measurement only.

## Primary question

**Has registry correction materially improved onboarding quality?**

## Re-run aggregate (9 vehicles, 8 with golden)

| Metric | Re-run |
|--------|--------|
| Vehicles tested | 9 |
| Pipeline success | 9 |
| OEM sources acquired (ref + OEM) | 9 / 9 |
| PDFs acquired | 8 / 9 |
| Avg evidence records | 9.9 |
| Avg field coverage | 39.3% |
| Avg variant coverage | 52.3% |
| Avg price accuracy | 22.6% |
| Avg feature coverage | 0% |
| Avg publish readiness | 32.8 / 100 |
| Quality gate pass rate | 0% |
| Total manual corrections (est.) | 269 |

## Baseline comparison (5 overlapping vehicles)

| Vehicle | Evidence Δ | Coverage before→after | Readiness before→after | PDF before→after | Gates before→after |
|---------|------------|------------------------|-------------------------|------------------|---------------------|
| tata-curvv-ev | 8→7 (-1) | 34.8%→30.4% | 16→16 | ✗→✓ | FAIL→FAIL |
| tata-nexon-ev | 6→8 (+2) | 25%→33.3% | 35→56 | ✗→✓ | FAIL→FAIL |
| mahindra-be-6 | 6→15 (+9) | 30%→60% | 23→24 | ✗→✓ | FAIL→FAIL |
| mg-windsor-ev | 7→14 (+7) | 35%→60% | 39→39 | ✗→✓ | FAIL→FAIL |
| byd-atto-3 | 5→5 (+0) | 22.7%→22.7% | 34→30 | ✗→✗ | FAIL→FAIL |

## Per-vehicle results

### Tata Curvv EV (`tata-curvv-ev`)

- OEM: https://ev.tatamotors.com/curvv/ev.html
- Brochure: —
- PDF acquired: discovered (2621007 bytes)
- Evidence records: 7 (sources: 2)
- Coverage: 30.4% · Variant: 0% · Price: 0% · Feature: 0%
- Publish readiness: 16 · Manual corrections: 36
- Quality gates: FAIL (2)

### Tata Nexon EV (`tata-nexon-ev`)

- OEM: https://ev.tatamotors.com/nexon/ev.html
- Brochure: —
- PDF acquired: discovered (8953010 bytes)
- Evidence records: 8 (sources: 2)
- Coverage: 33.3% · Variant: 84.6% · Price: 92.9% · Feature: 0%
- Publish readiness: 56 · Manual corrections: 29
- Quality gates: FAIL (2)

### Tata Punch EV (`tata-punch-ev`)

- OEM: https://ev.tatamotors.com/punch/ev.html
- Brochure: —
- PDF acquired: discovered (3362705 bytes)
- Evidence records: 11 (sources: 2)
- Coverage: 33.3% · Variant: 66.7% · Price: 14.3% · Feature: 0%
- Publish readiness: 35 · Manual corrections: 39
- Quality gates: FAIL (3)

### Mahindra BE 6 (`mahindra-be-6`)

- OEM: https://www.mahindraelectricsuv.com/esuv/be-6/MBE6.html
- Brochure: https://www.mahindraelectricsuv.com/on/demandware.static/-/Library-Sites-eSUVSharedLibrary/default/MBE6/MBE6-Brochure-Specification.pdf
- PDF acquired: registry (482618 bytes)
- Evidence records: 15 (sources: 2)
- Coverage: 60% · Variant: 0% · Price: 33.3% · Feature: 0%
- Publish readiness: 24 · Manual corrections: 33
- Quality gates: FAIL (4)

### Mahindra XEV 9e (`mahindra-xev-9e`)

- OEM: https://www.mahindraelectricsuv.com/esuv/xev-9e/MXV9.html
- Brochure: https://www.mahindraelectricsuv.com/on/demandware.static/-/Library-Sites-eSUVSharedLibrary/default/MXV9/XEV-9e-Brochure-Specification.pdf
- PDF acquired: registry (1831606 bytes)
- Evidence records: 14 (sources: 2)
- Coverage: 50% · Variant: 66.7% · Price: 40% · Feature: 0%
- Publish readiness: 39 · Manual corrections: 33
- Quality gates: FAIL (4)

### MG Windsor EV (`mg-windsor-ev`)

- OEM: https://www.mgmotor.co.in/vehicles/windsor-ev-electric-car-in-india
- Brochure: —
- PDF acquired: discovered (18628215 bytes)
- Evidence records: 14 (sources: 2)
- Coverage: 60% · Variant: 100% · Price: 0% · Feature: 0%
- Publish readiness: 39 · Manual corrections: 32
- Quality gates: FAIL (3)

### MG ZS EV (`mg-zs-ev`)

- OEM: https://www.mgmotor.co.in/vehicles/mgzsev-electric-car-in-india
- Brochure: https://s7ap1.scene7.com/is/content/mgmotor/mgmotor/documents/MG%20ZSEV%20-%20Brochure.pdf
- PDF acquired: registry (11788361 bytes)
- Evidence records: 6 (sources: 2)
- No golden dossier — acquisition-only measurement

### Hyundai Creta Electric (`hyundai-creta-electric`)

- OEM: https://www.hyundai.com/in/en/find-a-car/creta-electric/highlights
- Brochure: https://www.hyundai.com/content/dam/hyundai/in/en/data/brochure/creta-ev.pdf
- PDF acquired: registry (2904368 bytes)
- Evidence records: 5 (sources: 2)
- Coverage: 25% · Variant: 33.3% · Price: 0% · Feature: 0%
- Publish readiness: 23 · Manual corrections: 32
- Quality gates: FAIL (2)

### BYD Atto 3 (`byd-atto-3`)

- OEM: https://www.bydautoindia.com/bydatto3
- Brochure: —
- PDF acquired: no (0 bytes)
- Evidence records: 5 (sources: 2)
- Coverage: 22.7% · Variant: 66.7% · Price: 0% · Feature: 0%
- Publish readiness: 30 · Manual corrections: 35
- Quality gates: FAIL (3)
