# Runbook: Disable Behavioral Tracking

**When:** Privacy review, incident, or performance concern.

## Backend

Set environment:

```
BEHAVIORAL_INTELLIGENCE_ENABLED=false
```

Redeploy API. Event ingestion endpoints should reject or no-op per implementation.

## Frontend

```
VITE_BEHAVIORAL_INTELLIGENCE=false
```

Redeploy frontend. Client should stop emitting `BuyerBehaviorEvent` payloads.

## Verify

- Network tab: no posts to behavioral ingest route on compare/detail
- `validate-launch-profile.js soft-launch` passes
- Leads still submit (intent context may be empty — expected)

## Data retention

Existing events remain under TTL (~90 days). No automatic purge in this sprint.

## Re-enable

Only after `docs/behavioral-intelligence-governance.md` checklist and profile `public-beta` or `behavioral-public` validation.
