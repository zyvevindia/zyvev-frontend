# Indexing monitoring checklist

Weekly rhythm for EVSavari public-beta SEO scale. **No GSC API in-repo** — manual GSC + automated repo checks.

---

## Daily (5 min)

- [ ] GSC → **Pages** → Indexed vs Not indexed — note delta vs yesterday
- [ ] GSC → **Sitemaps** → Last read date for `sitemap.xml` — status **Success**
- [ ] Spot-check one new discovery URL (URL Inspection → Live test → Indexed?)
- [ ] If deploy landed: `npm run gsc:verify` in CI or locally before marking deploy done

## Weekly (30 min)

### Coverage

- [ ] **Pages** export — count indexed discovery URLs (`/guides`, `/best-evs/`, `/cities/`, `/compare/`, `/ownership-guides/`, `/charging-guides/`)
- [ ] **Not indexed** — categorize reasons: Crawled – currently not indexed, Duplicate, Alternate canonical, Soft 404
- [ ] Compare indexed count to `public/sitemap-manifest.json` → `discovery` count (should be within ~10% over time)

### Performance (optional CSV export)

- [ ] Top 10 queries by impressions
- [ ] Top 10 pages by clicks
- [ ] Map rising queries to content gaps (new city page? new compare?)

### Crawl health

- [ ] **Settings** → Crawl stats — no spike in 5xx
- [ ] **Page indexing** → Server error (5xx) = 0 for site
- [ ] robots.txt tester in GSC matches live file

### Canonical & duplicates

- [ ] **Pages** → Alternate page with proper canonical tag — review samples; legacy `/cars/` guides should point to discovery
- [ ] Run `npm run seo:qa` after any content batch
- [ ] See [canonical-mismatches.md](./canonical-mismatches.md) if GSC reports conflicts

### Sitemap freshness

- [ ] `lastmod` on child sitemaps updated after `npm run build:sitemaps`
- [ ] Resubmit sitemap in GSC only after **material** URL additions (25+ URLs or structural change)
- [ ] Document submit date in ops log

## Monthly

- [ ] Full URL sample: 5 cities × 2 (evs + charging), 10 compares, 5 ownership, 5 best-evs
- [ ] Review `Disallow` rules still match product (new admin routes?)
- [ ] Re-read [search-console-checklist.md](./search-console-checklist.md) after major routing changes

---

## Escalation triggers

| Signal | Action |
|--------|--------|
| Indexed count drops >15% WoW | [seo-issue-response.md](../runbooks/seo-issue-response.md) |
| Sitemap “Couldn’t fetch” | Verify `public/sitemap.xml` on CDN; [sitemap-rebuild.md](../runbooks/sitemap-rebuild.md) |
| Mass “Duplicate without user-selected canonical” | Audit `legacyCanonicalMap` + Helmet canonicals |
| Compare query URLs indexed | Verify robots `Disallow: /compare?` and fix internal links |

---

## Repo commands

```bash
npm run gsc:verify      # robots + sitemap + canonical pre-flight
npm run seo:qa          # duplicate titles, canonicals, FAQs
npm run build:sitemaps  # regenerate sitemaps + robots
```

---

## Related

- [search-console-checklist.md](./search-console-checklist.md)
- [weekly-indexing-review.md](./weekly-indexing-review.md)
- [live-indexing-monitor.md](./live-indexing-monitor.md)
