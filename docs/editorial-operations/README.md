# Editorial operations

Internal EV intelligence control plane for governed OEM brochure ingestion.

## Access

- **URL:** `/admin/editorial` (admin role only)
- **API:** `GET /api/editorial/*` (Bearer JWT + `admin` role)

## Workflow

```
OEM PDF → extract (CLI) → curator mapping → review queue
  → field review (UI) → diff vs Tier-1 → approve
  → staged publish (UI/CLI) → manual Tier-1 merge (editorial)
```

## UI surfaces

| Route | Purpose |
|-------|---------|
| `/admin/editorial` | Ingestion dashboard, job filters |
| `/admin/editorial/jobs/:jobId` | Extract viewer, field review, diff, workflow |
| `/admin/editorial/staged` | Staged publish + rollback |
| `/admin/editorial/coverage` | Tier-1 intelligence gap analysis |

## Governance rules

- No auto-publish to production Tier-1
- All normalized fields require provenance metadata
- Staged publish copies to `data-acquisition/staging/published/` only
- Rollback deletes staged copies; Tier-1 JSON unchanged

## CLI parity

Editorial UI wraps the same file-based queue as:

- `npm run acq:review`
- `npm run acq:diff`
- `npm run acq:publish-staging`
- `npm run acq:audit`

## Related docs

- [Editorial review runbook](../runbooks/editorial-review.md)
- [Data acquisition governance](../data-acquisition/governance.md)
