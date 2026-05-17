# OEM Media Operations (frontend)

Companion to `zyvev-backend/docs/architecture/catalog/tier-1/media-operations/`.

## Components

### `VehicleImage` (`src/components/media/VehicleImage.jsx`)

- Fixed **aspect-ratio** box (prevents CLS)
- **Shimmer** placeholder until load (`vehicleImageShimmer` in `index.css`)
- **Fallback chain** via `buildImageFallbackChain()` — car fields → family Cloudinary → variant Cloudinary → local SVG
- Optional **responsive** `picture` with AVIF/WebP + `srcset` (Cloudinary transforms)
- `onBroken` hook for future analytics

### `vehicleMedia.js`

| Export | Purpose |
|--------|---------|
| `buildImageFallbackChain(car, role)` | Ordered URLs for error recovery |
| `IMAGE_ASPECT` | Role-based aspect ratios |
| `getListingImage` / `getOgImage` | Primary URL pickers |

## Usage

```jsx
<VehicleImage
  car={car}
  role="listing"
  alt={car.name}
  imgClassName="car-image"
  responsive
/>
```

Roles: `listing` | `compare` | `hero` | `gallery` | `og`

## Wired surfaces

- `CarCard` — listing
- `CompactCarCard` — compare (responsive)
- `CarDetails` — hero + gallery thumbs

## Metadata (future)

Catalog `media.assets[]` includes `attribution`, `category`, `angle`, `tags`, `variant` (light/dark). UI can surface credits in detail footer when needed.

## QA

- Admin: `/admin/media-qa`
- CLI: `npm run media:audit` (add `--probe` for live HEAD checks)
- Backend tier-1: `node docs/architecture/catalog/tier-1/audit-media.mjs`

See backend [media-qa-checklist.md](../../../zyvev-backend/docs/architecture/catalog/tier-1/media-operations/media-qa-checklist.md).
