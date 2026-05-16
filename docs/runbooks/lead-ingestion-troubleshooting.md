# Runbook: Lead Ingestion Troubleshooting

## Symptoms

- Form succeeds but no CRM lead
- Drop in `report-lead-quality.js` totals
- Dealers report zero leads

## Steps

1. `node scripts/audit-lead-pipeline.js` — code path connectivity
2. `node scripts/audit-lead-source-continuity.js --db` — attribution gaps
3. Check API logs for lead route errors
4. Confirm `MONGO_URI` and Lead model writes in staging replica

## Common causes

| Cause | Fix |
|-------|-----|
| API down / CORS | Restore API; check frontend `VITE_API_URL` |
| Validation failure | Fix required fields on form |
| CRM webhook failure | Check downstream integration (outside sprint) |
| Rate limit / auth | Review middleware |

## Privacy check

If continuity audit reports `possible_pii_in_intent_context`:

1. Disable behavioral attach temporarily
2. Review `buyerIntentContext` builder — no name/phone/email in context object

## Lead quality still works without behavioral

`sourcePage` on Lead document is minimum for SEO/compare attribution.
