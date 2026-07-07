# Phase 13 — Authority & Discovery Architecture

**Status:** Design (not implemented)  
**Phase:** 13  
**North star:** Make EVSavari the most authoritative EV buying platform in India  
**Audience:** Engineering, product, editorial, SEO  
**Last updated:** July 2026

**Related systems today:** `scripts/generate-content.mjs`, `public/seo-data/`, `DiscoverySeoPage`, Compare Intelligence, Buyer Assistant, Score 2.0, `seoAuthorityOps`, authority content modules in `src/content/authority/`

---

## Document map

| § | Topic |
|---|--------|
| 1 | Objectives |
| 2 | User journeys |
| 3 | SEO strategy |
| 4 | Programmatic content strategy |
| 5 | Buying guide architecture |
| 6 | Comparison hub architecture |
| 7 | Charging guide architecture |
| 8 | State incentive architecture |
| 9 | City landing pages |
| 10 | Internal linking strategy |
| 11 | Editorial workflow |
| 12 | AI-assisted content generation |
| 13 | Human review workflow |
| 14 | Content quality scoring |
| 15 | Information freshness strategy |
| 16 | KPIs |
| 17 | Success metrics |
| 18 | Technical architecture |
| 19 | Risks |
| 20 | Milestones |

---

## 1. Objectives

### Primary objective

Establish EVSavari as the **default trusted decision layer** for Indian EV buyers — from first research through compare, ownership realism, and city-specific practicality — without sacrificing catalog accuracy or editorial integrity.

### Strategic objectives

| ID | Objective | Success looks like |
|----|-----------|-------------------|
| O1 | **Decision authority** | Users cite EVSavari guides when explaining EV tradeoffs (charging, TCO, myths) |
| O2 | **Discovery completeness** | Every major buyer intent has a canonical EVSavari URL (not a thin aggregator page) |
| O3 | **Catalog-grounded truth** | All ranked lists, compares, and city picks trace to live catalog + Score 2.0 |
| O4 | **India specificity** | Content reflects apartments, monsoon, tariffs, RWA, highway gaps, tier-2 realities |
| O5 | **Compounding SEO** | Clusters interlink (guide → compare → detail → assistant) with measurable crawl depth |
| O6 | **Operational sustainability** | Editorial + AI pipeline scales without AI spam or governance drift |

### Non-objectives (explicit)

- Mass-generating city × model × variant pages
- Keyword-stuffed “best EV” farms disconnected from catalog
- Competing with OEM marketing copy or dealer inventory sites
- Replacing human editorial judgment with fully automated publish

### Phase 13 positioning vs prior work

| Prior phase | Contribution | Phase 13 builds on |
|-------------|--------------|------------------|
| P1.4 | Visual regression, CI determinism | Quality gate for discovery UI |
| P1.5 | Playwright lazy-route stabilization | Reliable E2E for cross-route journeys |
| Track B authority | Beginner/charging/ownership topic modules | Editorial depth + cluster hubs |
| Content batch (`content:generate`) | ~157 discovery pages, 25 cities | Governance, freshness, incentives |

---

## 2. User journeys

Phase 13 optimizes for **intent-based journeys**, not page-type silos. Each journey maps to canonical entry points and conversion paths.

### Journey A — First-time EV researcher (“Should I buy an EV?”)

```
Search / social → ownership-guides/how-evs-work | ev-myths hub
                → charging-guides/charging-types
                → discover/under-15-lakh | assistant (/assistant)
                → compare hub or compare/:slug
                → vehicle detail (/cars/:slug)
                → ownership tools (/tools/tco)
```

**Authority signals:** myth-busting, calm tone, no fabricated savings, FAQ schema.

### Journey B — Apartment buyer (“Can I charge at home?”)

```
Search → ownership-guides/society-rwa | charging-guides/apartment-setup
       → discover/apartment-living (preset)
       → compare with apartment-risk rail links
       → assistant (charging: Apartment answer path)
       → shortlist → detail
```

**Authority signals:** RWA process realism, load management, extension risks.

### Journey C — City commuter (“Best EV for Bangalore traffic”)

```
Search → /cities/bengaluru/evs
       → discover/city-driving
       → best-evs/for-city-agent (or preset)
       → compare local rivals
       → running-cost ownership page
```

**Authority signals:** city descriptor copy, local charging page pairing.

### Journey D — Highway / weekend traveler

```
Search → ownership-guides/highway-ownership | discover/highway-evs
       → best-evs/long-range-highway
       → compare/:slug (range + charging speed)
       → review page
```

### Journey E — Policy-aware buyer (“What subsidy in my state?”)

```
Search → /incentives/:state (new — §8)
       → city landing if metro-specific policy
       → tax-benefits ownership guide
       → TCO calculator with localized assumptions (future)
```

