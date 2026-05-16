# Runbook: Compare Page Failure

## Symptoms

- `/compare` blank or error boundary
- Compare pairs not loading
- Compare events stop (ops only)

## Steps

1. Browser console + network for compare API / catalog fetch
2. Verify `USE_EV_MASTER` / catalog flags for environment
3. `node scripts/audit-structured-data.js` if SEO/schema related
4. `node scripts/report-behavioral-trends.js` — compare_started vs completed (if DB enabled)

## Degrade gracefully

- Compare hub should still render hub shell with error message (ErrorBoundary)
- Detail pages and leads unaffected — verify lead form from detail still works

## Attribution

Leads from compare need `sourcePage: "compare"` and `comparedVehicles` in intent when behavioral on.

## Rollback

Revert compare-related frontend commit; keep sitemap `compare.xml` unless URL structure changed.
