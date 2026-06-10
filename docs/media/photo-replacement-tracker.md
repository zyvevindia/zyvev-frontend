# EVSavari Photo Replacement Tracker

Generated: 2026-06-10T18:21:43.603Z

Track production photography replacing placeholder WebP assets under `public/images/cars/{slug}/`.

## Summary

- Vehicles: **25**
- Image types per vehicle: **7**
- Total slots: **175**
- Placeholder: **23**
- In progress: **0**
- Replaced: **152**
- Approved: **0**

## Image types

- `listing.webp` — card / browse
- `compare.webp` — compare column
- `front.webp` — detail gallery / hero
- `rear.webp` — detail gallery / hero
- `side.webp` — detail gallery / hero
- `interior.webp` — detail gallery / hero
- `dashboard.webp` — detail gallery / hero

## Status legend

- **placeholder:** Generated or seed asset — awaiting real photo replacement
- **in_progress:** Shoot/edit in progress
- **replaced:** Production photo uploaded to public/images/cars/
- **approved:** Ops-approved for buyer-facing use

## Fleet tracker

| Vehicle | listing | compare | front | rear | side | interior | dashboard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hyundai Kona Electric (`hyundai-kona-electric`) | placeholder | placeholder | placeholder | placeholder | placeholder | placeholder | replaced |
| Mahindra XEV 9e (`mahindra-xev-9e`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Mahindra XUV400 (`mahindra-xuv400`) | placeholder | placeholder | placeholder | placeholder | placeholder | placeholder | replaced |
| Mahindra BE 6 (`mahindra-be-6`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Tata Nexon EV (`tata-nexon-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Tata Curvv EV (`tata-curvv-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Tata Punch EV (`tata-punch-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Tata Tiago EV (`tata-tiago-ev`) | placeholder | placeholder | placeholder | placeholder | placeholder | replaced | replaced |
| Tata Tigor EV (`tata-tigor-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Tata Harrier EV (`tata-harrier-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| MG Comet EV (`mg-comet-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| MG ZS EV (`mg-zs-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| MG Windsor EV (`mg-windsor-ev`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Hyundai Creta Electric (`hyundai-creta-electric`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Hyundai Ioniq 5 (`hyundai-ioniq-5`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Maruti Suzuki e Vitara (`maruti-e-vitara`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Kia EV6 (`kia-ev6`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| BYD Atto 3 (`byd-atto-3`) | placeholder | placeholder | placeholder | placeholder | placeholder | placeholder | replaced |
| BYD Seal (`byd-seal`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| BMW iX1 (`bmw-ix1`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Mercedes-Benz EQA (`mercedes-eqa`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Mercedes-Benz EQB (`mercedes-eqb`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Volvo EX40 (`volvo-ex40`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| MINI Cooper SE (`mini-cooper-se`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |
| Citroen eC3 (`citroen-ec3`) | replaced | replaced | replaced | replaced | replaced | replaced | replaced |

## Paths

All assets live at `public/images/cars/{familySlug}/{type}.webp` and serve as `/images/cars/{familySlug}/{type}.webp`.

Update statuses in `docs/media/photo-replacement-tracker.json`, then re-run `npm run media:photo-tracker` to refresh this table.
