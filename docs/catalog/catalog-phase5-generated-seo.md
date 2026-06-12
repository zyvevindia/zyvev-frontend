# Catalog Phase 5 — Generated SEO Artifacts

Generated: 2026-06-11T08:59:07.166Z

## Summary

| Metric | Value |
|--------|-------|
| Generated file count | 28 |
| Vehicles audited | 25 |
| Generator mismatch count | 0 |
| Stale SEO files discovered | 64 |
| Editorial SEO files scanned | 175 |

## Fields compared

- `familySlug`
- `displayName`
- `brand`
- `priceBand`
- `maxRangeKm`
- `variantCount`

## Dependency diagram

```
Golden JSON (public/catalog/golden-dataset/vehicles/*.json)
        │
        ├─► scripts/generate-content.mjs ──► public/seo-data/*.json (editorial SEO pages)
        │                                 └─► src/content/generated/manifest.js
        │
        └─► scripts/generate-seo-artifacts.mjs (Phase 5 — parallel)
                  │
                  ├─► public/seo-data/generated/vehicles/{slug}.json
                  ├─► public/seo-data/generated/manifest.json
                  └─► src/content/generated/generated/
                        ├─ catalog-vehicles.json
                        └─ index.js

Runtime consumers (unchanged in Phase 5):
  DiscoverySeoPage ──► useDiscoveryPage ──► discoveryLoader ──► fetchSeoPage
  SeoGuidePage ──► useSeoPage ──► fetchSeoPage ──► /seo-data/{slug}.json
  Compare guides ──► DiscoverySeoPage + GENERATED_COMPARE_SLUGS (manifest.js)
  SeoGuidesHub ──► CONTENT_REGISTRY_ENTRIES (manifest.js)
  SeoRelatedLinks ──► seoPage.relatedLinks (inline in SEO JSON)
  ComparePage ──► GENERATED_COMPARE_SLUGS (manifest.js)
```

## Generator fidelity

All generated artifacts match golden transforms.

## Stale editorial SEO references

64 file(s) contain catalog facts that differ from golden (documented, not generator failures).

- `public/seo-data/authority-ev-charging-types.json`
- `public/seo-data/authority-how-evs-work.json`
- `public/seo-data/authority-myth-apartment-charging-impossible.json`
- `public/seo-data/authority-myth-fire-risk.json`
- `public/seo-data/authority-myth-rain-flood-safety.json`
- `public/seo-data/authority-overnight-safety.json`
- `public/seo-data/best-evs-budget-agent.json`
- `public/seo-data/best-evs-for-budget-lease.json`
- `public/seo-data/best-evs-for-city-agent.json`
- `public/seo-data/best-evs-for-college-students.json`
- `public/seo-data/best-evs-for-compact-parking.json`
- `public/seo-data/best-evs-for-corporate-fleet.json`
- `public/seo-data/best-evs-for-family-agent.json`
- `public/seo-data/best-evs-for-highway-agent.json`
- `public/seo-data/best-evs-for-long-range-highway.json`
- `public/seo-data/best-evs-for-luxury-buyers.json`
- `public/seo-data/best-evs-for-performance.json`
- `public/seo-data/best-evs-for-semi-urban.json`
- `public/seo-data/best-evs-for-senior-drivers.json`
- `public/seo-data/best-evs-for-taxi-commercial.json`
- `public/seo-data/best-evs-for-weekend-trips.json`
- `public/seo-data/best-evs-for-women-safety.json`
- `public/seo-data/best-evs-premium-agent.json`
- `public/seo-data/best-value-ev-variants-agent.json`
- `public/seo-data/bmw-ix1-vs-mercedes-eqb.json`
- `public/seo-data/brands/mercedes-benz.json`
- `public/seo-data/byd-atto-3-vs-hyundai-creta-electric-agent.json`
- `public/seo-data/cities/bengaluru-evs.json`
- `public/seo-data/cities/chandigarh-charging.json`
- `public/seo-data/cities/chennai-charging.json`
- `public/seo-data/cities/coimbatore-charging.json`
- `public/seo-data/cities/gurgaon-charging.json`
- `public/seo-data/cities/guwahati-evs.json`
- `public/seo-data/cities/hyderabad-charging.json`
- `public/seo-data/cities/indore-charging.json`
- `public/seo-data/cities/jaipur-charging.json`
- `public/seo-data/cities/jaipur-evs.json`
- `public/seo-data/cities/kolkata-evs.json`
- `public/seo-data/cities/ludhiana-evs.json`
- `public/seo-data/cities/patna-charging.json`
- `public/seo-data/cities/pune-evs.json`
- `public/seo-data/cities/surat-charging.json`
- `public/seo-data/cities/thiruvananthapuram-charging.json`
- `public/seo-data/cities/vadodara-evs.json`
- `public/seo-data/cities/visakhapatnam-evs.json`
- `public/seo-data/fastest-charging-ev-variants-agent.json`
- `public/seo-data/fastest-charging-evs-agent.json`
- `public/seo-data/longest-range-ev-variants-agent.json`
- `public/seo-data/longest-range-evs-agent.json`
- `public/seo-data/mercedes-eqa-vs-bmw-ix1.json`
- `public/seo-data/mercedes-eqb-vs-volvo-ex40.json`
- `public/seo-data/ownership-battery-health.json`
- `public/seo-data/ownership-fleet-commercial.json`
- `public/seo-data/ownership-insurance-tco.json`
- `public/seo-data/ownership-running-cost.json`
- `public/seo-data/ownership-service-network.json`
- `public/seo-data/ownership-warranty-coverage.json`
- `public/seo-data/safest-evs-agent.json`
- `public/seo-data/tata-curvv-ev-vs-mahindra-be-6-agent.json`
- `public/seo-data/tata-nexon-ev-best-value-variant-agent.json`
- `public/seo-data/tata-nexon-ev-fastest-charging-variant-agent.json`
- `public/seo-data/tata-punch-ev-best-value-variant-agent.json`
- `public/seo-data/tata-punch-ev-longest-range-variant-agent.json`
- `public/seo-data/top-10-evs-agent.json`

