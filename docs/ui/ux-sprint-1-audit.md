# EVSavari UX Sprint 1 — Homepage & Discovery Audit

Generated: 2026-06-10  
Scope: Homepage, discovery, search/filters, compare, vehicle detail  
Catalog context: ~25 production EVs in golden dataset  
Platform agents: **not modified** (read-only audit)

---

## Recommendation

**REVIEW_REQUIRED**

The audit surfaces **20 ranked UX issues** with clear severity and effort. Most can ship in Sprint 1 without platform changes. **Five product/IA decisions** should be confirmed before large work begins (see [Decisions needed before implementation](#decisions-needed-before-implementation)).

---

## Executive summary

EVSavari has strong underlying assets — EVSavari Score Engine, intelligence discovery presets, SEO guide network, variant comparison tables, and a 25-vehicle catalog. Buyer-facing UX does not yet surface that depth consistently.

| Area | Current state | Primary gap |
|------|---------------|-------------|
| Homepage | Hero + filter bar + curated carousels | No category entry, no score storytelling, search triggers API on every keystroke |
| Discovery | Three parallel systems (`/cars`, `/discover/*`, `/best-evs/*`) | Sparse primary nav; buyers must discover routes via footer/guides |
| Search & filters | Smart chips on `/cars` only | No body-type filter; inconsistent price bands; 50-item catalog cap |
| Compare | Rich spec matrix + deferred score table | “Recommended” badge ≠ EVSavari score; mobile spec table is scroll-only |
| Vehicle detail | 12-tab layout with score panel + variants | Tab density; stub reviews; fragmented related/compare flows |

**Highest ROI quick wins:** fix homepage search debouncing, expand navbar discovery links, remove/hide public CRM link, add body-type + price filters on listing, surface scores on homepage cards, mobile compare card layout.

---

## Methodology

Code review of buyer-facing routes and components (no live browser session). Key files audited:

| Surface | Primary files |
|---------|-----------------|
| Homepage | `src/pages/Home.jsx`, `src/components/HomeSection.jsx`, `src/components/CompactCarCard.jsx` |
| Listing / filters | `src/pages/ListingPage.jsx`, `src/components/discovery/EvDiscoveryFilters.jsx`, `src/intelligence/filterDefinitions.js` |
| Discovery | `src/pages/IntelligenceDiscoveryPage.jsx`, `src/pages/DiscoverySeoPage.jsx`, `src/pages/SeoGuidesHub.jsx` |
| Navigation | `src/components/Navbar.jsx`, `src/components/Footer.jsx` |
| Compare | `src/pages/ComparePage.jsx`, `src/components/compare/CompareHeroExperience.jsx`, `src/components/catalog/CompareBelowFoldSections.jsx` |
| Detail | `src/pages/CarDetails.jsx`, `src/components/car/DetailOverviewDashboard.jsx`, `src/components/scoring/EvSavariScorePanel.jsx` |
| Routing / perf | `src/App.jsx`, `vite.config.js` |

---

## Top 20 UX issues (ranked by impact)

Impact = effect on buyer conversion, trust, and task completion for Indian EV shoppers.

| # | Issue | Area | Severity | Effort | Impact rationale |
|---|-------|------|----------|--------|------------------|
| 1 | **Homepage search refetches catalog API on every keystroke** — `useEffect` depends on full `filters` object including `search`; no debounce | Search | **Critical** | Small | Typing lag, wasted API calls, poor mobile experience; first interaction many users have |
| 2 | **Primary navbar omits core buyer journeys** — only Home, Compare, CRM; no Browse EVs, Guides, Categories | Discovery | **Critical** | Small | ~25 vehicles and rich `/discover/*` + `/guides` hub are undiscoverable without footer scrolling |
| 3 | **CRM / Admin link exposed in public navbar** — `path: "/admin"` visible to all buyers | Discovery | **Critical** | Small | Confuses buyers; exposes internal ops surface; erodes marketplace trust |
| 4 | **Catalog hard-capped at 50 variants** — Home and Listing fetch `limit=50` with no pagination | Search | **High** | Medium | With ~25 families and multi-variant models, filtered results may silently omit vehicles as catalog grows |
| 5 | **No body-type filter in UI** despite `BODY_TYPE_TAXONOMY` in `taxonomy.js` | Filters | **High** | Medium | SUV vs hatchback vs sedan is a top Indian buyer criterion; SEO pages reference body types without listing filter |
| 6 | **Homepage lacks EVSavari score visibility** — cards show signal chips, not composite scores or grades | Homepage | **High** | Medium | Core differentiator (Score Engine) invisible at top of funnel; only visible on detail and some discovery pages |
| 7 | **Compare “Recommended” badge uses price/range heuristic, not EVSavari score** — `getBestValueId()` in `CompareHeroExperience.jsx` | Compare | **High** | Small | Undermines score trust; users may see highest-scored EV without badge or opposite |
| 8 | **Compare spec table mobile UX is horizontal scroll only** — `min-width: 640px`, no card fallback | Compare | **High** | Medium | Primary compare task on 375px devices requires hidden swipe; variant detail already uses card/table swap pattern |
| 9 | **EVSavari score comparison deferred below fold** — lazy `CompareBelowFoldSections`; omitted entirely on SEO guide compare | Compare | **High** | Medium | Score Engine output buried; SEO compare pages feel less authoritative than tool hub |
| 10 | **Inconsistent filter UX across surfaces** — Home has price dropdown + 3 brands; `/cars` has smart chips only (single price chip); no shared filter state | Filters | **High** | Medium | Users re-learn filters; Home → Cars transition drops active filters |
| 11 | **Three parallel discovery paradigms without clear IA** — `/cars?intel=`, `/discover/:preset`, `/best-evs/:useCase` | Discovery | **High** | Large | Cognitive load; duplicate rankings; internal links compete; navigation depth unclear |
| 12 | **Homepage missing category entry points** — hero CTAs go to `/cars` only; `/bikes`, `/scooters` routes exist but unlinked | Homepage | **Medium** | Small | Marketplace positioning mentions cars/scooters/bikes in schema copy but not in UI |
| 13 | **Listing hero H1 fixed at 52px** — no `clamp()` on `ListingPage.jsx` | Mobile | **Medium** | Small | Overflow/wrap issues on small screens; contrasts with Home hero responsive typography |
| 14 | **Secondary filters hidden behind “More filters”** — charging connector, battery size, ADAS, V2L low discoverability | Filters | **Medium** | Small | Power users and highway/apartment buyers miss relevant chips |
| 15 | **Vehicle detail: 12 sticky tabs with stub Reviews section** — placeholder copy only | Detail | **Medium** | Medium | Tab bar clutter; dead-end section damages credibility |
| 16 | **Variant score recommendations not linked to variant cards** — `EvSavariScorePanel` lists variants; `VariantComparisonTable` uses separate award heuristics | Detail | **Medium** | Medium | User must mentally connect recommendation text to selectable variants |
| 17 | **Related vehicles / compare rivals fragmented** — gold rival pills, SEO link grid, full-page `/compare` navigation without pre-fill | Detail | **Medium** | Medium | Broken compare journey from detail; `window.location.href` full reload in some paths |
| 18 | **Homepage `HomeSection` “View All” uses `<a href>` not React Router `<Link>`** | Homepage | **Medium** | Small | Full page reload on section navigation; loses SPA state and scroll position |
| 19 | **Home + Compare eager-loaded; limited code splitting** — `App.jsx` static imports; minimal Vite manual chunks | Performance | **Medium** | Medium | Larger initial JS bundle; slower first paint on mobile networks |
| 20 | **Accessibility gaps on search/filters** — no `aria-label` on filter inputs; emoji in hero badge; weak focus visibility (inline styles) | Mobile | **Low** | Medium | Screen reader and keyboard users disadvantaged; WCAG risk for public marketplace |

---

## Area deep-dives

### 1. Homepage audit

| Check | Status | Notes |
|-------|--------|-------|
| Hero section | ⚠️ Partial | Strong visual hierarchy and dual CTAs (Explore / Compare). Copy promises scores, EMI, range — but scores not shown below fold. |
| Search visibility | ⚠️ Partial | Filter bar immediately below hero. Search competes with brand/price/sort; no prominent “search-first” pattern. |
| Top EV categories | ❌ Missing | No SUV / hatchback / budget / luxury category tiles. No links to `/discover/*` presets. |
| Compare CTA | ✅ Present | Hero secondary button → `/cars?compareMode=true`. JSON-LD SearchAction present. |
| Latest EVs | ✅ Present | “Recently Added” section via `latestFamilies`. |
| Score highlights | ❌ Missing | `CompactCarCard` shows psychology signals (`listingSignals.js`), not EVSavari composite score/grade. |
| Mobile layout | ⚠️ Partial | `clamp()` on hero typography; filter bar wraps. No homepage-specific breakpoint tuning. |
| Loading performance | ⚠️ Partial | Skeleton cards on load. **No debounced search.** Eager Home bundle. Cards use lazy images but not LCP-prioritized `eagerImage`. |

**Key file:** `src/pages/Home.jsx` — fetch at lines 124–167 re-runs on every `filters` change.

---

### 2. Discovery experience

| Check | Status | Notes |
|-------|--------|-------|
| Category pages | ⚠️ Partial | `/popular`, `/latest`, `/upcoming`, `/bikes`, `/scooters` exist via `ListingPage` segment logic. Not linked from homepage or navbar. |
| Top rankings | ✅ Strong | `IntelligenceDiscoveryPage` shows preset-ranked cards with score, grade, and reason. |
| Internal links | ✅ Strong (SEO) | `SeoGuidesHub`, footer, and discovery cross-links are rich. Weak at top of funnel. |
| Navigation depth | ❌ Weak | Buyer must: Home → scroll footer → Guides, or know `/discover/city-driving` URLs. |

**Intelligence presets** (`src/data/intelligenceDiscoveryPresets.js`) cover city, highway, apartment, family, budget, and charging use cases — under-linked from homepage.

---

### 3. Search and filters

| Filter | Homepage | `/cars` listing | Intelligence presets |
|--------|----------|-----------------|----------------------|
| Text search | ✅ (server) | ✅ (client) | — |
| Price | ✅ dropdown (₹10L/₹20L bands) | ⚠️ chip: under ₹15L only | Preset-driven |
| Range | Sort only | ✅ long / extra-long chips | ✅ |
| Body type | ❌ | ❌ | ❌ |
| Charging speed | ❌ | ✅ fast / ultra (secondary) | ✅ |
| City / highway / family | ❌ | ✅ primary chips | ✅ |
| Brand | ⚠️ 3 hardcoded | ✅ dynamic from catalog | — |

**Filter logic:** AND across selected chips; URL-synced as `?intel=city_friendly,charging_fast` on listing page.

**Gap:** `EvRecommendationWidget` (slider-based personalized ranking with scores) only on `/cars` — not on homepage.

---

### 4. Compare experience

| Check | Status | Notes |
|-------|--------|-------|
| Table readability | ✅ Desktop | Core spec rows with winner highlighting via `compareSpecRows.js`. |
| Mobile usability | ❌ Weak | Horizontal scroll hint; no stacked card alternative. |
| Score presentation | ⚠️ Split | Cards show score via `CompareScoreInsight`; dimension table below fold; guide mode hides score table. |
| Variant recommendations | ⚠️ Partial | Cross-model: value heuristic badge only. Same-family: `VariantComparisonTable` with award badges. |

**Three recommendation systems** coexist without unified UX copy:

1. Compare badge — price/range ratio (`getBestValueId`)
2. EVSavari Score Engine — `EvSavariScorePanel` / `CompareScoreComparison`
3. Variant awards — `computeVariantAwards` in `variantInsights.js`

---

### 5. Vehicle detail pages

| Check | Status | Notes |
|-------|--------|-------|
| Score panel | ✅ Strong | `EvSavariScorePanel` with gauge, 9 dimensions, strengths/weaknesses when `hasData`. Legacy fallback for older catalog entries. |
| Variant cards | ✅ Strong | Card/table swap at 900px; badges for best value, long range, fast charging. |
| Charging information | ✅ Strong | Hero quick specs → variant cards → `EvIntelligenceSections` charging grid (three layers). |
| Pros and cons | ⚠️ Partial | `catalogMeta.pros/cons` in overview; may overlap with score strengths/weaknesses. |
| Related vehicles | ⚠️ Partial | Gold rival pills + `DetailSeoDiscovery` links; compare pre-fill inconsistent. |

**Tab density:** Overview, Variants, Compare Rivals, Range, Charging, Ownership, Features, EMI, Reviews (stub), Safety, Related EVs, Assistance — many conditional on intelligence data presence.

---

## Suggested Sprint 1 implementation waves

### Wave A — Quick wins (1–2 days, no IA decisions)

| Issue # | Task |
|---------|------|
| 1 | Debounce homepage search (300–400ms); consider client-side filter after initial fetch like ListingPage |
| 2 | Add navbar links: Browse EVs (`/cars`), Guides (`/guides`), optional Discover hub |
| 3 | Remove or gate CRM link behind auth/admin role |
| 7 | Align compare “Recommended” badge with EVSavari best-value variant or overall score tier |
| 13 | Replace fixed 52px listing H1 with `clamp()` |
| 18 | Convert `HomeSection` view-all anchors to `<Link>` |

### Wave B — Filter & discovery (3–5 days)

| Issue # | Task |
|---------|------|
| 5 | Add body-type filter chips using existing taxonomy |
| 10 | Unify price band definitions across Home and Listing; share URL param schema |
| 6 | Show score badge on `CompactCarCard` / `CarCard` when `scoreVehicle()` has data |
| 12 | Add homepage category tiles (Budget / City / Highway / Family / Compare top picks) linking to `/discover/*` |
| 14 | Promote 2–3 high-intent secondary filters to primary row |

### Wave C — Compare & detail polish (3–5 days)

| Issue # | Task |
|---------|------|
| 8 | Mobile compare spec card layout (mirror variant comparison pattern) |
| 9 | Move score comparison above fold or into hero tabs; enable on SEO guide compare |
| 16 | Link score-panel variant recommendations to variant table selection |
| 17 | Unified “Compare with rivals” CTA that pre-fills compare tool via storage API |
| 15 | Hide or consolidate Reviews tab until content exists |

### Wave D — Scale & performance (5+ days)

| Issue # | Task |
|---------|------|
| 4 | Family-level pagination or raise limit with family aggregation guarantee |
| 11 | Discovery IA consolidation (pick primary canonical paths) |
| 19 | Lazy-load Home/Compare; prefetch `/cars` on hero CTA hover |
| 20 | Accessibility pass on filters and focus states |

---

## Decisions needed before implementation

Confirm with product/design before **Large** effort items:

1. **Discovery IA** — Is `/discover/:preset` or `/best-evs/:useCase` the canonical buyer path? Should homepage category tiles deep-link to one system only?
2. **Compare recommendation semantics** — Should “Recommended” mean EVSavari overall score, best-value variant, or price/range ratio? Single label definition needed.
3. **Public admin link** — Remove entirely, move to footer, or show only for authenticated dealer/admin sessions?
4. **Homepage score strategy** — Show numeric score on every card, or a “Top scored this week” section linking to `/discover/*`?
5. **Catalog pagination** — Family-level infinite scroll vs paginated grid vs increase limit to 200 variants?

---

## Success metrics (post-Sprint 1)

| Metric | Baseline (audit) | Target |
|--------|------------------|--------|
| Homepage search API calls per session | 1 per keystroke | ≤ 3 debounced calls |
| Nav click-through to `/cars` or `/discover` | Footer-dependent | ≥ 30% sessions via navbar |
| Compare mobile task completion | Scroll-dependent | Card layout usable without horizontal hunt |
| Filter usage (body type + price) | 0% body-type | Measurable filter apply events |
| Score visibility at top of funnel | 0 homepage cards | 100% catalog cards with score when data exists |
| Catalog completeness under filter | Unknown (50 cap) | 100% families visible |

---

## Appendix: Route map (buyer-facing)

```
/                     Home (eager)
/cars                 Listing + smart filters + recommendation widget
/popular|/latest|/upcoming   Browse segments
/bikes|/scooters      Category segments
/discover/:preset     Intelligence-ranked discovery (scores shown)
/best-evs/:useCase    SEO editorial discovery
/compare              Compare tool hub
/compare/:slug        SEO compare guide
/guides               Discovery hub
/cars/:slug           Vehicle detail (lazy)
```

---

## Related docs

- [`docs/catalog/catalog-quality-sprint.md`](../catalog/catalog-quality-sprint.md) — 25-vehicle catalog QA
- [`docs/agents/platform-foundation-checkpoint-v1.md`](../agents/platform-foundation-checkpoint-v1.md) — frozen platform scope

---

*Audit only — no application code modified.*
