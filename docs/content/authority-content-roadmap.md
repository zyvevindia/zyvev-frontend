# Authority content roadmap — Track B

EVSavari authority SEO activation focuses on **trustworthy, India-practical education** — not mass AI page generation.

## Clusters

| Cluster | Module | Topics |
| --- | --- | --- |
| Beginner EV Education | `src/content/authority/beginnerTopics.js` | 8 structured topics |
| Charging Guides | `src/content/authority/chargingTopics.js` | 8 topics + taxonomy + FAQ schema |
| Ownership Explainers | `src/content/authority/ownershipGuidance.js` | 4 explainers + 6 usage scenarios |

## Metadata schema

Each topic includes:

- `topic` / `id`, `title`, `cluster`
- `intent` — educate, decide, compare_support, ownership_realism, safety_myth_bust
- `difficulty` — beginner | intermediate | advanced
- `ownershipStage` — research → ownership
- `seoPriority` — p0 | p1 | p2
- `compareSupportRelevance` — high | medium | low
- `readiness` — structured | published (human-review-ready `reviewSections`)

## Editorial principles

1. Calm, non-hype tone; no fabricated savings or NCAP-style claims.
2. India-focused tariffs, apartments, monsoon, and society/RWA realities.
3. Compare-support sections must link to live canonical routes where possible.
4. Structured topics without routes stay `readiness: structured` until editorial publish.

## Canonical routes

Prefer existing discovery families:

- `/discover/*` — intelligence presets
- `/charging-guides/*` — charging batch pages
- `/ownership-guides/*` — ownership batch pages
- `/compare/*` — compare-support journeys

Legacy `/guides/ownership-*` links are being aligned to `/ownership-guides/*` in new internal links.

## Compare-support mapping

`src/content/authority/compareSupport.js` maps compare slugs → beginner / charging / ownership topics by concern (apartment, highway, running cost, etc.).

Priority pairs: Tier-1 Nexon, Punch, Curvv, MG ZS, Atto 3 and manifest compares.

## Internal linking (Phase 7)

| From | To | Helper |
| --- | --- | --- |
| Vehicle detail | Charging + ownership guides | `buildDetailAuthorityLinks` |
| Compare page | Educational authority | `buildComparePageAuthorityLinks` |
| Beginner topic | Discovery hubs | `buildBeginnerToDiscoveryLinks` |
| Charging guide | Compare journeys | `buildChargingToCompareLinks` |

## Operational audits

```bash
npm run authority:audit          # reports/authority-seo/authority-readiness-*.json
npm run authority:beginner-audit # authority-beginner-*.json
npm run authority:charging-audit # authority-charging-*.json
```

## EV myths cluster (Trust expansion)

Hub: `/ownership-guides/ev-myths` — links to 8 myth-buster pages (`/ownership-guides/myth-*`).

Run `npm run authority:depth-audit`, `authority:quality-audit`, `authority:engagement-audit`.

## Populated editorial pages (Track B population)

Generated via `npm run content:generate` → `public/seo-data/authority-*.json`:

| Page | Route |
| --- | --- |
| How EVs work | `/ownership-guides/how-evs-work` |
| EV charging types explained | `/charging-guides/charging-types` |
| EV maintenance explained | `/ownership-guides/maintenance-basics` |
| EV battery lifespan | `/ownership-guides/battery-lifespan` |
| Fast vs slow charging | `/charging-guides/fast-vs-slow` |
| Public charging guide | `/charging-guides/public-charging` |
| Overnight charging safety | `/charging-guides/overnight-safety` |
| Extension board risks | `/charging-guides/extension-board-risks` |
| Apartment charging setup | `/charging-guides/apartment-setup` |
| Apartment EV suitability | `/ownership-guides/apartment-suitability` |
| City commute ownership | `/ownership-guides/city-commute` |
| Family ownership | `/ownership-guides/family-ownership` |
| First-time buyer guide | `/ownership-guides/first-time-buyers` |

QA: `npm run authority:content-qa` (13/13 files, editorial framework pass).

## Remaining gaps

- Legacy template pages still used for **running cost** (`/ownership-guides/running-cost`) and **home charging** (`/charging-guides/home-charging`) — optional editorial upgrade next.
- **ev_myths** cluster — dedicated myth hub not yet populated.
- Human editorial review of generated copy before marketing push.

## Next steps (human editorial)

1. Draft JSON or discovery content for structured topics (via `content:generate` where applicable).
2. Human review outlines in each topic’s `reviewSections`.
3. Re-run audits until beginner/charging completeness ≥ 70%.
4. Expand compare-support mapping for new manifest compare slugs.