## Generated artifact paths

- `public/seo-data/generated/manifest.json`
- `public/seo-data/generated/vehicles/bmw-ix1.json`
- `public/seo-data/generated/vehicles/byd-atto-3.json`
- `public/seo-data/generated/vehicles/byd-seal.json`
- `public/seo-data/generated/vehicles/citroen-ec3.json`
- `public/seo-data/generated/vehicles/hyundai-creta-electric.json`
- `public/seo-data/generated/vehicles/hyundai-ioniq-5.json`
- `public/seo-data/generated/vehicles/hyundai-kona-electric.json`
- `public/seo-data/generated/vehicles/kia-ev6.json`
- `public/seo-data/generated/vehicles/mahindra-be-6.json`
- `public/seo-data/generated/vehicles/mahindra-xev-9e.json`
- `public/seo-data/generated/vehicles/mahindra-xuv400.json`
- `public/seo-data/generated/vehicles/maruti-e-vitara.json`
- `public/seo-data/generated/vehicles/mercedes-eqa.json`
- `public/seo-data/generated/vehicles/mercedes-eqb.json`
- `public/seo-data/generated/vehicles/mg-comet-ev.json`
- `public/seo-data/generated/vehicles/mg-windsor-ev.json`
- `public/seo-data/generated/vehicles/mg-zs-ev.json`
- `public/seo-data/generated/vehicles/mini-cooper-se.json`
- `public/seo-data/generated/vehicles/tata-curvv-ev.json`
- `public/seo-data/generated/vehicles/tata-harrier-ev.json`
- `public/seo-data/generated/vehicles/tata-nexon-ev.json`
- `public/seo-data/generated/vehicles/tata-punch-ev.json`
- `public/seo-data/generated/vehicles/tata-tiago-ev.json`
- `public/seo-data/generated/vehicles/tata-tigor-ev.json`
- `public/seo-data/generated/vehicles/volvo-ex40.json`
- `src/content/generated/generated/catalog-vehicles.json`
- `src/content/generated/generated/index.js`

## Commands

```bash
npm run catalog:generate-seo
npm run catalog:phase5-audit
```
