# Ingestion checklists

## Pre-import

- [ ] OEM file checksum / email trail saved
- [ ] Column headers mapped to EVSavari fields (`docs/ingestion/runbook.md`)
- [ ] Catalog snapshot loaded in admin UI

## Post-import (pending)

- [ ] Parse errors = 0
- [ ] Duplicate slugs = 0 (or explained)
- [ ] Dangerous price warnings triaged
- [ ] Missing-catalog slugs resolved or removed from batch

## Post-approve (publish)

- [ ] Bundle JSON stored with ticket ID
- [ ] Backend / DB apply completed
- [ ] `npm run catalog-ops:smoke` + `npm run trust:smoke` + `npm run seo:qa`
- [ ] Ops audit log shows `catalog_ingestion_exported` / apply note

## Smoke automation

```bash
npm run ingestion:smoke
npm run ci:full
```
