# Dealer Pilot Operations

Controlled dealer-alignment prep — **no public scoring, no dealer dashboard**.

## Package contents

| Doc | Purpose |
|-----|---------|
| [metro-pilot-structure.md](./metro-pilot-structure.md) | 1-metro pilot framing |
| [three-model-pilot.md](./three-model-pilot.md) | 3-model selection |
| [conversation-workflow.md](./conversation-workflow.md) | Call/meeting flow |
| [onboarding-checklist.md](./onboarding-checklist.md) | Pre-outreach gates |
| [dealer-value-narrative.md](./dealer-value-narrative.md) | What EVSavari offers dealers |
| [high-intent-indicators.md](./high-intent-indicators.md) | Qualitative buyer signals |

## Examples & templates

- [dealer-pilot-package/](../dealer-pilot-package/) — lead summaries, trust/charging examples
- [dealer-operations/dealer-pilot-operations.md](../dealer-operations/dealer-pilot-operations.md) — ops overview

## Internal commands

```bash
npm run ops:dealer-pilot 7   # requires MONGO_URI
```

API: `/api/admin/leads/:id/intent-summary` (dealer-safe, no scores)

## Pilot scope

- **1 metro** (Delhi NCR or Bangalore)
- **3 models** (e.g. Nexon EV Creative+, Punch LR, Comet Play)
- **2 weeks** after Week 1 traffic stable
- Relationship-building only
