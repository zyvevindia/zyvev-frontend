# Dealer Conversation Workflow

## Before the call

1. Run `npm run ops:dealer-pilot 7` (internal)  
2. Pull dealer-safe summary for specific lead via admin API  
3. Review [high-intent-indicators.md](./high-intent-indicators.md)  
4. Do **not** share lead quality tier or numeric scores  

## Opening (5 min)

- Confirm EVSavari is an **intelligence + lead context** partner, not a CRM  
- Explain pilot scope: 1 metro, 3 models, 2 weeks  
- Set expectation: summaries are qualitative, privacy-safe  

## Value demonstration (10 min)

Walk through one anonymised example from [dealer-pilot-package/](../dealer-pilot-package/):

- Compared models (if compare-assisted)  
- Charging / apartment concern (if present)  
- Ownership panel engagement (if present)  

## Operational alignment (10 min)

- Handoff channel (email recommended)  
- Response SLA (dealer commits to 24h callback)  
- Feedback loop → `dealer-feedback.jsonl`  

## Pilot terms (5 min)

- No exclusivity implied  
- No public “EVSavari dealer score”  
- EVSavari does not promise delivery dates  

## Close

- Agree start date after Week 1 ops checklist green  
- Schedule mid-pilot check-in (day 7)  

## Post-call

Log notes:

```json
{"category":"pilot_conversation","metro":"NCR","outcome":"proceed|defer","note":"...","recordedAt":"ISO"}
```
