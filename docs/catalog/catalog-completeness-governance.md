# Catalog completeness governance

## Purpose

Track tier-1 vehicle catalog readiness without fabricating missing data.

## Status values

| Status | Meaning |
| --- | --- |
| `verified` | Field confirmed in catalog ops |
| `present` | Value exists, not yet verified |
| `not_verified` | Value exists but needs OEM/dealer confirmation |
| `missing` | No usable value |
| `unknown` | Not assessed |

## Audits

```bash
npm run catalog:audit
npm run catalog:completeness
```

Outputs: `reports/catalog-audit/*.json` and `*.md`

## Per-vehicle fields

- Media: hero, gallery, interior, charging-port (when verified)
- Specs: pricing, variants, battery, range, charging, acceleration
- Trust: safety metadata presence, compare readiness, SEO readiness

## Rules

- Do not auto-fill missing NCAP, gallery, or pricing.
- Use `catalogMeta.media.verifiedOptionalAssets` to allow optional Cloudinary roles after upload.
- Re-run audits after seed or ingestion changes.
