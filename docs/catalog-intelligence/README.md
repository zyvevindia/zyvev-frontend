# Catalog Intelligence (frontend)

Decision-making UX layered on existing gold sections — no marketplace redesign.

## Enable (staging)

```env
VITE_CATALOG_INTELLIGENCE=true
VITE_CATALOG_DETAIL_ENRICH=true   # optional: fetch full catalog DTO
```

Backend (staging):

```env
CATALOG_INTELLIGENCE_ENABLED=true
USE_EV_MASTER=true
```

## Modules

| File | Role |
|------|------|
| `utils/personaFitEngine.js` | Buyer persona fit labels |
| `utils/catalogIntelligence.js` | Feature flag + merge helpers |
| `components/catalog/CatalogDecisionBlocks.jsx` | Who should buy/avoid, paths, personas |
| `components/catalog/EvDetailGoldSections.jsx` | Renders blocks when flag on |
| `components/catalog/CompareInsightCard.jsx` | Compare picks (value, ownership) |

## Personas

- Best for city commuters  
- Best family EV  
- Best highway EV  
- Best first EV  
- Best premium EV  
- Best value EV  

Scores from `catalogMeta.personaFit` or legacy psychology/suitability fallback.

## Ownership reality

Real-world range bands, charging lifestyle, buyer assurance, tradeoffs, scenario compare. See backend `ownership-reality.md`.

## Governance (facts vs interpretations)

When enabled, `catalogMeta.intelligenceGovernance` carries per-field provenance. Editorial copy uses template generators only (no AI freeform). Run backend audit:

```bash
node scripts/audit-catalog-intelligence.js --verbose
```

See `zyvev-backend/docs/architecture/catalog-intelligence/governance.md`.

## Rollback

Unset `VITE_CATALOG_INTELLIGENCE` — UI reverts to gold sections without decision blocks. Legacy listings unchanged.
