# Dealer Pilot Package

Internal materials for **controlled dealer conversations** — not for public or dealer-dashboard use.

## Contents

| File | Purpose |
|------|---------|
| [evsavari-positioning-summary.md](./evsavari-positioning-summary.md) | What EVSavari is for dealers |
| [trust-first-marketplace-narrative.md](./trust-first-marketplace-narrative.md) | Trust philosophy — no public reviews |
| [lead-summary-template.md](./lead-summary-template.md) | What to share verbally from intent API |
| [compare-engaged-example.md](./compare-engaged-example.md) | Sample compare-assisted narrative |
| [trust-engaged-example.md](./trust-engaged-example.md) | Sample trust-panel engagement narrative |
| [charging-concern-example.md](./charging-concern-example.md) | Sample charging-anxiety lead |
| [ownership-intent-example.md](./ownership-intent-example.md) | Sample ownership-focused lead |
| [dealer-conversation-framework.md](./dealer-conversation-framework.md) | First-call structure |
| [dealer-onboarding-checklist.md](./dealer-onboarding-checklist.md) | Pre-handoff gates |
| [pilot-scope.md](./pilot-scope.md) | 1 metro · 3 models · guardrails |

**Extended ops:** [dealer-pilot-operations/](../dealer-pilot-operations/)

## API (admin only)

`GET /api/admin/leads/:id/intent-summary` → `dealerSummary` + internal `leadQuality` (do **not** share tier/score).

## Policy

- No public lead scores  
- No raw behavioral event export  
- No CRM integration in pilot phase  
