# Media Production Audit — Phase 1

Generated: 2026-06-10T16:36:18.478Z

## Goal

Zero broken buyer-facing card images

## Summary

- Card surfaces audited: **8**
- Surfaces using VehicleImage: **6**
- Vehicles verified: **10**
- Broken images found: **0**
- Broken images fixed: **10**
- All verified vehicles pass: **Yes**

## Files modified

- `src/components/media/VehicleImage.jsx`
- `scripts/lib/mediaProductionPhase1.mjs`
- `scripts/media-production-phase1.mjs`
- `package.json`

## Card surfaces audited

| Surface | Page | Component | VehicleImage | Role |
| --- | --- | --- | --- | --- |
| home-popular | Home.jsx | CompactCarCard | Yes | listing |
| listing-browse | ListingPage.jsx | CarCard | Yes | listing |
| discovery-presets | IntelligenceDiscoveryPage.jsx | CarCard | Yes | listing |
| compare-hero | CompareHeroExperience.jsx | CompareVehicleCard | Yes | compare |
| detail-not-found | VehicleDetailNotFound.jsx | CompactCarCard | Yes | listing |
| recommendation-widget | EvRecommendationWidget.jsx | EvRecommendationWidget | No | — |
| seo-compare-guide | DiscoverySeoPage.jsx / SeoGuidePage.jsx | CompareVehicleCard | Yes | compare |
| upcoming-fallback | ListingPage.jsx / Home.jsx | UpcomingCarCard | No | — |

## Vehicles verified

| Slug | Listing URL | First source | Local file | Chain OK |
| --- | --- | --- | --- | --- |
| tata-harrier-ev | `/images/cars/tata-harrier-ev/listing.webp` | local | Yes | Yes |
| tata-tigor-ev | `/images/cars/tata-tigor-ev/listing.webp` | local | Yes | Yes |
| maruti-e-vitara | `/images/cars/maruti-e-vitara/listing.webp` | local | Yes | Yes |
| hyundai-creta-electric | `/images/cars/hyundai-creta-electric/listing.webp` | local | Yes | Yes |
| byd-seal | `/images/cars/byd-seal/listing.webp` | local | Yes | Yes |
| hyundai-ioniq-5 | `/images/cars/hyundai-ioniq-5/listing.webp` | local | Yes | Yes |
| mini-cooper-se | `/images/cars/mini-cooper-se/listing.webp` | local | Yes | Yes |
| bmw-ix1 | `/images/cars/bmw-ix1/listing.webp` | local | Yes | Yes |
| mercedes-eqa | `/images/cars/mercedes-eqa/listing.webp` | local | Yes | Yes |
| mercedes-eqb | `/images/cars/mercedes-eqb/listing.webp` | local | Yes | Yes |

## VehicleImage rules

- **Picture element:** Only when buildResponsiveSources().default is set
- **Placeholder:** Only after all chain URLs fail (exhausted state)
- **Dev logging:** console.warn("[media]", slug, chain) in DEV
- **Fallback chain:** Local → Cloudinary → fallback-ev.svg

## Build

- **Result:** Pass (`npm run build`, exit 0)
