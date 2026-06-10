# Media Placeholder Audit

Generated: 2026-06-10T18:21:49.773Z

Scans `public/images/cars/**` for batch-generated placeholder WebP assets.

## Markers

- `EVSavari Media Day` (and variants such as Media Day 1/2/3)
- `Media Completion Sprint` (and variants such as Media Day 1/2/3)

## Detection

- Batch label text is burned into WebP pixels; binary scan rarely matches.
- Visual heuristic: WebP ≤15KB and dominant quantized color ≥50% (batch-generated placeholders)

## Fleet summary

- Vehicles: **25**
- Total images: **152**
- Real images: **152**
- Placeholder images: **0**
- Real-photo coverage: **100%**

## By vehicle

| Vehicle | Real | Placeholder | Total | Coverage % |
| --- | ---: | ---: | ---: | ---: |
| BMW iX1 (`bmw-ix1`) | 7 | 0 | 7 | 100 |
| BYD Atto 3 (`byd-atto-3`) | 1 | 0 | 1 | 100 |
| BYD Seal (`byd-seal`) | 7 | 0 | 7 | 100 |
| Citroen eC3 (`citroen-ec3`) | 7 | 0 | 7 | 100 |
| Hyundai Creta Electric (`hyundai-creta-electric`) | 7 | 0 | 7 | 100 |
| Hyundai Ioniq 5 (`hyundai-ioniq-5`) | 7 | 0 | 7 | 100 |
| Hyundai Kona Electric (`hyundai-kona-electric`) | 1 | 0 | 1 | 100 |
| Kia EV6 (`kia-ev6`) | 7 | 0 | 7 | 100 |
| Mahindra BE 6 (`mahindra-be-6`) | 7 | 0 | 7 | 100 |
| Mahindra XEV 9e (`mahindra-xev-9e`) | 7 | 0 | 7 | 100 |
| Mahindra XUV400 (`mahindra-xuv400`) | 1 | 0 | 1 | 100 |
| Maruti Suzuki e Vitara (`maruti-e-vitara`) | 7 | 0 | 7 | 100 |
| Mercedes-Benz EQA (`mercedes-eqa`) | 7 | 0 | 7 | 100 |
| Mercedes-Benz EQB (`mercedes-eqb`) | 7 | 0 | 7 | 100 |
| MG Comet EV (`mg-comet-ev`) | 7 | 0 | 7 | 100 |
| MG Windsor EV (`mg-windsor-ev`) | 7 | 0 | 7 | 100 |
| MG ZS EV (`mg-zs-ev`) | 7 | 0 | 7 | 100 |
| MINI Cooper SE (`mini-cooper-se`) | 7 | 0 | 7 | 100 |
| Tata Curvv EV (`tata-curvv-ev`) | 7 | 0 | 7 | 100 |
| Tata Harrier EV (`tata-harrier-ev`) | 7 | 0 | 7 | 100 |
| Tata Nexon EV (`tata-nexon-ev`) | 7 | 0 | 7 | 100 |
| Tata Punch EV (`tata-punch-ev`) | 7 | 0 | 7 | 100 |
| Tata Tiago EV (`tata-tiago-ev`) | 2 | 0 | 2 | 100 |
| Tata Tigor EV (`tata-tigor-ev`) | 7 | 0 | 7 | 100 |
| Volvo EX40 (`volvo-ex40`) | 7 | 0 | 7 | 100 |

## Re-run

```bash
npm run media:placeholder-audit
```
