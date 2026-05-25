# Media operations governance

## Cloudinary layout

```
evsavari/catalog/families/<family-slug>/<role>
```

Core roles (requested at runtime):

- `hero`
- `listing-thumb`
- `compare-thumb`

Optional roles (blocked until verified):

- `exterior-1`, `exterior-2`, `exterior-3`
- `interior-1`
- `charging-port`
- `og`

## Commands

```bash
npm run media:verify      # probe Cloudinary (optional)
npm run media:completeness
npm run media:audit
```

## Verification

After uploading optional assets, register basenames in:

- `src/media/catalogMediaAvailability.js` → `VERIFIED_OPTIONAL_ASSETS_BY_FAMILY`, or
- `catalogMeta.media.verifiedOptionalAssets` per vehicle

## Rules

- No speculative URL probes in production UI.
- Fallback chain remains: API → core manifest → brand sibling → local SVG.
- Duplicate role URLs are flagged via `detectMediaRoleConflicts()`.
