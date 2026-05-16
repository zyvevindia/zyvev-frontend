# Editorial review runbook

## Ingestion review workflow

1. Register source: `npm run acq:register-source`
2. Extract PDF: `npm run acq:extract-pdf -- --source-id <id>`
3. Open **Editorial dashboard** → verify job appears (or enqueue via CLI)
4. Review raw extract tab — confirm brochure vs placeholder
5. Review structured fields — edit/reject per field with provenance
6. Review diff vs Tier-1 — only approve when changes are intentional
7. Approve draft in workflow panel

## Extraction review

- **Low confidence / doNotPublish:** do not approve until licensed PDF re-extracted
- **OCR warnings:** verify values manually; mark `MANUAL_ENTRY` on edits
- **Zero tables:** expect text-only curator mapping for spec pages

## Approval workflow

| Action | When |
|--------|------|
| Approve draft | Provenance complete, diff understood, values verified |
| Reject | Unsupported fields, placeholder PDF, hallucination risk |
| Needs manual review | Ambiguous brochure section, missing units |
| Return to pending | Send back after manual review complete |

## Staged publish

1. Open `/admin/editorial/staged`
2. Confirm approved jobs show **provenance complete**
3. **Publish approved → staging** — creates manifest under `staging/published/`
4. **Rollback manifest** — removes staged copies only

**Never** use staging publish as production catalog deploy.

## Rollback

- UI: Staged publish → Rollback on manifest
- Effect: deletes files listed in manifest; Tier-1 unchanged
- Re-run `npm run acq:audit` after rollback

## Provenance troubleshooting

| Issue | Fix |
|-------|-----|
| provenanceGaps on approve | Fill metadata via field edit (MANUAL_ENTRY) |
| unsupported_flat_key | Omit field or extend `KNOWN_FLAT_MAP` (bounded change) |
| diff draft_only | Editorial Tier-1 merge candidate — not auto-applied |

## Diff review guidance

- **modified:** verify unit normalization (kW, hours, INR)
- **draft_only:** catalog gap — safe to stage, merge editorially later
- **published_only:** draft missing field present in Tier-1 — do not delete Tier-1 via UI

## Coverage dashboard

Use `/admin/editorial/coverage` to prioritize:

- Charging practicality (AC/DC times)
- NCAP, warranty km, service cost
- Charging FAQ depth
