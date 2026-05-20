# Update review workflow

## States

| Status | Meaning |
|--------|---------|
| **pending** | Awaiting human decision |
| **approved** | Publish bundle generated — still requires out-of-band apply |
| **rejected** | Do not apply; keep audit trail |
| **deferred** | Parked; revisit with OEM clarification |

## Reviewer duties

1. Open session **Details** — read health summary + diffs.
2. For **intelligence** severity: confirm specs against OEM PDF / official configurator.
3. For **pricing**: confirm ex-showroom city / variant scope matches EVSavari policy.
4. Add **notes** with OEM reference (doc version, date).

## Approval checklist

- [ ] No unknown slugs unless intentional new family (then catalog team owns full record).
- [ ] No duplicate slug rows in same batch.
- [ ] Dangerous price warnings explained or corrected.
- [ ] Connector / DC kW values align with charging intelligence tables.

## Export

Download JSON bundle → attach to ticket → backend applies → run `npm run build` / SEO regen if catalog-driven pages change.
