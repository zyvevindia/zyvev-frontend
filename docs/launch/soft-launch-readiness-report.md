# Soft launch readiness report — EVSavari

**Report date:** 2026-05-20  
**Target:** Controlled soft launch (Alpha Stable → Soft Launch Ready)  
**Production site:** https://evsavari.com  
**API:** https://evsavari-api.onrender.com  

---

## Executive recommendation

**Recommendation: PROCEED with controlled soft launch** after:

1. Vercel Production env verification (`VITE_API_URL`, `VITE_CLOUDINARY_CLOUD_NAME`)
2. Post-deploy smoke (`npm run deploy:smoke`)
3. Manual completion of `/admin/launch-checklist` (homepage, compare, leads, mobile)

Blockers are **catalog/media completeness** for non-manifest tier-1 EVs (placeholders acceptable short-term), not frontend stability.

---

## Completed systems

| Area | Status | Evidence |
|------|--------|----------|
| API reliability UX | Done | `safeFetchJsonWithRetry`, cold-start copy, deduped `[EVSavari API]` logs |
| CDN bypass | Done | `cdn.evsavari.com` blocked/rewritten to Cloudinary |
| Homepage dual-error | Done | `sectionHasContent()` — no “Unable to load” + “No EVs” together |
| Compare stability | Done | Hook order fix, `CompareVehicleCard`, mobile CSS |
| Admin ops visibility | Done | `/admin/system-status`, `/admin/media-health`, `/admin/catalog-health`, `/admin/launch-checklist` |
| Core utilities | Done | `src/utils/systemStatus.js`, `src/utils/buildMetadata.js` |
| Build metadata | Done | Commit, timestamp, release version on system status |
| Compare credibility UI | Done | Score insight tooltip, confidence chip, deduped pills |
| Trust layer (subtle) | Done | `TrustDataStrip` on detail + compare |
| Performance diagnostics | Done | Slow route/API warnings, image fallback metrics |
| SEO pipeline | Done | `seo:foundation`, `seo:qa`, `gsc:verify` pass in CI |
| Governance docs | Done | `media-governance.md`, `data-quality-roadmap.md`, tier-1 audits |

---

## Remaining risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Render API cold start | Medium | Retry + yellow health state; user copy |
| `VITE_API_URL` mis-set to localhost | High | `/admin/system-status` red flag; redeploy |
| Tier-1 media gaps (7/13 families) | Medium | Placeholders; prioritize tiago, atto-3, kona |
| API DB legacy CDN URLs | Low | Frontend rewrite; backend purge |
| Manual QA not signed off | Medium | `/admin/launch-checklist` |

---

## Known limitations

- Compare scores are **directional** when `confidence` is low or data unreviewed.
- `npm run media:audit` CLI fails outside Vite (pre-existing); use `/admin/media-health` instead.
- Admin lead tools still use raw `fetch` (internal only).
- Behavioral analytics requires backend flag + `VITE_BEHAVIORAL_INTELLIGENCE=true`.

---

## Media gaps

- **Manifest coverage:** 46% of tier-1 family slugs (6/13).
- **Fully ready:** Tata Nexon/Punch/Curvv, MG Comet/ZS, Mahindra BE.6.
- **Placeholder expected:** Tiago EV, BYD Atto 3, Hyundai Kona, XEV 9e, XUV400.

See `docs/operations/tier1-media-status.md`.

---

## API risks

- Probe latency >3.5s → yellow health (cold start or load).
- Probe failure → red; compare/home show retry UI.
- Views/leads use safe fetch; views are fire-and-forget (no console spam).

---

## Compare readiness

| Check | Status |
|-------|--------|
| 2-EV / 3-EV hub | Ready |
| Compare SEO pages | Ready (partial catalog retry) |
| Score + pills UI | Ready |
| Contradiction guard | `auditCompareSetCredibility` utility (ops) |
| Mobile layout | CSS verified in code review |

---

## SEO readiness

| Check | Status |
|-------|--------|
| Sitemaps | Generated at build |
| robots.txt | Present |
| Canonical / discovery | QA scripts pass |
| Schema | Compare hub JSON-LD |

---

## Catalog health (expected at audit)

Run `/admin/catalog-health` against production API for live READY/PARTIAL/NEEDS_REVIEW counts. Tier-1 filter isolates OEM scope.

---

## Mobile readiness

- Compare mobile CSS (column stack, score gauge) — prior sprint, unchanged.
- Manual sign-off via `/admin/launch-checklist` → Mobile QA section.
- No new layout regressions introduced in this hardening sprint.

---

## Verification checklist

```bash
npm run build
npm run seo:foundation
npm run seo:qa
npm run gsc:verify
npm run post-launch:smoke
EVSAVARI_SITE_ORIGIN=https://evsavari.com EVSAVARI_API_URL=https://evsavari-api.onrender.com npm run deploy:smoke
```

**Browser:** `/admin/system-status` → green API · `/compare/comet-ev-vs-tiago-ev` · one detail page · DevTools console clean on buyer paths.

---

## Sign-off

| Role | Item |
|------|------|
| Engineering | Build + smoke green |
| Ops | Launch checklist complete |
| Content | Tier-1 media P1 backlog scheduled |
