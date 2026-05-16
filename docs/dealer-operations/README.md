# Dealer Operations — Controlled Launch

Operational guidance for early dealer onboarding. **Documentation only** — no dealer portal changes in this sprint.

## Lead expectations

- Leads arrive from EVSavari inquiry forms with **vehicle context** when submitted from a detail page.
- **Source page** is stored for ops analytics (e.g. `compare`, `/cars/{slug}`) — dealers see vehicle and message, not full behavioral scores.
- Response-time target: **under 4 business hours** during launch; **under 1 hour** for hot markets if staffing allows.
- Leads may include **buyer intent summary** (admin API) when behavioral collection is enabled — dealer-facing copy stays high-level.

## Response-time recommendations

| Priority | Signal | Suggested first response |
|----------|--------|---------------------------|
| High | Compare-assisted + ownership concern | Same day, offer call |
| Medium | Single vehicle detail lead | Within 4 hours |
| Standard | SEO guide origin, exploratory | Within 24 hours |

## Lead-quality interpretation (aggregated ops)

Ops team uses `node scripts/report-lead-quality.js` — dealers do not run this.

| Metric | Meaning |
|--------|---------|
| `seoOriginatedLeads` | User started on programmatic SEO guide |
| `compareAssistedLeads` | Compare page or 2+ vehicles in intent context |
| `withOwnershipEngagementSignal` | Ownership uncertainty flagged before submit |
| `sourcePageCoverage` | % leads with attribution — low = tracking gap |

Low quality indicators for ops (not dealer blame):

- High `unknown` source rate
- Leads without vehicle name on detail-origin flows

## Compare-context interpretation

When `sourcePage` is `compare` or intent includes `comparedVehicles`:

- Buyer is evaluating **multiple models** — avoid pushing single trim only.
- Reference vehicles named in compare context in first reply.
- Do not assume final choice; offer side-by-side test drive or total-cost framing.

## Ownership-intent interpretation

Signals in dealer-safe intent summary (when present):

- **ownership_uncertainty** in buyer concerns → lead with running cost, warranty, battery clarity.
- **ownershipPriority** skewed to cost / range / charging → tailor follow-up (not raw behavioral scores).

Dealers must **not** receive anonymous session IDs, event timelines, or internal scores.

## Onboarding checklist

- [ ] CRM receives leads with vehicle + contact fields
- [ ] Dealer understands EVSavari is inquiry broker, not inventory holder
- [ ] Escalation path for duplicate leads documented
- [ ] Privacy: no sharing of buyer data outside approved CRM

## Related

- [lead-quality-signals.md](./lead-quality-signals.md)
- [../buyer-intent-intelligence/README.md](../buyer-intent-intelligence/README.md)
- Backend: `GET /api/admin/leads/:id/intent-summary` (admin only)
