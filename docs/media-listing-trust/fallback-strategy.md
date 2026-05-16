# Fallback strategy for missing media

## Resolution order (frontend `vehicleMedia.js`)

### Listing card

1. `listingThumbnail`
2. `heroImage` / `image`
3. `catalogMeta.media.*`
4. `cdn.evsavari.com/catalog/_fallbacks/{brand}-{bodyType}.jpg`
5. `cdn.evsavari.com/catalog/_fallbacks/ev-placeholder.jpg`

### Compare card

1. `compareThumbnail`
2. `listingThumbnail` → `heroImage`
3. Same as listing

### OG / social

1. `ogImage`
2. `heroImage`

### On `img` error

Card sets `data-fallback` and swaps to neutral `ev-placeholder.jpg` (no Unsplash).

## API mapper (backend)

If optional crops missing at import time, DTO still exposes paths from `mediaPaths()`. Frontend treats 404 via `onError`.

## Operational

| Situation | Behaviour |
|-----------|-----------|
| New variant, no CDN yet | Brand fallback + “Updated Recently” hidden |
| Wrong image reported | Set variant to `review`, replace slug folder, re-import |
| Legacy `cars` collection | Unchanged; uses dealer `heroImage` until dual-read |

## Do not

- Use random stock cars (damages trust)
- Reuse another variant’s hero for a different slug
- Show psychology chips without `catalogMeta` (legacy stays clean)
