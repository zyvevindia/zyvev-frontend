# Search Console Operations (Master)

Operational playbook for **Google Search Console** and **Bing Webmaster Tools** — organic discovery only. No aggressive indexing tactics.

---

## Ownership onboarding

### Google Search Console

- [ ] Property: **URL prefix** `https://evsavari.com` (or Domain if DNS verified)
- [ ] Verification: DNS TXT or HTML file (Vercel)
- [ ] Submit user: ops@ / founder account with 2FA
- [ ] Confirm **no** staging URLs in property

### Bing Webmaster Tools

- [ ] Add site `https://evsavari.com`
- [ ] Import from GSC (recommended) or verify separately
- [ ] Submit same sitemap URL

---

## Sitemap submission

| Step | Action |
|------|--------|
| 1 | Confirm `https://evsavari.com/sitemap.xml` returns 200 |
| 2 | GSC → Sitemaps → submit `sitemap.xml` |
| 3 | Bing → Sitemaps → submit same URL |
| 4 | After catalog/SEO deploy: re-submit if URL count changed |

**CLI freshness check:**

```bash
cd zyvev-backend
npm run ops:seo
```

---

## Weekly rhythm

| Day | Task |
|-----|------|
| Daily (Week 1) | Note indexed URL count delta in [week-1-indexing-ops.md](./week-1-indexing-ops.md) |
| Weekly | [weekly-indexing-review.md](./weekly-indexing-review.md) |
| On deploy | [sitemap-refresh.md](./sitemap-refresh.md) |

---

## Indexing anomaly workflow

1. **URL Inspection** (GSC) on affected URL → [url-inspection.md](./url-inspection.md)
2. Check canonical in live HTML vs expected `https://evsavari.com/...`
3. Run `npm run ops:seo` — canonical consistency
4. If `noindex` accidental → fix Helmet/meta → request indexing
5. If excluded by robots → fix `robots.txt` / meta → redeploy
6. Log in [week-1-indexing-observations.md](./week-1-indexing-observations.md)

**Do not:** mass “Request indexing” on every URL daily.

---

## Crawl anomaly workflow

1. GSC → Pages / Crawl stats → spike in 404 or 5xx
2. Cross-check [crawl-errors.md](./crawl-errors.md)
3. Run `npm run ops:crawl` (backend)
4. Fix broken routes → [../runbooks/broken-route-response.md](../runbooks/broken-route-response.md)
5. Verify `Disallow: /*?*` still blocks filter traps

---

## Structured data

- GSC → Enhancements → validate Vehicle / FAQ / Breadcrumb
- Issues → [structured-data-issues.md](./structured-data-issues.md)
- Fix JSON-LD in frontend utils, redeploy, re-inspect

---

## Canonical consistency

- Audit: `npm run ops:seo` → `canonicalConsistency.errors === 0`
- Mismatches → [canonical-mismatches.md](./canonical-mismatches.md)

---

## Crawl simulation assumptions

| Assumption | EVSavari policy |
|------------|-----------------|
| SPA | Prerendered/meta via Helmet; critical URLs must return 200 shell |
| Query strings | Disallowed in robots (`/*?*`) |
| Admin/dealer | Disallowed |
| SEO JSON | `/seo-data/` disallowed (content served via pages) |
| Rate | Organic links only — no ping farms |

---

## Related

- [week-1-indexing-ops.md](./week-1-indexing-ops.md)
- [public-beta-indexing-checklist.md](./public-beta-indexing-checklist.md)
- [indexing-diagnostics-runbook.md](./indexing-diagnostics-runbook.md)
