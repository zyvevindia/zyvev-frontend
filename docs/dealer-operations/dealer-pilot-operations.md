# Dealer Pilot Operations

**Scope:** 1 metro · 3 models · controlled conversations · no CRM integration

## Suggested pilot

| Dimension | Choice |
|-----------|--------|
| Metro | Delhi NCR or Bangalore |
| Models | Nexon EV Creative+, Punch LR, Comet Play |
| Duration | 2 weeks after Week 1 stable traffic |
| Delivery | Email with dealer-safe summary only |

## Lead handoff format

Use `/api/admin/leads/:id/intent-summary` — includes:

- `dealerSummary` (vehicle, compared models, concerns)
- `leadQuality` (internal tier — **do not** share score with dealer)
- No raw event timeline

## Signals to mention to dealer (qualitative)

- “Buyer compared X vs Y on site”
- “Asked about charging / apartment access” (if concern tags present)
- “Viewed ownership guidance before inquiry”

## Conversation script (outline)

1. Confirm their city and parking/charging setup  
2. Reference compared models if compare-assisted  
3. Set range expectations using planning bands, not ARAI alone  
4. Offer test drive — do not promise delivery dates from EVSavari  

## Feedback capture

Append to `zyvev-backend/ops/dealer-feedback.jsonl`:

```json
{"category":"lead_quality","note":"...","recordedAt":"ISO-date"}
```

## Out of scope for pilot

- Dealer login / dashboard
- Public lead scores
- Automated lead routing to OEM

## Readiness gate

Complete [dealer-pilot-readiness-checklist.md](./dealer-pilot-readiness-checklist.md) before first outreach.
