# Behavioral trust governance — EVSavari

**Phase:** Behavioral Trust Calibration (Phase 1)  
**Principle:** Calibrate recommendations using real public-beta signals — no speculative AI.

---

## Compare trust review workflow

1. Weekly: export from `/admin/behavioral-trust` (CSV + JSON).
2. Triage **NEEDS_REVIEW** and **LOW_CONFIDENCE** pairs first.
3. Cross-check **trust decay alerts** (traffic + abandonment + weak realism).
4. Apply editorial fixes in catalog compare narrative — not ad-hoc UI overrides.
5. Re-run dashboard after deploy; compare week-over-week snapshots.

**Statuses:** TRUSTED · STABLE · NEEDS_REVIEW · LOW_CONFIDENCE

---

## Realism calibration standards

| Signal | Threshold | Action |
|--------|-----------|--------|
| Completion rate &lt;30% with ≥6 starts | High bounce | Editorial + CTA review |
| Trust decay risk ≥55 | Decay alert | Human review suggested |
| Ownership realism &lt;55 | Weak ownership | Complete ownership bundle |
| Charging practicality &lt;55 | Weak charging | DC/home data + copy |
| Overconfident messaging risk | Catalog | Lower confidence band in copy |

---

## Ownership realism policy

- City and highway use cases must be distinguishable in compare sets when scores diverge.
- TCO and running costs remain **indicative** unless OEM-verified.
- Apartment charging limitations must surface when `apartmentPracticality` is limited.
- No “always cheaper” or guaranteed savings language.

---

## Charging practicality policy

- Do not claim fast charging leadership without DC time in intelligence bundle.
- Home AC fit must mention parking/society constraints when data is limited.
- Compare copy links to existing charging guides — no new spam URLs.

---

## Trust messaging discipline

- No fake precision or exaggerated certainty.
- Use: directional, indicative, match your route, confirm with dealer.
- Score tooltips must mention missing/estimated data when applicable.
- “Why recommended?” must soften language when confidence is low.

---

## Trust decay review cadence

| Cadence | Task |
|---------|------|
| Daily (prod) | Monitor buffer growth on compare/lead events |
| Weekly | Refresh behavioral trust + public beta ops snapshots |
| Bi-weekly | Clear top 3 decay alerts or document accepted risk |
| Monthly | Review recurring weak clusters for catalog fixes |

---

## Data sources

| Source | Used for |
|--------|----------|
| Admin traffic-ops | Compare starts, completion rates |
| Local usage buffer | Abandon, tooltips, scroll depth, leads |
| Catalog realism ops | Ownership/charging scores, contradictory pills |

**Note:** Buffer is per-browser until GA4/traffic pipeline merge — export JSON for team alignment.

---

## Related dashboards

- `/admin/behavioral-trust` — primary calibration surface
- `/admin/recommendation-realism` — catalog-only realism
- `/admin/public-beta-ops` — weekly trends and evolution

**Readiness:** `docs/launch/trusted-beta-readiness.md`
