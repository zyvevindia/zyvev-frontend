# EVSavari media policy

**Effective:** 2026-05-20  
**Status:** Active — all catalog media work must follow this policy.

## Vehicle tiers

### Legacy (frozen)

These families **keep existing Cloudinary assets unchanged**. Do not replace or re-ingest images during current productionization work.

| Family slug |
|-------------|
| `tata-nexon-ev` |
| `tata-punch-ev` |

Enforced in code: `LEGACY_FROZEN_MEDIA_FAMILIES` in `src/media/mediaPolicy.js`.  
Upload scripts skip legacy families unless `--force-legacy` is explicitly passed (ops-only escape hatch).

### Licensed standard (all other vehicles)

Applies to:

- `tata-tiago-ev`
- `tata-curvv-ev`
- `mg-zs-ev`
- `byd-atto-3`
- `hyundai-kona-electric`
- Every **future** EV family added to the catalog

All non-legacy production families follow the same licensed-source workflow even if not listed above (e.g. `mg-comet-ev`, Mahindra families).

## Image workflow

1. **Source** — Use [Wikimedia Commons](https://commons.wikimedia.org/) or another **explicitly licensed** source with clear reuse terms.
2. **Capture metadata** — Record in `docs/operations/tier1-media-attribution.json`:
   - source page URL (not a hotlink target for production UI)
   - creator
   - license
   - attribution text (buyer-facing credit when displayed)
3. **Register seed URL** — Add the approved ingest URL to `docs/operations/tier1-cloudinary-seed.json` for the family role.
4. **Upload** — Run `npm run media:upload-tier1` (attribution is validated; metadata is written to Cloudinary context).
5. **Deliver** — Production UI uses **Cloudinary URLs only** (`res.cloudinary.com/dznvmumze/...`). Never hotlink source sites.
6. **Audit** — Run `npm run media:attribution-audit` before release; every seed URL must trace to a complete attribution record.

## Prohibited sources

| Prohibited | Reason |
|------------|--------|
| OEM websites (BYD, Hyundai, Tata, etc.) | No hotlinking; licensing unclear at ingest time |
| Google Images / `googleusercontent.com` | No stable license chain |
| Automotive portals (CarWale, CarDekho, ZigWheels, Autocar, etc.) | Third-party editorial — not licensed for reuse |

Blocked at ingest validation (`isProhibitedMediaSourceUrl` in `src/media/mediaPolicy.js`).

## Allowed ingest hosts (default)

- `upload.wikimedia.org`
- `commons.wikimedia.org`

Other hosts require explicit ops approval and a full attribution record with license documentation.

## File map

| File | Purpose |
|------|---------|
| `src/media/mediaPolicy.js` | Policy constants, legacy vs licensed helpers, prohibited URL checks |
| `docs/operations/tier1-cloudinary-seed.json` | Approved ingest URLs per family role |
| `docs/operations/tier1-media-attribution.json` | Creator, license, attribution text per source file |
| `scripts/lib/mediaAttribution.mjs` | Shared load/validate/trace helpers |
| `scripts/upload-tier1-cloudinary.mjs` | Ingest pipeline (download → Cloudinary) |
| `scripts/media-attribution-audit.mjs` | Release gate: traceability audit |

## Attribution in catalog JSON

Backend variant `media.assets[].attribution` should use:

```json
{
  "sourceType": "wikimedia_commons",
  "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:…",
  "creator": "…",
  "license": "CC BY-SA 4.0",
  "attributionText": "…",
  "usage": "editorial_marketplace"
}
```

Do **not** use `sourceType: "oem_press"` unless the image was obtained under a verified OEM media agreement (separate from this Wikimedia workflow).

## QA commands

```bash
npm run media:attribution-audit   # trace seed → attribution (required for licensed families)
npm run media:upload-tier1 -- --dry-run
npm run media:audit -- --probe
npm run media:completeness
```

## Related docs

- [Media operations governance](../catalog/media-operations-governance.md)
- [Catalog media governance (runtime)](../architecture/catalog/media-governance.md)