### Journey F — Compare-first buyer

```
Search → /compare/:slug (editorial compare guide)
       → CompareHeroExperience (live catalog)
       → authority rail (2–4 contextual guides)
       → detail pages for each vehicle
       → assistant restart with compare context (future)
```

### Journey G — Returning owner / upgrade

```
Direct → ownership-guides/battery-health | resale-value
       → used-ev-buying
       → catalog filter / discover preset
```

### Cross-journey primitives

| Primitive | Role |
|-----------|------|
| **Buyer Assistant** | Intent capture → scored recommendations |
| **Compare Intelligence** | Pairwise decision with editorial + data |
| **Score 2.0** | Consistent suitability language |
| **Ownership tools** | TCO, EMI, cost/km — proof of ownership realism |
| **Guides hub** (`/guides`) | Editorial index and cluster navigation |

---

## 3. SEO strategy

### Positioning

EVSavari SEO is **decision SEO**, not volume SEO. Rank for intents where catalog-backed answers outperform generic listicles.

### URL architecture (canonical families)

| Family | Pattern | Index policy |
|--------|---------|--------------|
| Discovery presets | `/discover/:presetSlug` | Index when ≥ minResults |
| Compare guides | `/compare/:compareSlug` | Index when catalog pair loads |
| Ownership guides | `/ownership-guides/:slug` | Index (editorial) |
| Charging guides | `/charging-guides/:slug` | Index (editorial) |
| City EVs | `/cities/:city/evs` | Index (tier-1 cities first) |
| City charging | `/cities/:city/charging` | Index |
| Best EVs segments | `/best-evs/:segment` | Index when catalog-backed |
| State incentives | `/incentives/:state` | Index (freshness-gated) |
| Vehicle detail | `/cars/:slug` | Index (catalog) |
| Legacy guides hub | `/guides` | Index (navigation hub) |

**Reserved slug discipline:** SEO slugs must not collide with vehicle family slugs (`CarsSlugRouter` audit).

### Keyword strategy (cluster-based)

