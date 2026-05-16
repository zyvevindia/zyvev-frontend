# Dealer-Safe Lead Summary Template

**Do not share:** `leadQuality.qualityScore`, `leadQuality.qualityTier`, raw events.

## Verbal handoff script

> Buyer inquired on **[vehicle]** from **[source page]**.
>
> [If compare-assisted:] They compared **[model A]** and **[model B]** on EVSavari before submitting.
>
> [If charging concern:] They likely have questions about **home or society charging access** — confirm parking and AC feasibility early.
>
> [If first-time pattern:] Treat as **first EV purchase** — focus on charging routine and realistic range bands, not ARAI headline alone.
>
> This context comes from anonymous on-site behavior — not a credit or identity profile.

## Fields from API (`dealerSummary`)

- `vehicleName`
- `sourcePage`
- `comparedVehicles[]`
- `buyerConcernTags[]` (max 4)
- `ownershipPriority`
- `chargingPriority`
- `inferredUsageHints[]`
