# Crawl Monitoring Guidance

## Weekly checklist

- [ ] GSC Coverage / Pages: indexed count trend
- [ ] GSC Crawl stats: 404 rate stable
- [ ] `report-seo-operations.js`: orphans, canonical errors, sitemap age
- [ ] `audit-crawl-simulation.js`: no new unreachable Tier-1 URLs
- [ ] Spot-check 3 URLs via URL inspection

## robots.txt expectations

Allowed for indexing:

- `/`, `/cars`, `/cars/{slug}`, `/compare`, static assets needed for render

Disallowed:

- `/admin`, `/sales`, `/dealer`, `/*?*`, `/car/`, `/seo-data/`

## Orphan pages

Orphans = Tier-1 or SEO URLs not reachable via simulated internal crawl from hub pages.

**Response:**

1. Add link from `/cars` listing, SEO guide cross-links, or compare hub.
2. Re-run crawl simulation until orphan count acceptable.

## External signals (manual)

Record weekly in ops notes (see traffic-learning foundation):

- Top queries (GSC Performance)
- CTR changes on key SEO guides
- Impressions for new vehicle pages

No automated GSC API in this sprint — export CSV from GSC when needed.

## Alerts (informal)

Escalate if:

- Indexed pages drop &gt; 20% week-over-week
- Sitemap fetch fails 2+ days
- Canonical errors &gt; 0 in pre-deploy audit
- Spike in 404 for `/cars/*` after deploy