| Cluster | Primary intents | Canonical owner |
|---------|-----------------|-----------------|
| Beginner education | how ev works, ev myths, first time ev | ownership-guides |
| Charging | home charging, apartment charging, types | charging-guides |
| Ownership cost | running cost, tco, insurance, resale | ownership-guides + tools |
| Compare | X vs Y electric car | compare/:slug |
| City | best ev in [city], ev charging [city] | cities/* |
| Use-case | best ev for family, highway, taxi | best-evs + discover |
| Policy | ev subsidy [state], ev tax benefit india | incentives + ownership-tax-benefits |

### Technical SEO requirements

- **Structured data:** FAQ, Breadcrumb, ItemList (compare), Article (guides)
- **Sitemaps:** `seo-pages.xml`, `compare.xml`, `ownership.xml`, city shards — governed by `discovery-index.json`
- **Canonical tags:** one URL per intent; no duplicate preset vs agent slug
- **Conditional noindex:** presets below `minResults` (existing `INTELLIGENCE_DISCOVERY_PRESETS` pattern)
- **Core Web Vitals:** lazy routes must not break E2E or UX (P1.5); discovery pages use compare loading skeletons
- **Internal PageRank flow:** hub → cluster → compare → detail (§10)

### Competitive differentiation in SERP

- Show **live catalog scores**, not static “winner” badges
- **Tradeoff framing** (“About this comparison”, not “overall winner”)
- **India-specific FAQs** (monsoon, RWA, tariff bands)
- Freshness dates visible in editorial sections where policy/content ages

---

## 4. Programmatic content strategy

### Philosophy

Programmatic ≠ thin. Every generated page must satisfy:

1. **Catalog anchor** — at least one live vehicle or pair with score profile  
2. **Unique editorial frame** — intro, tradeoffs, or city descriptor not templated spam  
3. **Governance pass** — registry validation, duplicate title/H1 audit  
4. **Link obligation** — minimum inbound/outbound internal links per page type  

### Content tiers

| Tier | Description | Examples | Generation |
|------|-------------|----------|------------|
| **T0 — Catalog-native** | Vehicle/review/ownership programmatic | `/ownership/:slug/tco` | Rules + catalog |
| **T1 — Pair/triple programmatic** | Compare guides | `/compare/nexon-vs-zs` | `COMPARE_PAIRS` + generator |
| **T2 — Segment programmatic** | Best EVs for X | `/best-evs/large-family` | `BEST_EVS_TOPICS` + scores |
| **T3 — Geo programmatic** | City EVs/charging | `/cities/pune/evs` | `CITIES` + local copy |
| **T4 — Editorial programmatic** | Authority deep dives | `/ownership-guides/myth-*` | Templates + human review |
| **T5 — Agent-assisted** | Long-tail compare/best | agent JSON slugs | AI draft + human gate |

### Generation pipeline (existing + Phase 13 extensions)

```
Source definitions (data.mjs, authorityPages.mjs, agentPages.mjs)
        ↓
Generators (pages.mjs, authorityPages.mjs, brandPages.mjs)
        ↓
Registry merge + validateRegistry()
        ↓
public/seo-data/{slug}.json + content-manifest.json + discovery-index.json
        ↓
src/content/generated/manifest.js
        ↓
prebuild: content:generate → build:sitemaps
        ↓
Runtime: loadDiscoveryPage() → DiscoverySeoPage | IntelligenceDiscoveryPage
```

### Phase 13 programmatic additions

| Addition | Tier | Gate |
|----------|------|------|
| State incentive pages | T3/T4 | Policy source + quarterly review |
| Expanded compare pairs (Tier-1 only) | T1 | Catalog completeness ≥ threshold |
| City incentive callouts | T3 | Linked to state page |
| “Best variant” agent pages | T5 | Variant-level catalog truth |

### Anti-patterns (blocked by governance)

- Publishing pages with duplicate H1/title/canonicalPath  
- City × model long-tail without unique data  
- Compare pages where either vehicle fails catalog load  
- FAQ answers that fabricate prices, range, or incentives  

---

## 5. Buying guide architecture

### Definition

A **buying guide** on EVSavari is an intent-addressable page that helps a buyer **narrow choices** before or during compare — grounded in Score 2.0 and catalog filters.

### Guide types and routes

| Type | Route family | Primary UI |
|------|--------------|------------|
| **Discovery preset** | `/discover/:presetSlug` | `IntelligenceDiscoveryPage` |
| **Best EVs segment** | `/best-evs/:segment` | Discovery SEO layout |
| **Ownership guide** | `/ownership-guides/:slug` | Editorial + FAQ |
| **Beginner hub** | `/guides` + ownership/charging hubs | `SeoGuidesHub` |
| **Assistant** | `/assistant` | Interactive questionnaire |

### Information architecture

```
/guides (hub)
├── /discover/*          — scored presets (budget, usage, body type)
├── /best-evs/*          — segment listicles (catalog-ranked)
├── /ownership-guides/*  — ownership education + myths
├── /charging-guides/*   — charging education
└── /assistant           — interactive guide
```

### Page contract (buying guide)

Every buying guide JSON (`seoPage`) should include:

| Field | Purpose |
|-------|---------|
| `title`, `metaDescription`, `h1` | SEO |
| `intro` | Editorial frame (unique) |
| `recommendationLogic` | Transparent scoring explanation |
| `picks[]` | Catalog slugs + rationale |
| `tradeoffs[]` | Honest limitations |
| `faqs[]` | FAQ schema |
| `canonicalPath` | Indexing |
| `cluster` | Internal linking + ops reporting |
| `freshness` | `generatedAt`, `reviewBy` (Phase 13) |

### Integration with Assistant

| Assistant answer dimension | Guide routing |
|---------------------------|---------------|
| Budget | discover preset + best-evs segment |
| Usage (city/highway) | discover/city-driving, highway-evs |
| Family | discover/family-friendly |
| Charging (home/apartment) | charging-guides + society-rwa |
| Priority (value/premium) | compare + best-evs |

**Phase 13 goal:** Assistant result cards link to **cluster guides** not just tools/detail/compare.

---

## 6. Comparison hub architecture

### Two compare modes (existing)

| Mode | URL | Purpose |
|------|-----|---------|
| **Interactive hub** | `/compare` | User-selected pair, live CompareHeroExperience |
| **Editorial compare guide** | `/compare/:compareSlug` | SEO landing, editorial + live compare engine |

### Compare guide page layers

```
┌─────────────────────────────────────────────┐
│ Breadcrumb + SEO head + JSON-LD             │
├─────────────────────────────────────────────┤
│ CompareHeroExperience (variant="guide")     │
│  — live catalog cards, scores, badges       │
├─────────────────────────────────────────────┤
│ CompareGuideEditorialSections               │
│  — About this comparison, tradeoffs, FAQ    │
├─────────────────────────────────────────────┤
│ Authority rail (buildCompareAuthorityLinks) │
│  — 2–4 contextual guides max              │
├─────────────────────────────────────────────┤
│ Internal compare links (related pairs)      │
└─────────────────────────────────────────────┘
```

### Compare pair selection policy (Phase 13)

| Priority | Criteria |
|----------|----------|
| P0 | Tier-1 family pairs with full variant coverage |
| P1 | Cross-shop rivals (same price band, body type) |
| P2 | Upgrade path pairs (Punch → Nexon → Curvv) |
| P3 | Agent-discovered long-tail (human approved) |

**Cap:** No more than N new compare slugs per sprint without editorial review (suggest N=5).

### Compare quality rules

- No “overall winner” language in editorial (E2E enforced in compare-links spec)
- Badges must map to `compareScoreBadges.js` semantics
- Catalog partial load → editorial fallback + retry, not index bloat
- Each compare guide links to **both** vehicle detail pages and **one** ownership tool each

### Hub ↔ guide ↔ assistant loop

```
/compare hub
    ↓ user picks or arrives from SEO
/compare/:slug guide
    ↓ "Estimate Ownership Cost" / "View Vehicle"
/tools/tco, /cars/:slug
    ↓ (tests: stabilize lazy routes — P1.5)
/assistant (restart journey)
```

---

## 7. Charging guide architecture

### Scope

Charging content explains **infrastructure reality**, not charger listings (Phase 13 keeps EVSavari out of CPO directory competition unless data partnership exists).

### Route family

`/charging-guides/:slug` — static JSON + `ChargingGuideDiscoveryPage`

### Topic clusters (existing + expand)

| Cluster | Slugs (examples) | Intent |
|---------|------------------|--------|
| Fundamentals | `charging-types`, `fast-vs-slow` | Education |
| Home | `home-charging`, implied in ownership-home-charger-install | Installation |
| Apartment | `apartment-setup`, `apartment-suitability` | RWA / load |
| Public | `public-charging`, `city-commute` | Behavior expectations |
| Safety | `overnight-safety`, myth cross-links | Trust |

### Page structure

1. **Situation framing** — Indian housing mix, tariff context  
2. **Decision tree** — home vs public vs hybrid  
3. **Cost realism** — units, TOU, society billing (ranges, not promises)  
4. **Compare support** — links to EVs suited for apartment/home charging  
5. **City companion link** — `/cities/:city/charging` where relevant  
6. **FAQ schema** — People Also Ask coverage  

### Cross-links (mandatory)

| From | To |
|------|-----|
| charging-guides | ownership-guides/society-rwa, home-charger-install |
| charging-guides | compare pairs flagged apartment-risk |
| city charging | charging-guides fundamentals |
| vehicle detail | charging guides via `buildDetailAuthorityLinks` |

---

## 8. State incentive architecture

### Gap today

Policy content is scattered (`ownership-tax-benefits` guide). Phase 13 introduces **structured state incentive pages** as first-class discovery entities.

### Route proposal

```
/incentives              — hub (index all states/UTs)
/incentives/:stateSlug   — state/UT detail (e.g. maharashtra, delhi, karnataka)
```

Optional future: `/incentives/:stateSlug/:schemeSlug` for major schemes only (FAME legacy notes, state EV policies, road tax exemptions).

### Data model (conceptual)

```yaml
StateIncentivePage:
  stateSlug: string
  stateName: string
  lastVerified: ISO date
  sources[]: { name, url, accessedAt }
  schemes[]:
    - id: string
      title: string
      type: road_tax | registration | subsidy | charger | parking
      status: active | expired | proposed
      summary: string (editorial)
      eligibility: string
      effectiveFrom / effectiveTo: optional
      disclaimer: string
  faqs[]: FAQ
  relatedCities[]: city slugs
  relatedGuides[]: ownership-tax-benefits, etc.
```

### Content sourcing policy

| Source type | Allowed | Review cadence |
|-------------|---------|----------------|
| Official government notifications | Yes | Quarterly |
| OEM subsidy marketing | No as primary | — |
| News articles | Citation only | — |
| User-generated | No | — |

### Indexing & freshness

- **Index** when `lastVerified` < 90 days and ≥1 active scheme  
- **Noindex + banner** when stale or policy uncertain  
- Visible “Last verified” date on page  
- Auto-flag in ops dashboard when `reviewBy` passed  

### Integration

- City pages show state incentive summary card → link to state page  
- TCO tool footnotes link to state page (future localized assumptions)  
- Assistant “budget” path surfaces incentive awareness chip (non-blocking)  

---

## 9. City landing pages

### Existing coverage

25 cities × 2 pages = 50 URLs (`/cities/:city/evs`, `/cities/:city/charging`) in `discovery-index.json`.

### City page architecture

```
/cities/:city/evs
├── City descriptor (unique prose in data.mjs)
├── Ranked local picks (catalog + score)
├── Usage context (traffic, climate, parking)
├── Links → city charging, discover presets, compare pairs
└── FAQ (city-specific)

/cities/:city/charging
├── Home vs public mix for city archetype
├── Apartment prevalence note
├── Links → charging-guides, society-rwa
└── FAQ
```

### City tier strategy

| Tier | Cities | Phase 13 treatment |
|------|--------|-------------------|
| **T1** | Bengaluru, Mumbai, Delhi, Hyderabad, Chennai, Pune | Editorial refresh, incentive callouts, compare depth |
| **T2** | Ahmedabad, Kolkata, Jaipur, Chandigarh, Kochi, … | Maintain generated quality, quarterly audit |
| **T3** | Patna, Guwahati, Ludhiana, … | Keep indexed only if catalog picks ≥ threshold |

### Expansion rules

- New city requires: descriptor copy (human), ≥3 catalog-relevant picks, charging companion page, sitemap entry  
- **No** city × model programmatic expansion in Phase 13  

### Local authority signals

- Named corridors / climate factors (not generic “ bustling metropolis ”)  
- Honest charging maturity language (emerging vs established)  
- Pair with **state incentive page** when policy differs by state  

---

## 10. Internal linking strategy

### Link graph principles

1. **Every discovery page is reachable from `/guides` within ≤3 clicks**  
2. **Every compare guide has ≥2 outbound authority links and ≥2 inbound from cluster hubs**  
3. **Every Tier-1 vehicle detail links to ≥1 charging + ≥1 ownership guide**  
4. **No orphan paths** (enforced by `analyzeSeoIndexingDiscipline`)  

### Link types and helpers (existing)

| Helper | From → To |
|--------|-----------|
| `buildCompareAuthorityLinks` | compare → guides (max 4) |
| `buildComparePageAuthorityLinks` | compare → authority topics |
| `buildDetailAuthorityLinks` | detail → charging/ownership |
| `buildChargingToCompareLinks` | charging → compare |
| `buildBeginnerToDiscoveryLinks` | beginner → discover |
| `findEditorialCompareLinks` | detail → compare slugs |
| `compareToGuideLinks` | seoAuthorityOps reporting |

### Phase 13 link matrix (minimum outbound)

| Page type | Min outbound internal links |
|-----------|----------------------------|
| Compare guide | 2 guides, 2 details, 1 tool |
| Ownership guide | 1 compare, 1 charging, 1 discover |
| Charging guide | 1 ownership, 1 compare, 1 city (if metro) |
| City EVs | 1 city charging, 2 compares, 1 discover |
| State incentive | 2 cities, 2 guides, 1 tool |

### Anchor text discipline

- Descriptive anchors (“Apartment charging setup guide”) not “click here”  
- No duplicate exact-match anchors to same target on one page  
- Compare links use “Compare X vs Y on EVSavari” pattern  

---

## 11. Editorial workflow

### Roles

| Role | Responsibility |
|------|----------------|
| **Editorial lead** | Cluster strategy, tone, publish approval |
| **Subject reviewer** | EV/charging/policy fact check |
| **SEO operator** | Canonical, schema, sitemap, indexation |
| **Engineering** | Generator changes, registry, deploy |

### Workflow stages

```
Intent backlog (ops dashboard / guideOpportunityScore)
        ↓
Brief (cluster, intent, catalog anchors, links required)
        ↓
Draft (template or AI-assisted — §12)
        ↓
Self-check (governance checklist)
        ↓
Peer review (§13)
        ↓
Registry + JSON generation
        ↓
Staging preview (preview build)
        ↓
Publish (merge + deploy)
        ↓
Post-publish (GSC, analytics, usefulness feedback — 30 days)
```

### Cadence

| Activity | Frequency |
|----------|-----------|
| Cluster depth pass | Bi-weekly (1 cluster) |
| Compare pair editorial review | Per new slug |
| City copy audit | Quarterly (T1 monthly) |
| State incentive verification | Quarterly |
| Orphan link audit | Weekly (automated) |

### Publish checklist (extends `docs/content-operations/pre-publish-checklist.md`)

- [ ] Unique H1/title/canonical  
- [ ] Catalog picks resolve  
- [ ] Min internal links satisfied  
- [ ] FAQ schema valid  
- [ ] No banned phrases (“overall winner”, fabricated savings)  
- [ ] Freshness metadata set  
- [ ] Sitemap regenerated  

---

## 12. AI-assisted content generation

### Role of AI

AI is a **draft accelerator**, not the publisher. EVSavari already uses structured generators and agent pages (`agentPages.mjs`); Phase 13 formalizes guardrails.

### Allowed AI uses

| Use | Output | Human gate |
|-----|--------|------------|
| Intro/tradeoff prose drafts | Editorial sections | Required |
| FAQ expansion from bullet brief | faqs[] | Required |
| City descriptor refinement | city copy | Required |
| Compare editorial “About this comparison” | compare guide | Required |
| Meta description variants | SEO fields | Spot-check |
| Internal link suggestions | ops report only | Human applies |

### Prohibited AI uses

- Inventing specs, prices, range, NCAP, incentive amounts  
- Auto-publishing without registry validation  
- Mass page creation beyond sprint cap  
- Generating pages for pairs/cities without catalog backing  

### Grounding requirements

All AI drafts must include:

1. **Catalog snapshot reference** (vehicle slugs, scores at generation time)  
2. **Source citations** for policy/incentive content  
3. **Prompt version ID** stored in page metadata  
4. **Diff against template** for audit trail  

### Integration point

```
content-generators/agentPages.mjs  (existing)
        ↓
+ aiDrafts/ staging area (Phase 13 — not public)
        ↓
human review UI or markdown review in repo
        ↓
merge into seo-data JSON
```

---

## 13. Human review workflow

### Review tiers

| Tier | Content | Reviewers | SLA |
|------|---------|-----------|-----|
| **R1 — Light** | Meta/FAQ tweaks on existing page | 1 editor | 2 days |
| **R2 — Standard** | New compare guide, best-evs segment | Editor + SEO | 5 days |
| **R3 — Heavy** | State incentives, myth-busters, new cluster | Editor + subject expert | 10 days |

### Review checklist (R2/R3)

1. **Factual** — specs match catalog; incentives sourced  
2. **Tone** — calm, India-practical, no hype  
3. **Decision usefulness** — tradeoffs present, not single “winner”  
4. **Linking** — matrix satisfied (§10)  
5. **Schema** — FAQ/breadcrumb valid  
6. **Accessibility** — headings hierarchical, readable on mobile  
7. **Legal** — disclaimers on costs, policy, savings  

### Review artifacts

- `reviewSections` in authority topics (existing pattern)  
- `reviewedBy`, `reviewedAt` in seoPage metadata (Phase 13)  
- Block publish in CI if `readiness !== published` for T4/T5 content  

### Escalation

- Policy uncertainty → noindex until verified  
- Catalog gap → conditional noindex or “catalog partial” banner  
- User usefulness feedback < threshold → editorial rewrite, not new URLs  

---

## 14. Content quality scoring

### Existing signals (build on)

| Signal | Source |
|--------|--------|
| `guideOpportunityScore` | `seoAuthorityOps.js` |
| `authorityQualityTrend`, `authorityDepthTrend` | seo authority admin |
| `guideUsefulnessTrend` | content usefulness feedback |
| `clusterCompleteness` | preset + traffic paths |
| Authority audits | `authority:depth-audit`, `quality-audit`, `engagement-audit` |

### Phase 13 composite: **Authority Score (0–100)**

```
AuthorityScore =
  0.25 × CatalogGrounding    (picks resolve, scores present)
+ 0.20 × EditorialDepth      (word count bands, tradeoffs, FAQs)
+ 0.15 × LinkCompleteness    (inbound + outbound vs matrix)
+ 0.15 × Freshness           (age vs reviewBy)
+ 0.10 × UserUsefulness      (feedback, time on page)
+ 0.10 × SERPHealth          (impressions, CTR — when GSC connected)
+ 0.05 × SchemaValidity      (audit pass)
```

### Thresholds

| Score | Action |
|-------|--------|
| ≥ 75 | Index, promote in hubs |
| 55–74 | Index, improvement backlog |
| 40–54 | Noindex until improved |
| < 40 | Archive or merge into parent hub |

### Automated gates (pre-publish)

- `validateRegistry()` — duplicates  
- `audit-canonical-seo.js`  
- `audit-structured-data.js`  
- `audit-internal-links.js`  
- `authority:quality-audit` — depth/thin content heuristics  

---

## 15. Information freshness strategy

### Freshness classes

| Class | Examples | Max age (indexed) | Review trigger |
|-------|----------|-------------------|----------------|
| **Volatile** | State incentives, subsidies | 90 days | Policy news, govt notifications |
| **Semi-stable** | City charging maturity | 180 days | Catalog ops, user reports |
| **Stable** | How EVs work, charging types | 365 days | Technology shift only |
| **Catalog-coupled** | Best EVs, compare picks | On catalog version change | Variant/price updates |

### Metadata (Phase 13)

Every `seoPage` gains:

```json
{
  "freshness": {
    "generatedAt": "ISO",
    "reviewedAt": "ISO",
    "reviewBy": "ISO",
    "freshnessClass": "volatile|semi-stable|stable|catalog-coupled",
    "sources": [{ "label": "", "url": "", "accessedAt": "" }]
  }
}
```

### Stale content behavior

| State | UX | SEO |
|-------|-----|-----|
| Fresh | Normal | Index |
| Review due (<14 days) | Ops flag only | Index |
| Stale | “Last updated” banner | Noindex optional |
| Superseded | 301 to hub | Deindex |

### Regeneration policy

- **Do not** bulk regenerate all JSON on every build (timestamp noise — see P1.5 cleanup notes)  
- Regenerate **only** changed slugs + dependents  
- `content:generate --slug=` filter (Phase 13 tooling)  

---

## 16. KPIs

### North-star KPI

**Qualified discovery sessions** — sessions landing on discovery/compare/guide pages that reach compare, detail, or assistant within the same session.

### Primary KPIs

| KPI | Definition | Target (6 mo) |
|-----|------------|---------------|
| Discovery → decision rate | % discovery sessions reaching compare/detail/assistant/tools | +25% vs baseline |
| Indexed discovery URLs with AuthorityScore ≥ 75 | Count from ops | 80% of indexed set |
| Compare guide catalog load success | % guides with ≥2 vehicles loaded | ≥ 95% |
| Orphan discovery paths | From indexing discipline | 0 |
| Assistant starts from discovery | Attribution | +30% |
| Organic impressions (discovery cluster) | GSC | +50% (lagging) |

### Secondary KPIs

| KPI | Definition |
|-----|------------|
| Guide usefulness rating | Feedback widget |
| Time on compare guide | Analytics |
| Internal link click-through | Event tracking |
| State incentive page engagement | New |
| City page → compare conversion | New |

### Guardrail KPIs (must not degrade)

| KPI | Guardrail |
|-----|-----------|
| Error boundary rate on discovery routes | No increase |
| Core Web Vitals (LCP/CLS) | Within P1.4 baselines |
| Catalog accuracy incidents | Zero tolerance |
| Thin content manual actions (GSC) | Zero |

---

## 17. Success metrics

### Phase 13 exit criteria

| # | Criterion | Measurement |
|---|-----------|---------------|
| S1 | State incentive hub live for ≥10 states/UTs | Routes + reviewed JSON |
| S2 | AuthorityScore operational in admin | Dashboard + export |
| S3 | 100% T1 compare pairs have authority rail links | Link audit |
| S4 | T1 cities refreshed with incentive + compare links | Editorial sign-off |
| S5 | AI draft pipeline with human gate documented and used | Process + sample PRs |
| S6 | Zero orphan discovery paths in sitemap vs index | Weekly audit |
| S7 | Linux CI 98/98 Playwright green including cross-route assistant journeys | CI |
| S8 | Organic discovery impressions trend positive 8 weeks post-index | GSC |

### Long-term success (12 mo)

- EVSavari compare guides rank page 1 for ≥20 Tier-1 pairwise intents  
- Brand search lift for “EVSavari” + “ev compare india”  
- Cited in forums/Reddit/YouTube as neutral compare source  
- Assistant + discovery loop measurable in ≥15% of conversion paths  

---

## 18. Technical architecture

### System context

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVSavari Frontend                         │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ DiscoverySeo │ Compare      │ Buyer        │ Ownership tools    │
│ Page         │ HeroExperience│ Assistant   │ (TCO, EMI, …)      │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│ loadDiscoveryPage / useDiscoveryPage / CarsSlugRouter             │
├─────────────────────────────────────────────────────────────────┤
│ Static: public/seo-data/*.json  │  API: /api/seo/pages (flag)   │
├─────────────────────────────────────────────────────────────────┤
│ Generated: content-manifest, discovery-index, manifest.js         │
└─────────────────────────────────────────────────────────────────┘
         ↑ content:generate              ↑ build:sitemaps
┌─────────────────────────────────────────────────────────────────┐
│ scripts/content-generators/*  +  authorityPages  +  agentPages   │
├─────────────────────────────────────────────────────────────────┤
│ src/content/authority/*  (topic modules, compareSupport)         │
├─────────────────────────────────────────────────────────────────┤
│ Ops: seoAuthorityOps, contentUsefulnessOps, indexingDiscipline   │
└─────────────────────────────────────────────────────────────────┘
         ↑ catalog, scores
┌─────────────────────────────────────────────────────────────────┐
│ Catalog + Score 2.0 + golden loader (browser sync in preview)    │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 13 technical workstreams (design only)

| Workstream | Components | Notes |
|------------|------------|-------|
| **Incentive routes** | `App.jsx` routes, generator, JSON schema | New family |
| **Freshness metadata** | seoPage schema, generator, ops alerts | Extend existing JSON |
| **AuthorityScore** | `seoAuthorityOps.js` or new module | Admin export |
| **AI draft staging** | `scripts/ai-drafts/` + review gate | Not in public bundle |
| **Selective regenerate** | `content:generate --slug` | Avoid SEO timestamp noise |
| **Link audit v2** | extend `audit-internal-links.js` | Matrix from §10 |
| **Assistant ↔ guide links** | `BuyerAssistantPage` result cards | Product |
| **E2E** | extend assistant/compare/city specs | P1.5 stabilization pattern |

### Data flow: publish new compare guide

```
1. Add pair to COMPARE_PAIRS (if catalog-ready)
2. Run generator → public/seo-data/{slug}.json
3. validateRegistry + authority:quality-audit
4. Human review (R2)
5. npm run content:generate && npm run build:sitemaps
6. PR → preview → Playwright compare-links + analytics cross-route
7. Merge → deploy → GSC inspect
```

### Feature flags

| Flag | Effect |
|------|--------|
| `SEO_PAGES_ENABLED` | Live API vs static JSON |
| `VITE_SEO_PAGES` | Frontend API preference |
| `SEO_INTELLIGENCE_PUBLIC` | Expose scores in API |
| Phase 13: `INCENTIVE_PAGES_ENABLED` | Gate new routes until content ready |

### Testing strategy

- **Functional:** compare-links, ownership-links, analytics (cross-route), core-routes for new paths  
- **Visual:** discovery/compare/city templates (P1.4 baselines)  
- **Audit scripts:** canonical, schema, internal links, authority quality  
- **No new production ErrorBoundary changes** for test diagnostics (P1.5 ADR)  

---

## 19. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI content quality drift | Medium | High | Human gate, AuthorityScore, no auto-publish |
| Policy/incentive inaccuracy | Medium | High | Sources, quarterly review, stale noindex |
| Thin content scale temptation | Medium | High | Sprint caps, cluster strategy, ops scores |
| Catalog drift vs static JSON | High | Medium | catalog-coupled freshness, regenerate on change |
| Compare guides without catalog | Medium | Medium | Conditional UI + noindex |
| Internal link orphan growth | Medium | Medium | Weekly indexing discipline audit |
| SEO timestamp noise in git | High | Low | Selective regenerate (§15) |
| Cross-route E2E flakes | Low | Medium | P1.5 stabilization pattern |
| State incentive legal liability | Low | High | Disclaimers, official sources only |
| Competitor outspends on SEO volume | High | Medium | Decision quality + compare depth, not URL count |

---

## 20. Milestones

### Phase 13 roadmap (suggested quarters)

#### P13.1 — Foundation (Weeks 1–4)

- Publish this architecture + align with existing authority cluster roadmap  
- Freshness metadata schema + ops dashboard fields  
- AuthorityScore v1 in admin (read-only)  
- Link audit v2 against §10 matrix  
- Revert/consolidate unrelated working-tree noise (SEO timestamp churn)  

**Exit:** Score visible for all discovery-index pages; orphan audit clean.

#### P13.2 — Incentives & city compounding (Weeks 5–8)

- `/incentives` hub + 10 priority states (R3 review)  
- T1 city page refresh with incentive cards + compare links  
- Charging ↔ ownership cross-link pass  
- Selective `content:generate --slug` tooling  

**Exit:** S1, S4 partial, incentive freshness pipeline live.

#### P13.3 — Compare & guide depth (Weeks 9–12)

- 5 new Tier-1 compare guides (R2 each)  
- Assistant result cards → cluster guide links  
- AI draft workflow pilot (3 pages, human reviewed)  
- Expand authority audits in CI (quality gate on PR)  

**Exit:** S2, S3, S5; compare catalog success ≥ 95%.

#### P13.4 — Scale & measure (Weeks 13–16)

- Remaining T2 states/UTs incentives (rolling)  
- GSC cluster tracking dashboard  
- User usefulness feedback on top 20 discovery URLs  
- Phase 13 exit review against §17 success metrics  

**Exit:** S6–S8; Phase 13 sign-off.

### Dependency graph

```
P13.1 Foundation
    ├── P13.2 Incentives + cities
    └── P13.3 Compare + AI workflow
            └── P13.4 Measurement + scale
```

### Post–Phase 13 (preview)

| Phase | Focus |
|-------|-------|
| **P14** | Accessibility automation (WCAG) — flagged in P1.4 notes |
| **P15** | Localized TCO assumptions (state tariffs, incentives) |
| **P16** | Charger map partnership (only with licensed data) |

---

## Appendix A — Current inventory snapshot

| Asset | Count (approx.) | Source |
|-------|-----------------|--------|
| Discovery registry entries | 157 | `content-manifest.json` |
| Cities | 25 | `data.mjs` |
| Compare pairs (generated) | 25+ | `COMPARE_PAIRS` |
| Ownership topics | 15 | `OWNERSHIP_TOPICS` |
| Authority editorial topics | 20+ | `authorityPages.mjs` |
| Sitemap indexed URLs | ~477 | `build-sitemaps.mjs` |

---

## Appendix B — Glossary

| Term | Definition |
|------|------------|
| **Discovery page** | Programmatic SEO page loaded via `loadDiscoveryPage` |
| **Compare guide** | Editorial SEO page at `/compare/:slug` with live compare engine |
| **Cluster** | Thematic authority group (charging, ownership, beginner, …) |
| **Catalog-grounded** | Picks and scores resolve to live Tier-1 catalog |
| **AuthorityScore** | Phase 13 composite quality metric (§14) |

---

*Phase 13 design — EVSavari Engineering & Product. No implementation authorized by this document alone.*
