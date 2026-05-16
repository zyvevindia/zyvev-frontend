# Search Console — initial indexing priorities (EVSavari)

**Phase:** post-sitemap submit, controlled exposure.  
**No GSC API** — manual URL Inspection / indexing requests per [search-console-operations](../search-console-operations/).

## Priority set (this block)

| Priority | URL path | Rationale |
|----------|-----------|-------------|
| P1 | `https://evsavari.com/cars/best-evs-for-city-driving` | High-intent discovery + internal hub to vehicles |
| P2 | `https://evsavari.com/cars/best-evs-for-first-time-buyers` | Funnel alignment with Tier-1 “first EV” positioning |
| P3 | `https://evsavari.com/cars/nexon-ev-vs-mg-zs-ev` | Head-to-head demand; static JSON present (`public/seo-data/nexon-ev-vs-mg-zs-ev.json`) |

## Preconditions (run before requesting indexing)

```bash
cd zyvev-backend
npm run validate:production
npm run ops:seo
```

- Canonical errors must be **0** (current: ok).
- Confirm `public/seo-data/{slug}.json` exists for soft-launch static path.

## GSC steps (per URL)

1. URL Inspection → Live test.
2. If “URL is not on Google” after sitemap crawl window, use **Request indexing** (sparingly).
3. Log date + outcome in `zyvev-backend/ops/traffic-observations.jsonl` (see traffic-learning foundation).

## Weekly follow-up

- Performance export for these three slugs (impressions, CTR, avg position).
- If **Discovered, not crawled** — add internal links from `/cars` and related guides.

## Related docs

- [../search-console-operations/README.md](../search-console-operations/README.md)
- [../search-operations/README.md](../search-operations/README.md)
