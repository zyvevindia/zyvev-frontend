# Media Production Audit — Phase 2

Generated: 2026-06-10T16:42:20.772Z

## Goal

Zero broken media on vehicle detail pages

## Summary

- Detail surfaces audited: **9**
- Surfaces using VehicleImage: **3**
- Golden vehicles verified: **25**
- Manual vehicles verified: **10**
- Broken gallery images found: **0**
- Broken gallery images fixed: **25**
- All golden vehicles pass: **Yes**
- All manual vehicles pass: **Yes**

## Files modified

- `src/utils/vehicleMedia.js`
- `src/components/media/VehicleImage.jsx`
- `src/components/car/DetailHero.jsx`
- `src/pages/CarDetails.jsx`
- `src/media/localCarMediaManifest.js`
- `scripts/lib/mediaProductionPhase2.mjs`
- `scripts/media-production-phase2.mjs`
- `package.json`

## Detail surfaces audited

| Surface | Page | Component | VehicleImage | Role |
| --- | --- | --- | --- | --- |
| detail-hero | CarDetails.jsx | VehicleImage | Yes | hero |
| detail-gallery-thumbs | CarDetails.jsx / DetailHero.jsx | VehicleImage | Yes | gallery |
| detail-jsonld | CarDetails.jsx | JsonLd | No | gallery |
| detail-variant-preload | CarDetails.jsx | preloadVariantGallery | No | gallery |
| detail-overview | DetailOverviewDashboard.jsx | DetailOverviewDashboard | No | — |
| detail-gold-sections | EvDetailGoldSections.jsx | EvDetailGoldSections | No | — |
| detail-variant-table | VariantComparisonTable.jsx | VariantComparisonTable | No | — |
| detail-related-notfound | VehicleDetailNotFound.jsx | CompactCarCard | Yes | listing |
| detail-modal-viewer | — | — | No | — |

## Manual verification (11 vehicles)

| Slug | Hero | Gallery items | Pass |
| --- | --- | --- | --- |
| tata-harrier-ev | `/images/cars/tata-harrier-ev/front.webp` | 5 | Yes |
| hyundai-creta-electric | `/images/cars/hyundai-creta-electric/front.webp` | 5 | Yes |
| maruti-e-vitara | `/images/cars/maruti-e-vitara/front.webp` | 5 | Yes |
| tata-curvv-ev | `/images/cars/tata-curvv-ev/front.webp` | 5 | Yes |
| tata-nexon-ev | `/images/cars/tata-nexon-ev/front.webp` | 5 | Yes |
| tata-punch-ev | `/images/cars/tata-punch-ev/front.webp` | 5 | Yes |
| mahindra-be-6 | `/images/cars/mahindra-be-6/front.webp` | 5 | Yes |
| mg-windsor-ev | `/images/cars/mg-windsor-ev/front.webp` | 5 | Yes |
| byd-seal | `/images/cars/byd-seal/front.webp` | 5 | Yes |
| bmw-ix1 | `/images/cars/bmw-ix1/front.webp` | 5 | Yes |

## Golden fleet — hero + gallery types

| Slug | Hero source | Gallery slots | Hero OK |
| --- | --- | --- | --- |
| tata-nexon-ev | local | 5 | Yes |
| tata-punch-ev | local | 5 | Yes |
| tata-curvv-ev | local | 5 | Yes |
| mg-windsor-ev | local | 5 | Yes |
| mahindra-be-6 | local | 5 | Yes |
| mahindra-xev-9e | cloudinary | 5 | Yes |
| byd-atto-3 | cloudinary | 5 | Yes |
| hyundai-creta-electric | local | 5 | Yes |
| mg-comet-ev | cloudinary | 5 | Yes |
| hyundai-ioniq-5 | local | 5 | Yes |
| kia-ev6 | local | 5 | Yes |
| mahindra-xuv400 | cloudinary | 5 | Yes |
| byd-seal | local | 5 | Yes |
| bmw-ix1 | local | 5 | Yes |
| mercedes-eqa | local | 5 | Yes |
| mercedes-eqb | local | 5 | Yes |
| volvo-ex40 | local | 5 | Yes |
| mini-cooper-se | local | 5 | Yes |
| citroen-ec3 | local | 5 | Yes |
| mg-zs-ev | local | 5 | Yes |
| maruti-e-vitara | local | 5 | Yes |
| hyundai-kona-electric | cloudinary | 5 | Yes |
| tata-tigor-ev | local | 5 | Yes |
| tata-tiago-ev | cloudinary | 5 | Yes |
| tata-harrier-ev | local | 5 | Yes |

## Detail media rules

- **hero:** buildImageFallbackChain(car, hero) — never empty primary
- **galleryThumbs:** resolveDetailGalleryItems — typed front/rear/side/interior/dashboard
- **galleryFallback:** buildGalleryTypeFallbackChain per type: Local → Cloudinary → fallback-ev.svg
- **emptySlots:** galleryItems.filter(Boolean) — no falsy entries
- **placeholder:** VehicleImage exhausted state only after all chain URLs fail
- **devLogging:** console.warn("[gallery-media]", slug, imageType, chain) in DEV

## Build

- **Result:** Pass (`npm run build`, exit 0)
