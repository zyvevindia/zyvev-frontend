# Media operations governance

**Policy:** [media-policy.md](./media-policy.md) (effective 2026-05-20)

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
npm run media:attribution-audit   # licensed-source traceability (required before upload)
npm run media:upload-tier1        # ingest seed → Cloudinary (skips legacy Nexon/Punch)
npm run media:verify                # probe Cloudinary (optional)
npm run media:completeness
npm run media:audit
```

## Verification

After uploading optional assets, register basenames in:

- `src/media/catalogMediaAvailability.js` → `VERIFIED_OPTIONAL_ASSETS_BY_FAMILY`, or
- `catalogMeta.media.verifiedOptionalAssets` per vehicle

## Rules

- **Legacy frozen:** `tata-nexon-ev`, `tata-punch-ev` — keep Cloudinary assets unchanged; do not re-ingest during productionization.
- **Licensed standard:** Wikimedia Commons or other explicitly licensed sources only; full attribution in `tier1-media-attribution.json`.
- **Never hotlink** OEM sites, Google Images, or automotive portals (see media policy).
- No speculative URL probes in production UI.
- Fallback chain remains: API → core manifest → brand sibling → local SVG.
- Duplicate role URLs are flagged via `detectMediaRoleConflicts()`.
