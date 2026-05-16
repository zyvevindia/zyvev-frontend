# Image sizing standards

| Asset | Aspect | Recommended size | Use |
|-------|--------|------------------|-----|
| `hero.jpg` | 16:9 or 3:2 | 1920×1080 | Detail page hero, schema |
| `listing-thumb.jpg` | 16:10 | 1280×800 | Home, `/cars` cards |
| `compare-thumb.jpg` | 1:1 safe in 16:10 | 800×800 center in 1280×800 | Compare cards |
| `og.jpg` | 1.91:1 | 1200×630 | Open Graph / Twitter |
| `exterior-*.jpg` | 16:9 | 1600×900 | Gallery |
| `interior-1.jpg` | 16:9 | 1600×900 | Gallery |
| `charging-port.jpg` | 4:3 or 16:9 | 1200×900 | Gallery / trust |

## Safe zones

- **Listing:** Keep vehicle between 8% and 92% horizontal; 15% top for badge overlay; 22% bottom for signal chips.
- **OG:** No critical detail in outer 10% (platform crops).

## Formats

- Primary: JPEG q=82 or WebP q=85
- Future: Cloudinary transforms on `res.cloudinary.com` via `imageUtils.optimizeImage`

## Brand fallbacks

`cdn.evsavari.com/catalog/_fallbacks/{brand}-{bodyType}.jpg`  
Body types: `hatchback`, `sedan`, `suv`, `micro-suv`
