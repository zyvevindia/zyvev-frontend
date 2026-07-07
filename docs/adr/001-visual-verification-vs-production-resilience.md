# ADR 001: Visual Verification vs Production Resilience

## Status

Accepted

## Context

EVSavari vehicle images use a multi-URL fallback chain so users still see acceptable media when a primary catalog asset is missing or fails to load. Playwright visual regression captures full-page screenshots to guard layout and content.

Production rendering and visual verification have different goals:

- **Production** optimizes for user experience when assets are imperfect.
- **Visual regression** must verify that intended primary catalog media actually renders.

Without an explicit contract, visual tests can pass when a fallback image (for example `LOCAL_FALLBACK_EV` or a sibling URL in the chain) renders even though the primary vehicle asset failed. Pixel comparison alone does not reliably detect that defect.

## Decision

1. **Production fallback behavior is unchanged.** `VehicleImage` continues to advance through the full fallback chain via `advanceFallback()`.

2. **Visual regression validates primary media only.** A visual test passes only when each in-scope `VehicleImage` primary asset (fallback chain index `0`) reaches the `loaded` state.

3. **Fallback rendering must never satisfy visual correctness.** If the primary asset fails and a fallback renders, the DOM contract reports `failed` and the visual test harness fails before `toHaveScreenshot()`.

4. **Instrumentation lives in `VehicleImage`; enforcement lives in the visual test harness.**
   - `VehicleImage` exposes `data-primary-media-state` (`pending` | `loaded` | `failed`).
   - `assertPrimaryVehicleImagesReady(page)` runs immediately before every visual screenshot.

5. **Visual regression mode** continues to use `window.__EVSAVARI_VISUAL_REGRESSION__` (set in `prepareVisualPage()`). No separate builds, URL parameters, or visual-only render trees.

## Consequences

### Positive

- Production UX and resilience are preserved.
- Visual regression becomes a catalog/media integrity gate, not a fallback-behavior check.
- Future contributors have a clear separation: render policy vs verification policy.
- The `data-primary-media-state` contract is reusable for future media components and visual suites.

### Negative / trade-offs

- Visual tests require valid primary assets for every `VehicleImage` on captured pages.
- Primary state is tracked separately from the currently displayed URL; contributors must not conflate “visible image” with “primary loaded.”

### Non-goals

- Disabling fallbacks in visual mode.
- Weakening screenshot thresholds, masks, or timeouts to hide primary failures.
- Duplicating image rendering logic for tests.
