# Trusted conversion governance

EVSavari Phase 4 & 5 — behavior-driven buyer intelligence without dashboard sprawl or speculative AI.

## Lead-quality standards

- Prefer **HIGH_CONFIDENCE** and **TRUSTED** journeys over raw lead volume.
- A strong lead journey shows: compare or detail depth, trust-tooltip or ownership/charging guide engagement, and submitted lead without prior abandonment in the same session.
- **NEEDS_REVIEW** paths require editorial or trust calibration before scaling traffic.

## CTA trust standards

- No fake urgency, aggressive sales tone, or misleading confidence.
- Compare CTAs: “Request dealer callback”, “Compare on-road quotes”, “Chat on WhatsApp” with opt-in hint.
- WhatsApp suits quick questions; callback suits quotes and trim confirmation.

## Conversion realism standards

- Compare → lead realism is weak when compare completion is low but CTAs imply certainty — soften copy and add ownership nuance.
- `conversionDecayRisk` ≥ 50 with high views and no lead signal triggers review.

## Behavioral analytics discipline

- Local buffer (`evsavari-usage-learning-v1`) supplements traffic API; not a substitute for GA4/PostHog when configured.
- Required funnel events: `compare_started`, `compare_completed`, `compare_abandoned`, `trust_tooltip_opened`, `lead_started`, `lead_submitted`, `lead_form_abandoned`, `ownership_guide_opened`, `charging_guide_opened`.
- Do not add noisy custom events without ops review.

## Trust-conversion calibration workflow

1. Open `/admin/trusted-conversions` weekly.
2. Export weak conversion clusters and compare abandonment CSV/JSON.
3. Apply editorial CTA / trust / ownership hints on **NEEDS_REVIEW** rows only.
4. Re-check after 7 days via weekly snapshot (`evsavari-trusted-conversion-weekly-v1`).

## Multi-session interpretation guidelines

- Repeat family views and compare pairs indicate consideration depth, not identity.
- `multiSessionMaturityScore` &lt; 40 with traffic: expect immature buffer — do not over-interpret.
- Trust-before-lead and guide-before-lead are positive quality signals.

## Operational review cadence

| Cadence | Action |
|--------|--------|
| Weekly | Trusted conversions dashboard + exports |
| Bi-weekly | CTA copy spot-check on top 5 compare pairs |
| Monthly | GA4 funnel vs buffer reconciliation |
| Quarterly | Governance doc review |

## Admin surface

- Primary: `/admin/trusted-conversions`
- Legacy: `/admin/conversion-quality` (subset metrics)
- Summary: `/admin/public-beta-ops` → `trustedConversion` block
