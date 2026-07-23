# ADR — Sprint 2.6 SEO Optimization (No New Architecture)

## Status
Accepted — 2026-07-13

## Context
Sprint 2.1–2.5 established metadata, schema, landing framework, and internal link graph engines. Sprint 2.6 is a **quality sprint** — improve titles, editorial content, FAQs, headings, schema hygiene, content blocks, and anchor text without introducing parallel systems.

## Decision
**Do not** introduce new SEO components, schema generators, landing renderers, or page-specific link modules.

All optimizations extend existing config and section components only:

| Layer | Existing system | Sprint 2.6 change |
|-------|-----------------|-------------------|
| Metadata | `pageMetadata` → `meta.js` → `SeoHead` | Year-aware titles, improved descriptions |
| Landing SEO | `buildLandingPageMeta` | Enriched registry `seo` fields |
| Schema | `landingSchema.js` | `includeItemList: false` when CollectionPage embeds list |
| Content | Registry configs | `buyingAdvice`, intro arrays, FAQ overrides |
| Sections | `BuyingGuideSection` | Renders structured editorial from config |
| AI blocks | `data-content-block` | hero → intro → vehicleGrid → buyingGuide → faq → relatedPages → cta |

## Why no new architecture
- One metadata engine prevents canonical/title drift
- One schema engine prevents conflicting structured data
- One landing framework keeps future page types as config-only additions
- Content blocks expose structured identifiers for future AI without scraping HTML

## Verification
`npm run landing:certify:sprint26` — production deployment `dpl_DFXoZ7SXChr3uunRc2kVS6Hf6eZt`
