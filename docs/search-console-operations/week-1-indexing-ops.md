# Week 1 Indexing Operations

**Period:** Days 0–7 after production deploy  
**Goal:** Establish baseline indexing health without aggressive tactics.

---

## Day 0 (deploy day)

| Task | Done |
|------|------|
| Verify `sitemap.xml` live | ☐ |
| Submit sitemap in GSC | ☐ |
| Submit sitemap in Bing | ☐ |
| URL inspect: `/`, `/cars`, 1 detail, 1 SEO guide | ☐ |
| Record baseline indexed count | ☐ |

**Baseline indexed (GSC):** ______  
**Baseline indexed (Bing):** ______

---

## Daily log (5 min)

| Day | Indexed Δ | Crawl errors | Canonical issues | Notes |
|-----|-----------|--------------|------------------|-------|
| D0 | | | | |
| D1 | | | | |
| D2 | | | | |
| D3 | | | | |
| D4 | | | | |
| D5 | | | | |
| D6 | | | | |
| D7 | | | | |

---

## URL priority for inspection

1. `https://evsavari.com/`
2. `https://evsavari.com/cars`
3. Top flagship detail (e.g. Nexon EV Creative+)
4. One SEO guide (e.g. best-evs-for-daily-commute)
5. One compare landing if indexed

---

## Excluded pages (expected)

| Pattern | Reason |
|---------|--------|
| `/admin/*` | robots disallow |
| `/dealer/*` | robots disallow |
| `/compare?*` | query disallow |
| `/seo-data/*` | internal JSON |

---

## Anomaly escalation

| Symptom | Action |
|---------|--------|
| Sudden drop in indexed | Check deploy + canonical regressions |
| Spike in 404 | Run broken-route runbook |
| “Duplicate without user-selected canonical” | canonical-mismatches.md |
| Rich result errors | structured-data-issues.md |

---

## Week 1 close-out

- [ ] Indexed count trend documented
- [ ] No accidental `noindex` on money pages
- [ ] Sitemap URL count matches `ops:seo` crawlable count
- [ ] Handoff notes in [week-1-indexing-observations.md](./week-1-indexing-observations.md)

**Week 2:** switch to [weekly-indexing-review.md](./weekly-indexing-review.md) cadence.
