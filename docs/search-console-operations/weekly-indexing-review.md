# Weekly Indexing Review Workflow

**Cadence:** Weekly (Monday recommended)  
**Owner:** Ops / editorial lead  
**No automated indexing requests** — human judgment only.

## 1. Automated pre-check

```bash
cd zyvev-backend
npm run ops:seo
npm run ops:search-console
```

Record: crawlable URL count, canonical errors, sitemap age, orphan count.

## 2. Google Search Console

| Check | Action |
|-------|--------|
| Pages indexed | Note delta vs prior week |
| Not indexed | Sample 3 URLs — fix canonical/robots if erroneous |
| Excluded (duplicate) | Confirm canonical target is correct |
| Crawl stats | Spike errors → run `audit-crawl-simulation` |
| Sitemaps | Last read date < 7 days after deploy? |
| Enhancements | Vehicle / FAQ structured data warnings |

## 3. Bing Webmaster

- Sitemap status
- URL inspection on homepage + one SEO guide

## 4. Internal cross-check

- New SEO slugs in registry match `public/seo-data/` and sitemap
- No `/seo-data/` URLs accidentally indexed (blocked in robots)
- Compare + `/cars` listing remain intentional orphans in ops report

## 5. Log template

```text
Week of YYYY-MM-DD:
- Indexed estimate: 
- New exclusions: 
- Canonical fixes: 
- Sitemap resubmitted: yes/no
- Follow-up URLs for inspection: 
```

## Escalation

See [indexing-diagnostics-runbook.md](./indexing-diagnostics-runbook.md).
