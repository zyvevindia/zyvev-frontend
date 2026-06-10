# Media Production Audit — Phase 3

Generated: 2026-06-10T16:47:07.651Z

## Goal

Zero broken media on compare, SEO, and related buyer surfaces

## Summary

- Surfaces audited: **15**
- Surfaces using VehicleImage: **9**
- Manual vehicles verified: **10**
- Golden fleet checked: **25**
- Broken images found: **0**
- Broken images fixed: **10**
- All manual vehicles pass: **Yes**

## Files modified

- `src/utils/vehicleMedia.js`
- `src/components/media/VehicleImage.jsx`
- `src/components/compare/CompareVehicleCard.jsx`
- `src/components/SEO/SeoRecommendationList.jsx`
- `scripts/lib/mediaProductionPhase3.mjs`
- `scripts/media-production-phase3.mjs`
- `package.json`

## Surfaces audited

| Surface | Page | Component | VehicleImage | Role |
| --- | --- | --- | --- | --- |
| compare-page | ComparePage.jsx | CompareVehicleCard | Yes | compare |
| compare-hero | CompareHeroExperience.jsx | CompareVehicleCard | Yes | compare |
| compare-seo-guide | DiscoverySeoPage.jsx | CompareVehicleCard | Yes | compare |
| compare-trust-summary | CompareBelowFoldSections.jsx | CompareTrustSummary | No | — |
| compare-recommendation-doubt | CompareRecommendationDoubt.jsx | CompareRecommendationDoubt | No | — |
| compare-guide-editorial | CompareGuideEditorialSections.jsx | CompareGuideEditorialSections | No | — |
| seo-recommendation-list | SeoRecommendationList.jsx | VehicleImage | Yes | listing |
| seo-discovery-page | DiscoverySeoPage.jsx | SeoRecommendationList | Yes | — |
| seo-guide-page | SeoGuidePage.jsx | SeoRecommendationList | Yes | — |
| seo-related-links | SeoRelatedLinks.jsx | SeoRelatedLinks | No | — |
| seo-guides-hub | SeoGuidesHub.jsx | SeoGuidesHub | No | — |
| related-detail-seo | DetailSeoDiscovery.jsx | DetailSeoDiscovery | No | — |
| related-notfound | VehicleDetailNotFound.jsx | CompactCarCard | Yes | listing |
| home-listing-cards | Home.jsx | CompactCarCard | Yes | listing |
| browse-listing-cards | ListingPage.jsx | CarCard | Yes | listing |

## Manual verification

| Slug | Listing | Compare | Listing src | Compare src | Pass |
| --- | --- | --- | --- | --- | --- |
| tata-harrier-ev | `/images/cars/tata-harrier-ev/listing.webp` | `/images/cars/tata-harrier-ev/compare.webp` | local | local | Yes |
| hyundai-creta-electric | `/images/cars/hyundai-creta-electric/listing.webp` | `/images/cars/hyundai-creta-electric/compare.webp` | local | local | Yes |
| maruti-e-vitara | `/images/cars/maruti-e-vitara/listing.webp` | `/images/cars/maruti-e-vitara/compare.webp` | local | local | Yes |
| tata-curvv-ev | `/images/cars/tata-curvv-ev/listing.webp` | `/images/cars/tata-curvv-ev/compare.webp` | local | local | Yes |
| tata-nexon-ev | `/images/cars/tata-nexon-ev/listing.webp` | `/images/cars/tata-nexon-ev/compare.webp` | local | local | Yes |
| mahindra-be-6 | `/images/cars/mahindra-be-6/listing.webp` | `/images/cars/mahindra-be-6/compare.webp` | local | local | Yes |
| mg-windsor-ev | `/images/cars/mg-windsor-ev/listing.webp` | `/images/cars/mg-windsor-ev/compare.webp` | local | local | Yes |
| byd-seal | `/images/cars/byd-seal/listing.webp` | `/images/cars/byd-seal/compare.webp` | local | local | Yes |
| bmw-ix1 | `/images/cars/bmw-ix1/listing.webp` | `/images/cars/bmw-ix1/compare.webp` | local | local | Yes |
| mercedes-eqa | `/images/cars/mercedes-eqa/listing.webp` | `/images/cars/mercedes-eqa/compare.webp` | local | local | Yes |

## Media rules

- **compareCards:** compare.webp → listing.webp → Cloudinary → fallback-ev.svg
- **seoCards:** listing.webp → Cloudinary → fallback-ev.svg
- **placeholder:** Only after all chain URLs fail (VehicleImage exhausted)
- **compareLogging:** console.warn("[compare-media]", slug, chain)
- **seoLogging:** console.warn("[seo-media]", slug, chain)

## Build

- **Result:** Pass (`npm run build`, exit 0)
