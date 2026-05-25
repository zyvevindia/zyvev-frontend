# Safety intelligence governance

## Schema (`normalizeSafetyMetadata`)

Supported fields:

- `bharat_ncap` / `bharatNcap` — stars + optional `verified`
- `global_ncap` / `globalNcap`
- `airbags` — count
- `abs`, `esc`, `traction_control`
- `adas` — level + `verified`

## Status values

| Status | Use |
| --- | --- |
| `verified` | OEM or NCAP source confirmed |
| `not_verified` | Value present, source not confirmed |
| `not_tested` | Explicitly no rating |
| `unknown` | Not provided |

## Public UI

- Hero quick-spec shows acceleration unless verified NCAP exists.
- Do not display star ratings without `verified: true` or explicit catalog verification.

## Audit

Safety readiness is included in `npm run catalog:audit` via `buildSafetyCompletenessReport()`.
