# Media & Listing Trust Sprint

Fix marketplace trust on listing cards before wider catalog rollout.

## Deliverables

| Doc | Purpose |
|-----|---------|
| [tier-1-media-audit.md](./tier-1-media-audit.md) | Tier-1 mapping audit findings |
| [media-quality-checklist.md](./media-quality-checklist.md) | QA before publish |
| [image-sizing-standards.md](./image-sizing-standards.md) | Crop dimensions & formats |
| [fallback-strategy.md](./fallback-strategy.md) | Missing/broken image handling |
| [trust-layer-rollout.md](./trust-layer-rollout.md) | Staged enablement |

## Code touchpoints

**Backend (`zyvev-backend`)**

- `docs/architecture/catalog/tier-1/data/_helpers.js` — `mediaPaths()`, `brandFallbackImage()`
- `docs/architecture/catalog/tier-1/audit-media.mjs` — CI-friendly audit
- `services/catalog/mappers.js` — listing/compare/og fields on API DTO

**Frontend**

- `src/utils/formatIndianPrice.js` — Lakh/Crore display
- `src/utils/vehicleMedia.js` — image resolution chain
- `src/utils/listingSignals.js` — psychology → card chips
- `src/components/catalog/CatalogListingSignals.jsx`
- `src/components/catalog/CatalogCardTrust.jsx`
- `src/components/CarCard.jsx`, `CompactCarCard.jsx`, `normalizeCar.js`

## Related

- **OEM Media Operations Sprint:** [../oem-media-operations/README.md](../oem-media-operations/README.md)
- **Backend pipeline:** `zyvev-backend/docs/architecture/catalog/tier-1/media-operations/`

## Commands

```bash
# Backend tier-1
cd docs/architecture/catalog/tier-1
node build-catalog.mjs
node audit-media.mjs

# Frontend
npm run build
```
