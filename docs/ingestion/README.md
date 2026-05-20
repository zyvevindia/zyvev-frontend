# Catalog ingestion — EVSavari (semi-automated)

Human-governed OEM / sheet intake: **parse → normalize → diff → review → export bundle**. No autonomous publish from the browser.

| Doc | Purpose |
|-----|---------|
| [runbook.md](./runbook.md) | When to run imports, env, safety |
| [workflow-review.md](./workflow-review.md) | Approve / reject / defer |
| [rollback.md](./rollback.md) | Mistakes, bundle recall |
| [checklists.md](./checklists.md) | Pre/post ingest QA |

**Admin UI:** `/admin/catalog-ingestion` (after login).

**Smoke:** `npm run ingestion:smoke`
