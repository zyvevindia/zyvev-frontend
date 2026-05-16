# Search Console Operations

Operational guidance for real-world indexing — **no GSC API integration** in this sprint.

**Master playbook:** [search-console-operations.md](./search-console-operations.md)  
**Week 1 cadence:** [week-1-indexing-ops.md](./week-1-indexing-ops.md) · [week-1-indexing-monitor.md](./week-1-indexing-monitor.md) · [live-indexing-checklist.md](./live-indexing-checklist.md)

## Workflows

| Workflow | Doc |
|----------|-----|
| URL inspection | [url-inspection.md](./url-inspection.md) |
| Indexing requests | [indexing-requests.md](./indexing-requests.md) |
| Sitemap refresh | [sitemap-refresh.md](./sitemap-refresh.md) |
| Crawl errors | [crawl-errors.md](./crawl-errors.md) |
| Canonical mismatches | [canonical-mismatches.md](./canonical-mismatches.md) |
| Structured data issues | [structured-data-issues.md](./structured-data-issues.md) |

## Weekly rhythm

1. GSC **Performance** — export top queries/pages (manual CSV)
2. Record observations in `zyvev-backend/ops/traffic-observations.jsonl`
3. `npm run ops:crawl` — crawlable vs indexed gap
4. `npm run ops:seo` — canonical + sitemap freshness

## Related

- [../search-operations/](../search-operations/) — indexing failures, crawl monitoring
- [../market-activation/search-console-readiness.md](../market-activation/search-console-readiness.md)
