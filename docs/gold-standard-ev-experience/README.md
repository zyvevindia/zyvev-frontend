# Gold Standard EV Experience

Trust-rich vehicle detail and compare UX when master catalog metadata is present. Incremental UI on existing routes; no production flag changes in this sprint.

## Audit findings

| Area | Finding | Mitigation |
|------|---------|------------|
| Compare | Empty compare CTA, stale route state on reload | `compareCarsStorage`, clear on reload |
| Detail page | Legacy cars lack psychology, FAQs, ownership scores | `catalogMeta` from dual-read or enrich API |
| Trust | No visible data quality / publish state | `CatalogTrustBadge` |
| Compare | Spec table only; no value narrative | `CompareInsightCard` |
| Flags | Master catalog off in production by design | `USE_EV_MASTER` (backend), `VITE_CATALOG_DETAIL_ENRICH` (frontend staging) |

## Implementation (frontend)

- `src/utils/catalogExperience.js` — `hasCatalogExperience`, `mergeCatalogIntoVehicle`, `buildFaqSchema`, gold-tier slug prefixes
- `src/hooks/useCatalogEnrichment.js` — optional `GET /api/catalog/variants/slug/:slug` when enrich flag on
- `src/components/catalog/CatalogTrustBadge.jsx` — quality score, verified/published, confidence
- `src/components/catalog/EvDetailGoldSections.jsx` — quick decision, suitability, charging, pros/cons, cost, rivals, FAQs
- `src/components/catalog/CompareInsightCard.jsx` — value score, strength, trade-off on compare cards
- `src/pages/CarDetails.jsx` — enriched `vehicle`, trust badge, gold sections, FAQ JsonLd
- `src/pages/ComparePage.jsx` — insight cards and value badges when `catalogMeta` exists

## Rollout

1. **Backend staging:** Import Tier-1 with `--publish`; set `USE_EV_MASTER=true` on staging only.
2. **Frontend staging:** Set `VITE_CATALOG_DETAIL_ENRICH=true` to backfill gold UX for listed slugs without full dual-read.
3. **Production:** Keep `USE_EV_MASTER=false` and `VITE_CATALOG_DETAIL_ENRICH` unset/false until catalog QA sign-off.
4. **Enable dual-read in prod** only after published master variants match slugs in use and rollback doc is agreed.

## UX priorities

1. Decision support above the fold (range, charging summary, psychology tags).
2. Trust signals (quality score, last updated, governance status).
3. Compare differentiation (value score, strengths vs trade-offs).
4. SEO: expert summary, FAQ schema when FAQs exist.

## Trust recommendations

- Show `catalogMeta.qualityScore` and `governance.status` only when `catalogSource === 'ev_master'`.
- Prefer `expertSummary` over generic overview copy when present.
- Do not claim “verified” without backend `governance.verifiedAt` or equivalent.
- Staging enrich must not change URLs or break legacy-only slugs.

## Testing locally

```bash
# Backend (zyvev-backend): published Tier-1 + optional USE_EV_MASTER=true
# Frontend:
cp .env.example .env.local
# VITE_API_URL=http://localhost:5000
# VITE_CATALOG_DETAIL_ENRICH=true   # staging only

npm run dev
```

Visit `/car/<gold-tier-slug>` and `/compare` with two catalog-backed vehicles.
