# Media beta polish checklist

Visual stabilization targets — **no media system redesign**.

## Tier-1 families (11)

- [ ] Replace Wikimedia thumb heroes with OEM-approved assets where licensed
- [ ] Normalize aspect ratio on listing thumbnails (16:9 crop in Cloudinary)
- [ ] Gallery: exterior-1..3, interior-1, charging-port present per manifest
- [ ] OG image role uses same asset as hero (avoid broken `/og` public IDs)

## Compare visual alignment

- [ ] Hero and listing roles resolve on all compared families
- [ ] Compare cards use `listingThumbnail` — no layout shift > 0.1 CLS
- [ ] Fallback rate < 2% in buffer (`image_fallback_used`)

## Optional gallery gaps (legacy 6 families)

61 non-critical URLs may 404 — acceptable for beta if hero/listing/compare pass `media:verify`.

## QA commands

```bash
npm run media:verify
npm run media:staging-audit
```

## Sign-off

Media ops signs weekly during beta stabilization review.
