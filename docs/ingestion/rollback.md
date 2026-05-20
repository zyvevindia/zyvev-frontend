# Rollback — catalog ingestion

## Before bundle is applied

- **Reject** the session in UI; optionally **Clear local queue** (browser-only store).

## After a bad bundle was applied (backend)

1. Restore Mongo / catalog snapshot using **rollbackSnapshots** inside the bundle JSON (minimal fields captured at approval time).
2. Re-run **catalog ops audit** and **trust smoke** (`npm run trust:smoke`).
3. If SEO JSON was regenerated from bad data, revert git commit for `public/seo-data` and redeploy.

## Partial apply

- Treat as incident: identify slugs touched; manually correct in source of truth; re-export clean bundle.

## Prevention

- Never skip **human approval** for intelligence-severity batches.
- Keep bundles in version control or secure ticket attachments for traceability.
