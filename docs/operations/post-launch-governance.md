# Post-launch governance — EVSavari

**Effective:** After controlled soft launch  
**Principle:** Observable, trustworthy, continuously improving — **no speculative AI automation** in ops loops.

---

## Operational review cadence

| Cadence | Dashboards | Owner action |
|---------|------------|--------------|
| **Daily** | `/admin/soft-launch-monitor`, `/admin/system-status` | API green/yellow; note incidents |
| **Weekly** | `/admin/user-insights`, `/admin/compare-quality`, `/admin/feedback-learning` | Editorial + compare calibration |
| **Bi-weekly** | `/admin/catalog-freshness`, `/admin/media-health` | OEM/data refresh queue |
| **Monthly** | `/admin/seo-opportunities`, GSC (external) | Indexing + internal links |

---

## Catalog freshness policy

- **Verified** pricing/specs: refresh within **90 days** for tier-1 families.
- **Stale states** (`potentially_stale`, `needs_review`): block “EVSavari Verified” badges until reviewed.
- High-traffic + stale rows surface in **Catalog freshness** and **Real usage learning**.
- Price changes require `priceLastUpdated` metadata when available.

---

## Compare calibration workflow

1. Run **`/admin/compare-quality`** after traffic week closes.
2. Triage **NEEDS_REVIEW** pairs first (duplicate pills, low confidence, high bounce).
3. Cross-check **`/admin/user-insights`** abandon hotspots.
4. Adjust editorial compare copy / trust rows — **do not** tweak scoring engine constants without documented rationale.
5. Status targets: ≥70% pairs **STRONG** or **ACCEPTABLE** for tier-1 flagship URLs.

---

## Trust review workflow

- Low confidence scores must show **“Directional estimate”** and estimated-field notes on compare.
- Never present single-point range as guaranteed km.
- Trust strip on detail/compare: verified date, confidence, OEM vs estimated.
- User feedback `charging_range_trust` or `incorrect_ev_data` → priority queue in **Feedback learning**.

---

## SEO governance

- Registry ↔ sitemap drift: fix in `content:generate` + `build:sitemaps`, redeploy.
- **SEO opportunities** queue: orphans = P0 before scaling ads/PR.
- Weak engagement discovery pages: add internal links from hub + related guides.
- Compare XML URLs must match live catalog slugs.

---

## Media governance

- Tier-1 families require Cloudinary hero + compare + listing (see `tier1-media-status.md`).
- Image fallback metrics in **Soft launch monitor** — spike → media ops same day.
- No `cdn.evsavari.com` in API or srcset.

---

## Release discipline

- Production deploy only after `npm run build` + `npm run post-launch:smoke`.
- `VITE_API_URL` verified on **System status** post-deploy.
- No compare-engine or routing refactors during observability sprints unless P0 incident.

---

## Feedback loops

| Source | Storage | Dashboard |
|--------|---------|-----------|
| Report issue / usefulness | localStorage + optional API | `/admin/feedback-learning` |
| Usage learning events | `evsavari-usage-learning-v1` | Real usage learning |
| Perf / API / images | `evsavari-post-launch-metrics-v1` | Soft launch monitor, Performance learning |

Clusters: UX, trust, catalog, compare, media, leads — priority score from taxonomy weights.

---

## Metrics buffer (client)

- Slow API (&gt;5s), slow route paint (&gt;2.8s), image fallbacks, cold-start probes.
- **24h rolling** interpretation only — not a substitute for server APM.
- Future: wire GA4 + Render logs; keep deterministic admin scoring.

---

## Escalation

| Signal | Action |
|--------|--------|
| Monitor **red** | Pause marketing; check Render API + Vercel env |
| Compare quality &gt;30% NEEDS_REVIEW | Compare editorial sprint |
| Freshness high-risk &gt;10 tier-1 | Catalog/OEM update sprint |
| Feedback high-severity &gt;3/week | Trust + data quality review |

---

## Related docs

- `docs/launch/soft-launch-readiness-report.md`
- `docs/operations/tier1-media-status.md`
- `docs/architecture/catalog/media-governance.md`
- `docs/architecture/catalog/data-quality-roadmap.md`
