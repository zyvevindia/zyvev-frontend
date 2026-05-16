# Operational Runbooks

Quick procedures for launch operations. Prefer CLI audits over ad-hoc production debugging.

## Index

| Runbook | Topic |
|---------|--------|
| [sitemap-rebuild.md](./sitemap-rebuild.md) | Regenerate and deploy sitemaps |
| [deploy-rollback.md](./deploy-rollback.md) | Failed deploy rollback |
| [seo-issue-response.md](./seo-issue-response.md) | Indexing / canonical incidents |
| [broken-route-response.md](./broken-route-response.md) | 404 / routing regressions |
| [disable-behavioral-tracking.md](./disable-behavioral-tracking.md) | Turn off behavioral ingestion |
| [lead-ingestion-troubleshooting.md](./lead-ingestion-troubleshooting.md) | Leads not reaching CRM |
| [compare-page-failure.md](./compare-page-failure.md) | Compare hub errors |
| [soft-launch-monitoring.md](./soft-launch-monitoring.md) | Daily/weekly real-world monitoring |
| [data-ingestion.md](./data-ingestion.md) | Tier-1 OEM / PDF ingestion |

## Unified ops summary

```bash
cd zyvev-backend
node scripts/report-operational-dashboard.js
node scripts/report-operational-dashboard.js --db   # requires MONGO_URI
```

## Launch profile validation

```bash
node scripts/validate-launch-profile.js soft-launch
node scripts/validate-launch-profile.js public-beta
```
