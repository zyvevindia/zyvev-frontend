# Mobile QA Sign-off

**Target:** Android Chrome · 375px viewport · Slow 4G (DevTools)  
**Required before:** scaling traffic or dealer pilot handoffs.

---

## Automated pre-check

```bash
cd zyvev-backend
npm run ops:mobile-readiness
```

Expected: `mobileReady: true`

---

## Manual matrix

| Flow | 375px | Android Chrome | Slow 4G | Pass |
|------|-------|----------------|---------|------|
| Homepage — catalog cards | ☐ | ☐ | ☐ | ☐ |
| Vehicle detail — readability | ☐ | ☐ | ☐ | ☐ |
| Vehicle detail — trust block | ☐ | ☐ | — | ☐ |
| Compare — 2 vehicles | ☐ | ☐ | ☐ | ☐ |
| Compare — spec table swipe | ☐ | ☐ | — | ☐ |
| Compare — trust panel | ☐ | ☐ | — | ☐ |
| SEO guide — read + CTA | ☐ | ☐ | ☐ | ☐ |
| Lead form — open/submit | ☐ | ☐ | ☐ | ☐ |
| No horizontal page scroll | ☐ | ☐ | — | ☐ |

---

## Pass criteria

- Body text readable without pinch-zoom (≥14px effective)
- Primary CTA tappable (≥44px touch target)
- Lead modal scrollable; submit visible with keyboard open
- Compare spec table scrolls horizontally only inside table wrapper
- No content hidden behind fixed chrome (safe-area respected)

---

## Code fixes applied (sprint)

- CarDetails / compare grids: `minmax(min(100%, …))` prevents 375px overflow
- Trust blocks: responsive padding clamps
- Lead modal: top-aligned scroll overlay + safe-area padding

---

## Sign-off

| Tester | Date | Device | Result |
|--------|------|--------|--------|
| | | | Pass / Fail |

**If Fail:** log friction in [mobile-friction-observations.md](./mobile-friction-observations.md) — fix only meaningful issues.
