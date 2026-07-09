# Sprint 1.5 — UX Stabilization & Production Quality

**Sprint:** 1.5  
**Objective:** Production-quality UX polish for EVSavari Lite without changing product scope or architecture.

---

## UX Audit (Issues Found)

### Critical

| Issue | Severity | Status |
|-------|----------|--------|
| Duplicate `<h1>` — Navbar logo + page heroes broke heading hierarchy | Critical | **Fixed** |

### Major

| Issue | Severity | Status |
|-------|----------|--------|
| Nested `<button>` inside `<Link>` on catalog cards | Major | **Fixed** |
| Lead form labels not associated with inputs (`htmlFor`/`id`) | Major | **Fixed** |
| Lead modal missing Escape-to-close and body scroll lock | Major | **Fixed** |
| Compare URL prefetch — unhandled rejection + empty state flash | Major | **Fixed** |
| Heavy full-page route loader on lazy navigation | Major | **Fixed** |
| Car details tab bar negative margin caused edge clipping | Major | **Fixed** |
| Listing compare FAB ignored safe-area insets | Major | **Fixed** |
| Home “View All” used `<a href>` (full reload) | Major | **Fixed** |
| Home sort `<select>` missing accessible name | Major | **Fixed** |
| Missing `:focus-visible` on public controls (cards, footer, lead fields, sticky bar) | Major | **Fixed** |
| Navbar mobile menu — no Escape-to-close | Major | **Fixed** |

### Minor (documented, deferred)

| Issue | Severity | Status |
|-------|----------|--------|
| Background color drift across pages (`#f5f7fb` vs `#f8fafc`) | Minor | Deferred — cosmetic, no functional impact |
| Catalog grid uneven right gutter on partial rows | Minor | Deferred |
| Lead modal focus trap (full roving tabindex) | Minor | Deferred — Escape + scroll lock shipped |
| Variant table horizontal scroll hint on mobile | Minor | Deferred |

---

## Fix Summary

| Fix | Root cause | Files | Why this location |
|-----|------------|-------|-------------------|
| Navbar brand uses `<p>` not `<h1>` | Site chrome competed with page `<h1>` | `Navbar.jsx` | Navbar owns global chrome heading |
| Card CTAs are styled `Link` elements | Invalid nested interactive elements | `CarCard.jsx`, `CompactCarCard.jsx`, `UpcomingCarCard.jsx` | Cards own CTA pattern |
| Lead label/input association + modal UX | Missing `htmlFor`/`id`; no keyboard dismiss | `LeadInquiryModal.jsx` | Modal owns form a11y |
| Compare prefetch loading + `.catch()` | Best-effort fetch surfaced empty state / rejection | `ComparePage.jsx` | Compare page owns URL hydration |
| Lightweight route loader | Full-page card replaced entire content shell | `App.jsx`, `catalog-listing-a11y.css` | App owns Suspense fallback |
| Tab bar clipping | Negative margin on sticky tabs | `car-details.css` | Car details CSS owns tab layout |
| Compare FAB safe-area | Fixed `bottom/right` ignored notched devices | `ListingPage.jsx` | Listing owns floating CTA |
| Home View All SPA navigation | Raw anchor bypassed router | `HomeSection.jsx` | Section component owns link |
| Home sort aria-label | Unlabeled `<select>` | `Home.jsx` | Home owns filter toolbar |
| Shared `:focus-visible` styles | Inconsistent keyboard focus across Lite | `catalog-listing-a11y.css`, `sticky-bottom-action-bar.css`, `Footer.jsx` | Single public a11y stylesheet |
| Navbar Escape closes menu | Mobile menu trapped keyboard users | `Navbar.jsx` | Navbar owns mobile menu |

---

## Architecture Impact Assessment

| Area | Impact |
|------|--------|
| Frontend | **Minor** — UX/a11y polish in owning components only |
| Backend | **None** |
| Database | **None** |
| APIs | **None** |
| Routing | **None** |
| Catalog | **None** |
| Media | **None** |
| Leads | **None** — validation/submit logic unchanged |
| Future Compatibility | **Confirmed** — platform modules untouched |
| Regression Risk | **Low** |

---

## Files Changed

- `src/components/Navbar.jsx`
- `src/components/CarCard.jsx`
- `src/components/CompactCarCard.jsx`
- `src/components/UpcomingCarCard.jsx`
- `src/components/HomeSection.jsx`
- `src/components/LeadInquiryModal.jsx`
- `src/components/Footer.jsx`
- `src/pages/Home.jsx`
- `src/pages/ComparePage.jsx`
- `src/pages/ListingPage.jsx`
- `src/App.jsx`
- `src/styles/catalog-listing-a11y.css`
- `src/styles/car-details.css`
- `src/components/car/sticky-bottom-action-bar.css`
- `scripts/sprint-15-ux-production-certification.mjs`
- `package.json`

---

## Production Certification

```bash
npm run ux:certify:sprint15
```

Report: `docs/releases/sprint-15-ux-certification.md`

---

## Final Verdict

**PASS** — Production verified 2026-07-09 (`npm run ux:certify:sprint15`)

- Code commit: `0979185e`
- Lite pages: no horizontal overflow, no duplicate h1
- Lead form labels associated; modal Escape + scroll lock
- Sprint 1.4 Lite boundary regression: PASS
- Console clean on all Lite page sweeps

Certification report: `docs/releases/sprint-15-ux-certification.md`
