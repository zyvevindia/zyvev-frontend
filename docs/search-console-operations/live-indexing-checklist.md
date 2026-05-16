# Live Indexing Checklist

**When:** Day 0 after deploy + Day 3 + Day 7  
**Master playbook:** [search-console-operations.md](./search-console-operations.md)

---

## Day 0 — Onboarding

### Google Search Console

- [ ] Add property `https://evsavari.com`
- [ ] Verify (DNS or HTML)
- [ ] Submit `https://evsavari.com/sitemap.xml`
- [ ] URL inspect: `/`, `/cars`, 1 detail, 1 SEO guide
- [ ] Record baseline **indexed** count: ______

### Bing Webmaster

- [ ] Add site / import from GSC
- [ ] Submit same sitemap URL
- [ ] Baseline indexed: ______

---

## Pre-submit validation (local)

```bash
cd zyvev-backend
npm run ops:seo
npm run ops:search-console
```

| Check | Expected |
|-------|----------|
| Sitemap freshness | ok |
| Canonical errors | 0 |
| Crawlable URLs | ~52 |
| robots.txt | Allow `/`, disallow admin/dealer/`/*?*` |

---

## Crawl policy assumptions

| Path | Policy |
|------|--------|
| `/cars/:slug` | Index — canonical vehicle URLs |
| SEO guides | Index — static/API-backed pages |
| `/compare` | Index hub; `?cars=` disallowed via robots |
| `/admin`, `/dealer`, `/login` | Disallow |
| `/seo-data/` | Disallow (JSON backing store) |

---

## Structured data

- [ ] GSC Enhancements — no critical Vehicle/FAQ errors on inspected URLs
- [ ] Fix via frontend JSON-LD builders if errors appear

---

## Day 3 / Day 7

- [ ] Update [week-1-indexing-monitor.md](./week-1-indexing-monitor.md)
- [ ] Sample 3 “not indexed” URLs — document reason
- [ ] No mass “Request indexing” spam

---

## Anomaly → workflow

| Issue | Doc |
|-------|-----|
| Crawl errors | [crawl-errors.md](./crawl-errors.md) |
| Canonical mismatch | [canonical-mismatches.md](./canonical-mismatches.md) |
| Sitemap stale | [sitemap-refresh.md](./sitemap-refresh.md) |
