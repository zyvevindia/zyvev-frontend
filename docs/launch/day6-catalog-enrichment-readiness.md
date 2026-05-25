# Day 6 — Catalog enrichment readiness

## Phase status

Platform foundation is operational. Day 6 focuses on **enrichment and trust activation**, not architecture changes.

## Checklist

- [ ] `npm run catalog:completeness` — review top gaps per OEM
- [ ] `npm run media:completeness` — upload + verify optional roles
- [ ] `npm run compare:quality-audit` — pairs NEEDS_REVIEW = 0 for tier-1 launch pairs
- [ ] `npm run production:qa` — pass
- [ ] `npm run authority:audit` — weak clusters documented
- [ ] Manual: homepage, compare, detail sticky nav, mobile filters

## Targets (tier-1)

| Area | Target |
| --- | --- |
| Core media (hero/listing/compare) | 100% Cloudinary, no placeholder |
| Optional media | Verified before runtime request |
| Safety | No fabricated NCAP; verified only in UI |
| Compare copy | Beginner-readable explanations |

## Reports directory

- `reports/catalog-audit/`
- `reports/media-audit/`
- `reports/compare-quality/`
- `reports/production-qa/`
- `reports/authority-audit/`

## Non-goals

- No compare engine rewrite
- No scoring architecture change
- No new admin dashboard sprawl
