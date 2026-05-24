# Tier-1 catalog operations playbook

**Phase:** Day 3 — Real EV catalog operations  
**Scope:** Human-governed onboarding for 11 Indian EV families  
**Not in scope:** Scrapers, bulk import, automation agents, scoring changes

## Purpose

Repeatable discipline for turning EVSavari from persistent infrastructure into a **real production EV catalog platform** — compare-ready, media-trusted, ownership-aware.

## Tier-1 onboarding sequence

Onboard in this order (quality before volume):

| # | Family slug | Brand | Model |
|---|-------------|-------|-------|
| 1 | `tata-nexon-ev` | Tata | Nexon EV |
| 2 | `tata-punch-ev` | Tata | Punch EV |
| 3 | `tata-tiago-ev` | Tata | Tiago EV |
| 4 | `tata-curvv-ev` | Tata | Curvv EV |
| 5 | `mg-comet-ev` | MG | Comet EV |
| 6 | `mg-zs-ev` | MG | ZS EV |
| 7 | `mahindra-be-6` | Mahindra | BE 6 |
| 8 | `mahindra-xev-9e` | Mahindra | XEV 9e |
| 9 | `mahindra-xuv400` | Mahindra | XUV400 |
| 10 | `byd-atto-3` | BYD | Atto 3 |
| 11 | `hyundai-kona-electric` | Hyundai | Kona Electric |

Source of truth for seed data: `src/backend/catalog/tier1CatalogDefinitions.js`

## 1. Vehicle onboarding workflow

1. **Confirm family slug** matches `src/ops/tier1Families.js` and `src/media/productionFamilies.js`.
2. **Review OEM specs** — price, range, battery, charging (AC/DC, port type).
3. **Add or update definition** in `tier1CatalogDefinitions.js` with `compareReady: true`.
4. **Run seed** (service role, scripts only):
   ```bash
   npm run backend:seed-tier1 -- --only=<family-slug>
   ```
5. **Verify persistence**:
   ```bash
   npm run backend:catalog-ops-smoke -- --live
   ```
6. **Manual spot-check** — `/cars/<slug>` and one compare route involving the family.

## 2. Variant normalization workflow

**Slug conventions**

- Lowercase kebab-case: `creative-plus`, `pack-one`, `el-pro`
- One slug per trim level; no spaces or model-year suffixes in slug
- `vehicle_variants.slug` unique per `vehicle_id`

**Required fields per variant**

- `name` — display trim name (e.g. "Empowered Plus")
- `price_inr` — ex-showroom indicative (verify before campaigns)
- `range_km_claimed` — OEM ARAI/claimed
- `range_km_real_world` — EVSavari conservative estimate
- `battery_kwh`
- `compare_specs` — `{ claimedRangeKm, batteryKwh }` minimum

**Rules**

- At least one variant per family; hero media links to first variant
- Real-world range must be ≤ claimed range
- Mark `status: active` only after human review

## 3. Media review workflow

**Cloudinary public ID pattern**

```
evsavari/catalog/families/<family-slug>/<role>
```

**Required roles (7 per family)**

| Role | Use |
|------|-----|
| `hero` | Detail page hero |
| `listing-thumb` | Browse / list cards |
| `compare-thumb` | Compare picker |
| `og` | Social / share preview |
| `exterior` | Gallery — exterior |
| `interior` | Gallery — cabin |
| `charging-port` | Charging practicality |

**QA checklist**

1. Asset exists in Cloudinary (`npm run media:verify`)
2. Row persisted in `vehicle_media` with matching `cloudinary_public_id`
3. Compare thumb readable at compare URL
4. Listing thumb visible on browse surfaces
5. Fallback hierarchy unchanged — do not rewrite `src/media/` pipeline

## 4. Compare QA workflow

**Day 3 priority pairs**

| Pair | Compare slug |
|------|--------------|
| Nexon vs Punch | `tata-punch-ev-vs-tata-nexon-ev` |
| Nexon vs Curvv | `tata-nexon-ev-vs-tata-curvv-ev` |
| Comet vs Tiago | `comet-ev-vs-tiago-ev` |
| BE 6 vs XEV 9e | `mahindra-xev-9e-vs-mahindra-be-6` |

**Validation**

```bash
npm run backend:compare-validate
```

**Human checks (no engine changes)**

- Recommendation reads clearly for a beginner
- Both vehicles show compare thumbs
- Ownership guidance feels practical (not hype)
- Charging section matches `charging_meta`
- Trust explanations present where expected

## 5. Charging-data workflow

Per vehicle, persist in `vehicles.charging_meta`:

- `acKw` — home/work AC rate
- `dcKw` — fast DC (0 if none)
- `port` — `CCS2`, `Type2`, etc.

Cross-check against ownership SEO pages and city charging guides before publish.

## 6. Ownership-guidance workflow

Persist in `vehicles.ownership_meta` flags used by compare/ownership surfaces, e.g.:

- `apartmentFriendly`
- `highwaySuitable`
- `cityPrimary`
- `compactParking`
- `beginnerFriendly`
- `familyPractical`

Only set flags backed by operational review — not marketing copy.

## 7. SEO readiness workflow

Before marking a family **publish-ready**:

1. `/cars/<slug>` returns 200 with correct meta
2. Family appears in `public/sitemaps/cars.xml`
3. Relevant compare routes in `public/sitemaps/compare.xml`
4. Ownership / city SEO JSON references correct `detailPath`
5. `seo_meta.canonicalFamily` matches slug

## 8. Publish readiness checklist

### Quality gates

| Gate | Criteria |
|------|----------|
| **compare-ready** | `compare_ready: true`, ≥1 variant, both families in pair seeded |
| **media-ready** | All 7 roles in Cloudinary + `vehicle_media` |
| **SEO-ready** | Sitemap + meta + canonical family |
| **ownership-ready** | `ownership_meta` + charging_meta reviewed |
| **trust-ready** | Compare journey tested; no broken trust tooltips |

### Commands before publish

```bash
npm run build
npm run backend:catalog-ops-smoke -- --live
npm run backend:compare-validate
npm run media:verify
npm run post-launch:smoke
```

## Operational commands

| Command | Purpose |
|---------|---------|
| `npm run backend:seed-nexon-ev` | First production EV (Nexon) |
| `npm run backend:seed-tier1` | All tier-1 families |
| `npm run backend:seed-tier1 -- --only=slug` | Single family |
| `npm run backend:catalog-ops-smoke` | Conventions + definitions |
| `npm run backend:catalog-ops-smoke -- --live` | Supabase read-back |
| `npm run backend:compare-validate` | Day 3 compare pairs |

## Governance

- **Human-governed** — no scrapers, no unattended bulk import
- **Indicative specs** — seed metadata notes "verify before campaigns"
- **Service role** — scripts only; never in Vite bundle
- **RLS preserved** — do not weaken policies for convenience
- **Compare engine untouched** — operational QA only

## Related

- [Real production foundation](../infrastructure/real-production-foundation.md)
- [Day 3 readiness](../launch/day3-catalog-operations-readiness.md)
- [Tier-1 authority content plan](../content/tier1-authority-content-plan.md)
