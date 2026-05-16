# Mobile Friction Observations

Log real-device friction here. **Fix only** broken layouts, readability, compare pain, lead usability.

---

## Open items

| ID | Page | Issue | Severity | Status |
|----|------|-------|----------|--------|
| M1 | Compare | Spec table requires horizontal swipe (by design) | low | Accepted |
| M2 | Lead modal | Keyboard may cover submit on small Android — verify manual | medium | Verify |

---

## Resolved (sprint)

| ID | Fix |
|----|-----|
| M-grid | CarDetails/Compare grids used `minmax(340px/300px)` causing edge overflow on 375px → `minmax(min(100%, …))` |
| M-trust | TrustConfidenceBlock + CompareTrustPanel padding clamps |
| M-lead | LeadInquiryModal overlay `alignItems: flex-start` + safe-area + touch scroll |

---

## Not in scope (this block)

- Visual redesign / rebrand
- New compare UX patterns
- Native app considerations

---

## Re-test after deploy

```bash
npm run ops:mobile-readiness
```

Then complete [mobile-qa-signoff.md](./mobile-qa-signoff.md).
