# Day 3 — Catalog operations readiness

**Date:** 2026-05-20  
**Phase:** Real EV catalog operations  
**Release meta:** `day3-catalog-operations`

## Mission summary

Transition from persistent production infrastructure to a **real operational EV catalog platform** — without redesigning compare, scoring, dashboards, or ingestion architecture.

## Persistence activation status

| Check | Status | Notes |
|-------|--------|-------|
| Supabase project | **Operator action** | Requires production project + migrations |
| `001_foundation.sql` | Ready in repo | Apply via SQL Editor |
| `002_foundation_read_policies.sql` | Ready in repo | Required for live smoke read-back |
| `VITE_SUPABASE_URL` | **Operator action** | Vercel Production + Preview |
| `VITE_SUPABASE_ANON_KEY` | **Operator action** | Browser persistence only |
| Frontend activation | Implemented | `activateBackendPersistence()` in `main.jsx` |
| Live smoke | **Run when env set** | `npm run backend:persistence-smoke -- --live` |

Offline validation passes without Supabase credentials (graceful idle).

## First EV insertion status

| Item | Status |
|------|--------|
| Nexon seed script | `npm run backend:seed-nexon-ev` |
| Shared seed utilities | `src/backend/catalog/catalogSeedUtils.js` |
| Tier-1 bulk seed | `npm run backend:seed-tier1` |
| Tables | `vehicles`, `vehicle_variants`, `vehicle_media` |
| Media roles (7) | hero, listing-thumb, compare-thumb, og, exterior, interior, charging-port |

**Operator step:** Run seed with `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (scripts only).

## Catalog readiness

| Metric | Value |
|--------|-------|
| Tier-1 families defined | 11 |
| Onboarding sequence | Documented in playbook |
| Definitions module | `src/backend/catalog/tier1CatalogDefinitions.js` |
| Conventions module | `src/backend/catalog/catalogConventions.js` |
| Alignment with `tier1Families.js` | Validated by `backend:catalog-ops-smoke` |
| Alignment with `productionFamilies.js` | Validated by `backend:catalog-ops-smoke` |

### Onboarding sequence

1. tata-nexon-ev → 2. tata-punch-ev → 3. tata-tiago-ev → 4. tata-curvv-ev → 5. mg-comet-ev → 6. mg-zs-ev → 7. mahindra-be-6 → 8. mahindra-xev-9e → 9. mahindra-xuv400 → 10. byd-atto-3 → 11. hyundai-kona-electric

## Media readiness

| Check | Status |
|-------|--------|
| Cloudinary public ID pattern | `evsavari/catalog/families/<slug>/<role>` |
| URL transform | `f_auto,q_auto,c_limit` |
| Persistence mapping | `vehicle_media.cloudinary_public_id` + `url` |
| Fallback hierarchy | Unchanged — existing `src/media/` pipeline |
| Media verify script | `npm run media:verify` (existing) |

**Operator step:** Confirm Cloudinary assets exist for each family before public campaigns.

## Compare readiness

Day 3 validation pairs (engine unchanged — operational QA only):

| Pair | Compare slug | Sitemap |
|------|--------------|---------|
| Nexon vs Punch | `tata-punch-ev-vs-tata-nexon-ev` | Yes |
| Nexon vs Curvv | `tata-nexon-ev-vs-tata-curvv-ev` | Yes |
| Comet vs Tiago | `comet-ev-vs-tiago-ev` | Yes |
| BE 6 vs XEV 9e | `mahindra-xev-9e-vs-mahindra-be-6` | Yes |

```bash
npm run backend:compare-validate
```

## Operational workflows

| Workflow | Document |
|----------|----------|
| Vehicle onboarding | [tier1-catalog-operations-playbook.md](../catalog/tier1-catalog-operations-playbook.md) |
| Variant normalization | Same playbook §2 |
| Media review | Same playbook §3 |
| Compare QA | Same playbook §4 |
| Authority content | [tier1-authority-content-plan.md](../content/tier1-authority-content-plan.md) |

### Quality gates

compare-ready · media-ready · SEO-ready · ownership-ready · trust-ready

## Validation results (local — 2026-05-20)

| Command | Result |
|---------|--------|
| `npm run build` | Pass |
| `npm run admin:routes-smoke` | Pass (9 paths) |
| `npm run backend:persistence-smoke` | Pass (idle — no Supabase env in workspace) |
| `npm run backend:persistence-smoke -- --live` | Pass (live skipped — env not configured) |
| `npm run backend:catalog-ops-smoke` | Pass (11 families, 4 compare sitemap hits) |
| `npm run backend:compare-validate` | Pass (4 day-3 pairs + SEO JSON) |
| `npm run post-launch:smoke` | Pass |
| `npm run media:verify` | Tier-1 100% manifest; **0 broken production-critical** (hero/listing/compare); 61 non-critical gallery/og probes |

Live persistence + seed (requires Supabase env):

```bash
npm run backend:persistence-smoke -- --live
npm run backend:seed-nexon-ev
npm run backend:seed-tier1
npm run backend:catalog-ops-smoke -- --live
npm run media:verify
```

## Remaining gaps

1. **Production Supabase** — migrations + Vercel env not verifiable from repo alone  
2. **Live seed execution** — requires operator credentials  
3. **Spec verification** — seed prices/ranges are indicative; human OEM review before campaigns  
4. **Cloudinary asset QA** — per-family visual review  
5. **Authority content** — 8 pillars planned, not yet drafted  
6. **RLS hardening** — before high-volume anonymous traffic  
7. **Supabase Auth for admin** — future; JWT flow unchanged  

## Next onboarding priorities

1. Run live persistence smoke on production Supabase  
2. Seed Nexon EV, validate read-back  
3. Seed remaining tier-1 in sequence (Punch → Tiago → …)  
4. Run `media:verify` for each family after upload  
5. Manual compare QA on 4 day-3 pairs  
6. Draft beginner ownership + apartment charging content first  

## Related

- [Real production foundation](../infrastructure/real-production-foundation.md)
- [Tier-1 catalog playbook](../catalog/tier1-catalog-operations-playbook.md)
