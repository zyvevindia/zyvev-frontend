# EVSavari UX Sprint 1 — Wave C Implementation

Generated: 2026-06-08  
Build: `npm run build` — **passed**  
Platform agents / Score Engine core: **not modified** (read-only `scoreVehicle` consumption)

---

## Recommendation

**READY_FOR_WAVE_D**

All five Wave C issues shipped. Compare is now score-first on mobile and desktop, with rival prefill on detail pages and crawlable compare pair links. Accessibility pass applied to compare hero actions, rival chips, and focus states — no visual redesign.

---

## Summary

| Issue | Status |
|-------|--------|
| 1 — Mobile compare cards | ✅ Done |
| 2 — Score above fold | ✅ Done |
| 3 — Rival compare prefill | ✅ Done |
| 4 — Compare internal linking | ✅ Done |
| 5 — Accessibility polish | ✅ Done |

---

## Issue 1 — Mobile compare cards

**Problem:** Spec table forced horizontal scroll on phones (`min-width: 640px`).

**Files changed**

- `src/components/compare/CompareMobileSpecCards.jsx` *(new)*
- `src/components/compare/CompareHeroExperience.jsx`
- `src/utils/compareScoreBadges.js` — `buildAllCompareBadges()` for multi-badge winners
- `src/styles/compare-page.css`

**Before**

- Mobile users scrolled a wide spec matrix with a “Swipe horizontally on mobile” hint.
- Score badges showed only one winner badge per vehicle.

**After**

- Below 768px: horizontal swipe cards (`scroll-snap`) per vehicle showing score + grade, all earned badges (Recommended, Best Value, Long Range, Fast Charging), price, battery, range, and charging.
- Card width tuned for 320 / 375 / 390px viewports (`min(88vw, 320px)`).
- Desktop spec table unchanged and hidden on mobile via `.compare-spec--desktop`.

**Screens tested (logic / CSS breakpoints)**

- 320px, 375px, 390px — mobile card track + single-column vehicle grid
- 768px — breakpoint switch (cards on, table off)
- 960px+ — desktop table only

---

## Issue 2 — Score above fold

**Problem:** `CompareScoreComparison` lived in lazy below-fold sections, below the spec table.

**Files changed**

- `src/components/compare/CompareScoreStory.jsx` *(new)*
- `src/components/compare/compare-score-story.css` *(new)*
- `src/components/compare/CompareScoreComparison.jsx` — `compact` + custom title
- `src/components/compare/CompareHeroExperience.jsx`
- `src/components/catalog/CompareBelowFoldSections.jsx` — removed duplicate score block

**Before**

- Score dimension table appeared after trust panels (lazy loaded), often below specs.
- Guide mode skipped score comparison entirely.

**After**

- `CompareScoreStory` renders immediately after vehicle cards and **before** spec tables (tool + guide).
- Per vehicle: overall score, grade, strengths, weaknesses, highlight badges.
- Dimension breakdown table nested under story as “Score by dimension”.
- Score is the primary narrative entering the spec section.

---

## Issue 3 — Rival compare prefill

**Problem:** Detail “Compare with rivals” linked to rival detail pages; “Open compare tool” opened empty `/compare`.

**Files changed**

- `src/utils/compareRivalPrefill.js` *(new)*
- `src/components/catalog/CompareRivalActions.jsx` *(new)*
- `src/styles/compare-rival-actions.css` *(new)*
- `src/components/catalog/EvDetailGoldSections.jsx`
- Reuses `fetchCatalogCarsForCompareSlugs` from `src/utils/compareGuideCatalog.js`

**Before**

- Rival tags were plain detail links.
- Bulk compare button did not prefill vehicles.

**After**

- “Compare with” shows up to **5 rivals** as one-click chips (`Compare vs BE 6`, etc.).
- Each chip prefills `/compare` via `replaceCompareCars` + `navigate({ state: { cars } })`.
- “Compare all” opens current EV + up to 2 rivals (3-up max per product rule).
- Small “View” link on each chip still reaches rival detail page.

---

## Issue 4 — Compare internal linking

