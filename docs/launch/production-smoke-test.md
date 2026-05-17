# Production smoke test (15 min)

Automated helpers:

```bash
npm run seo:qa
npm run media:audit
npm run media:audit -- --probe   # live Cloudinary HEAD checks
```

## Manual browser pass

| Step | URL | Pass |
|------|-----|------|
| Home loads catalog | `/` | |
| Listing + filters | `/cars` | |
| Family detail | `/cars/tata-nexon-ev` | |
| Variant switch | `?variant=` on detail | |
| Compare empty | `/compare` | |
| Compare 2 EVs | listing compare mode | |
| SEO guide | one `/guides/...` or city page | |
| Lead modal submit | any detail CTA | |
| Report issue | footer link | |
| 404 family | `/cars/invalid-slug-xyz` | |

## Mobile (375px)

- [ ] No horizontal scroll on listing cards
- [ ] Images use fixed aspect (no layout jump after load)
- [ ] Compare table scroll hint visible
- [ ] Lead modal fields readable; errors visible in red

## Slow network (DevTools → Slow 3G)

- [ ] Home shows skeleton then content or retry
- [ ] Detail shows skeleton; API failure shows retry (not fake 404)
- [ ] Images show shimmer then fade in

## Media / CLS

- [ ] `VehicleImage` reserves aspect ratio before load
- [ ] Production families use Cloudinary URLs (not `cdn.evsavari.com`)
- [ ] Broken URL falls back without breaking layout
