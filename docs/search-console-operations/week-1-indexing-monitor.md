# Week 1 Indexing Monitor

Daily 5-minute log for GSC/Bing during controlled launch.  
**Ops cadence:** [week-1-indexing-ops.md](./week-1-indexing-ops.md) · **Checklist:** [live-indexing-checklist.md](./live-indexing-checklist.md)

---

## Baseline (Day 0)

| Source | Indexed pages | Sitemap last read | Notes |
|--------|---------------|-------------------|-------|
| GSC | | | |
| Bing | | | |
| `ops:seo` totalUrls | 52 | — | |

---

## Daily log

| Day | GSC indexed Δ | Crawl errors | Excluded (sample) | Canonical issues | Action |
|-----|---------------|--------------|-------------------|------------------|--------|
| D0 | | | | | |
| D1 | | | | | |
| D2 | | | | | |
| D3 | | | | | |
| D4 | | | | | |
| D5 | | | | | |
| D6 | | | | | |
| D7 | | | | | |

---

## URL inspection priority (rotate)

1. Homepage  
2. `/cars`  
3. Flagship detail (Nexon EV Creative+)  
4. One SEO guide (commute or budget)  
5. `/compare` (hub only)

---

## Internal cross-check (weekly)

```bash
npm run ops:seo
npm run ops:crawl
```

| Check | Pass |
|-------|------|
| Sitemap count = crawlable count | ☐ |
| No `/admin` in indexed sample | ☐ |
| Vehicle canonical = `/cars/:slug` | ☐ |

---

## Week 1 outcome

**Trend:** Improving / Flat / Concerning  

**Blockers for Week 2:**

**Handoff to:** [weekly-indexing-review.md](./weekly-indexing-review.md)
