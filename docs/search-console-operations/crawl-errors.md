# Crawl-Error Response Workflow

## Triage

1. GSC → **Pages** / **Indexing** → filter errors
2. `npm run ops:crawl` — orphan routes, canonical errors
3. Classify error type

## Response matrix

| GSC signal | Action |
|------------|--------|
| 404 | Routing/slug audit; [broken-route runbook](../runbooks/broken-route-response.md) |
| Soft 404 | Verify slug + static SEO JSON; strengthen internal links |
| Blocked by robots | Check robots.txt; should not block `/cars/*` |
| Redirect error | Fix `/car/` → `/cars/` redirect |
| Server error (5xx) | Hosting/API incident — rollback if deploy-related |
| Duplicate canonical | [canonical-mismatches.md](./canonical-mismatches.md) |

## Documentation

Log: URL, error type, fix deployed (Y/N), re-check date.

## Escalation

Indexed pages drop &gt; 20% WoW → pause SEO publishes; run `validate:real-world`.
