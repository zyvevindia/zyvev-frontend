# EVSavari Lite v1.0 — Release Notes

**Release:** EVSavari Lite v1.0  
**Date:** 2026-07-10  
**Production URL:** https://evsavari.com  
**Status:** Production Ready (Sprint 1.6 certified)

---

## Overview

EVSavari Lite v1.0 is India's focused electric vehicle marketplace — a clean public product for discovering, comparing, and enquiring about EVs, built on a full platform architecture preserved for future expansion.

This release completes **Sprint 1 (Foundation & Certification)**. No Sprint 2+ work is included.

---

## Sprint 1 Accomplishments

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **1.1** | Lead production stabilization | Lead flows, validation, duplicate suppression certified |
| **1.2** | Media stabilization | Single local-first media resolver; all production EVs imaged |
| **1.3** | User journey certification | Primary journeys + CTAs verified on production |
| **1.4** | Lite product boundary | Public nav simplified; platform hidden, not deleted |
| **1.5** | UX stabilization | A11y, responsive layout, loading UX, console cleanliness |
| **1.6** | Release readiness gate | Full production certification — **PASS** |

### Key commits (Sprint 1)

| Sprint | Commit | Description |
|--------|--------|-------------|
| 1.1 | `f65181e2` | Lead/Turnstile production fixes |
| 1.2 | `eb464d89`, `79e16d6f` | Media resolver certification |
| 1.3 | `525746b3`, `d8b5905b` | Journey certification |
| 1.4 | `32b498ab`, `537cb8bd` | EVSavari Lite boundary |
| 1.5 | `0979185e`, `8562db5f` | UX stabilization |
| 1.6 | _certification harness commit_ | Release readiness certification (PASS) |

---

## Features Available (Public — EVSavari Lite)

- **Homepage** — EV marketplace entry point
- **Browse EVs** — Full catalog with filters
- **Search** — Catalog search (`/cars#catalog-search`)
- **Compare** — Side-by-side EV comparison
- **Car Details** — Vehicle pages with intelligence, variants, reviews
- **Guides** — EV buying guides hub (`/guides`)
- **EV Intelligence** — Discovery pages (`/discover/*`, `/best-evs/*`, city/brand guides)
- **EMI Calculator** — Contextual from car details (`/tools/emi`)
- **Ownership Calculators** — TCO, cost-per-km, petrol savings (contextual)
- **Get Best Deal** — Lead form CTA
- **Request Callback** — Lead form CTA
- **Dealer Assistance** — Lead form CTA

### Public navigation

Home · Browse EVs · Compare · Guides · Search

---

## Hidden Platform Capabilities (Preserved)

The following remain in the codebase and are accessible via direct URL / authentication — **not shown in public navigation**:

- Admin (`/admin/*`)
- CRM / Sales Dashboard (`/sales`, `/sales-analytics`)
- Dealer Portal (`/dealer/*`)
- AI Modules (`/assistant`, playgrounds — redirect to browse)
- Editorial Platform
- Analytics modules
- Marketplace automation tooling
- Experimental features

**Architecture principle:** Hide, do not delete. Future sprints build on this foundation.

---

## Architecture Summary

| Layer | Responsibility |
|-------|----------------|
| **Routing** | Single `App.jsx` lazy-route table |
| **Catalog** | Single catalog service + generated dossiers |
| **Media** | Single `vehicleMedia` resolver (local-first) |
| **Leads** | Single `leadSubmitApi` + backend `/leads` |
| **Lite boundary** | `evsavariLite.js` + `LiteHiddenRedirect` |
| **Component ownership** | Shared components own UX patterns |

No architectural redesign required for planned Sprint 2–5 roadmap.

---

## Production URLs

| Surface | URL |
|---------|-----|
| Homepage | https://evsavari.com/ |
| Browse | https://evsavari.com/cars |
| Compare | https://evsavari.com/compare |
| Guides | https://evsavari.com/guides |
| API | https://evsavari-api.onrender.com |
| Sitemap | https://evsavari.com/sitemap.xml |
| Robots | https://evsavari.com/robots.txt |

---

## Known Non-Blocking Issues

- Minor background color drift between some Lite pages (`#f5f7fb` vs `#f8fafc`)
- Compare empty state has no `<h1>` (uses `<h2>`) — acceptable for empty hub
- Full lead modal focus trap (roving tabindex) deferred — Escape + scroll lock shipped
- Rate limiting may not trigger 429 in low-volume test bursts
- Admin lead visibility requires authenticated session (operational manual check)

---

## Operational Notes

- **Deploy:** Vercel (frontend), push to `main` triggers production deploy
- **Rollback:** See `docs/deploy/rollback-and-recovery.md`
- **Env:** See `docs/deploy/production-env-checklist.md`
- **Certification:** `npm run release:certify:sprint16`
- **Build:** `npm run build` (includes content generation + sitemaps)

---

## Future Roadmap (Post v1.0 — Not in This Release)

| Sprint | Scope |
|--------|-------|
| Sprint 2 | SEO expansion |
| Sprint 3 | Content Engine |
| Sprint 4 | Dealer Onboarding |
| Sprint 5 | OTP Verification |
| Future | Dealer AI, OEM AI, Marketplace, CRM expansion, Mobile Apps, Public APIs |

**Stop gate:** Sprint 2+ work requires formal approval after Sprint 1.6 sign-off.

---

## Certification

Run: `npm run release:certify:sprint16`

Reports:
- `docs/releases/sprint-16-release-readiness.md` — **PASS** (2026-07-10)
- `docs/releases/sprint-16-architecture-future-readiness.md`
- `docs/releases/sprint-16-launch-readiness-checklist.json`
- `docs/releases/EVSavari-Lite-v1.0-Release-Notes.md` (this document)

**Final Verdict: PASS — EVSavari Lite v1.0 is Production Ready.**