**Problem:** Limited cross-linking between popular compare pairs for SEO/discovery.

**Files changed**

- `src/seo/compareDiscoveryLinks.js` *(new)*
- `src/components/compare/CompareInternalLinks.jsx` *(new)*
- `src/styles/compare-internal-links.css` *(new)*
- `src/components/compare/CompareHeroExperience.jsx`
- `src/pages/CarDetails.jsx`
- `src/pages/ComparePage.jsx` — `?cars=slugA,slugB` prefill hydration

**Before**

- Compare pair discovery relied on editorial SEO sections only where guides existed.

**After**

- Curated pairs exposed near page bottom: Curvv vs BE 6, Punch vs Windsor, Atto 3 vs Creta Electric, Ioniq 5 vs EV6, plus generated guide pairs.
- Links prefer `/compare/:slug` when a guide exists; otherwise `/compare?cars=a,b` (crawlable, hydrates on load).
- Shown on compare hub/guide pages and vehicle detail pages (context-aware).

---

## Issue 5 — Accessibility polish

**Problem:** Compare flows needed clearer labels, focus, and table semantics.

**Files changed**

- `src/components/compare/CompareHeroExperience.jsx` — `aria-label` on hero CTAs, `role="group"`, table `scope` + `aria-label`
- `src/styles/compare-page.css` — `:focus-visible` on hero buttons, remove, FAB
- `src/styles/compare-rival-actions.css` — chip + CTA focus rings
- `src/styles/compare-internal-links.css` — link focus rings
- `src/components/compare/CompareMobileSpecCards.jsx` — swipe region `tabIndex`, labelled cards

**Before**

- Generic button text without programmatic labels; limited focus styling on compare controls.

**After**

- Descriptive `aria-label`s on compare hero actions and rival compare chips.
- Visible `:focus-visible` outlines (contrast-safe blue) on interactive compare elements.
- Spec table uses `scope="col"` and explicit `aria-label`.
- No layout or color redesign.

---

## Validation

```bash
npm run build
```

**Result:** Passed (2026-06-08).

**Manual verification checklist**

- [ ] Desktop `/compare` — vehicle cards → score story → full spec table
- [ ] Mobile `/compare` — swipe spec cards, no wide table scroll
- [ ] Vehicle detail — rival one-click compare prefills session
- [ ] Compare internal links at bottom of detail + compare pages
- [ ] Keyboard tab through hero buttons, rival chips, mobile swipe region
- [ ] No regressions on `/compare/:slug` guide pages

---

## Files touched (complete list)

| File | Change |
|------|--------|
| `src/utils/compareScoreBadges.js` | Multi-badge helper |
| `src/utils/compareRivalPrefill.js` | New |
| `src/seo/compareDiscoveryLinks.js` | New |
| `src/components/compare/CompareMobileSpecCards.jsx` | New |
| `src/components/compare/CompareScoreStory.jsx` | New |
| `src/components/compare/compare-score-story.css` | New |
| `src/components/compare/CompareInternalLinks.jsx` | New |
| `src/components/compare/CompareScoreComparison.jsx` | Compact mode |
| `src/components/compare/compare-score-comparison.css` | Compact styles |
| `src/components/compare/CompareHeroExperience.jsx` | Composition |
| `src/components/catalog/CompareRivalActions.jsx` | New |
| `src/components/catalog/CompareBelowFoldSections.jsx` | Score deduped |
| `src/components/catalog/EvDetailGoldSections.jsx` | Rival prefill |
| `src/pages/ComparePage.jsx` | Query prefill |
| `src/pages/CarDetails.jsx` | Internal links |
| `src/styles/compare-page.css` | Mobile cards + a11y |
| `src/styles/compare-rival-actions.css` | New |
| `src/styles/compare-internal-links.css` | New |

---

## Next (Wave D candidates)

- Homepage pagination / infinite scroll (audit item)
- Compare page LCP optimization (defer below-fold further)
- Full accessibility audit across listing filters and navbar
- Editorial compare guides for pairs currently using `?cars=` prefill only
