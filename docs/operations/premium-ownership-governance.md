# Premium ownership governance — EVSavari

**Phase:** Premium Trusted EV Ownership Intelligence (2 & 3)  
**Positioning:** Trusted EV ownership intelligence — not a content farm.

---

## Ownership realism standards

| Signal | Threshold | Action |
|--------|-----------|--------|
| Ownership bundle missing | maturity &lt;72 | Complete TCO, warranty, tradeoff signals |
| Estimated + low confidence | weak_ownership_confidence | Soften recommendation copy |
| No city/highway bands | missing context | Add range reality or editorial note |
| Unrealistic assumption risk | maturity &lt;55 | Editorial review before strong picks |

**Dashboard:** `/admin/premium-ownership-journeys`

---

## Charging practicality standards

| Signal | Action |
|--------|--------|
| apartment_charging_limited | Surface apartment copy on detail + compare |
| weak_charging_practicality | Complete DC/AC intelligence |
| unrealistic_fast_charge_expectation | Remove “fastest” claims without DC data |
| public_charging_dependency_high | Add public charging planning note |

**Target:** charging practicality maturity ≥72 for PREMIUM_READY.

---

## Recommendation nuance standards

- No guaranteed savings or “always best” language.
- “Why recommended?” must soften when confidence is low.
- Score tooltips include missing-data and maturity hints.
- Detail pages show ownership expectation line under trust strip.

---

## Authority-depth governance

- Six core topic clusters + six buyer personas — no mass URL generation.
- Link from high-traffic compare and detail only to **existing** hubs.
- **Dashboard:** `/admin/ownership-authority`
- Weak clusters triaged weekly; editorial depth suggestions are hints, not auto-publish.

---

## Ownership guidance discipline

Personas tracked: first-time buyer, apartment, city commuter, highway, family, budget-conscious.

Each persona needs ≥50% guide path completeness before treating guidance as “supported”.

---

## Trust messaging discipline

- Human, practical tone — no robotic lists.
- Estimated vs verified stated on compare and detail.
- No fake precision on scores or TCO.

---

## Premium EV review cadence

| Week | Task |
|------|------|
| Mon | Export premium ownership journeys + ownership authority |
| Tue | Push one family to PREMIUM_READY (media + ownership + charging) |
| Wed | Fix top weak ownership cluster in catalog |
| Thu | Add one compare ↔ guide link for top traffic pair |
| Fri | Review Windsor / new catalog families when live |

**Gate:** ≥90% PREMIUM_READY on **in-catalog** tier-1 families.

---

## Exports

- `premium-ownership-journeys` — full journey scores  
- `ownership-authority` — topic + persona depth  
- `weak-authority-clusters` — editorial queue  

Formats: CSV and JSON via admin export actions.
