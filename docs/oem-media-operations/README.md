# OEM Media Operations (frontend)

Companion to `zyvev-backend/docs/architecture/catalog/tier-1/media-operations/`.

## Components

### `VehicleImage` (`src/components/media/VehicleImage.jsx`)

- Fixed **aspect-ratio** box (prevents CLS)
- **Shimmer** placeholder until load (`vehicleImageShimmer` in `index.css`)
- **Fallback chain** via `buildImageFallbackChain()` — listing → hero → slug CDN → brand → placeholder
- Optional **responsive** `srcset` (Cloudinary-aware)
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

See backend [media-qa-checklist.md](../../../zyvev-backend/docs/architecture/catalog/tier-1/media-operations/media-qa-checklist.md).
