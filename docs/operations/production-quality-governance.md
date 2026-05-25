# Production quality governance

## Automated checks

```bash
npm run production:qa
npm run compare:quality-audit
npm run post-launch:smoke
```

## Production QA scope

- Sticky nav tab ↔ section ID alignment
- Compare deep-link slug shape
- Hero / gallery resolution vs fallback overuse
- Media role conflicts (manifest)

## Logging policy

| Signal | Production |
| --- | --- |
| Media fallback | Silent (metrics only) |
| Telemetry 5xx | Silent + backoff |
| Catalog API failure | Warn (deduped) |
| Compare runtime error | Error |

Dev-only: `src/launch/devCatalogDiagnostics.js`

## Release gate

`post-launch:smoke` must pass before controlled public cadence increases.
