# Buyer Intent Intelligence

Privacy-safe, anonymous behavioral events for EV decision journeys.

## Enable

```env
# Backend
BEHAVIORAL_INTELLIGENCE_ENABLED=true

# Frontend
VITE_BEHAVIORAL_INTELLIGENCE=true
```

## Tracked events

| Event | Trigger |
|-------|---------|
| `detail_page_viewed` | Vehicle detail loads |
| `compare_started` | Compare page with 2+ vehicles |
| `compare_completed` | Lead CTA from compare |
| `ownership_panel_viewed` | Ownership panel in viewport |
| `charging_reality_expanded` | Charging details opened |
| `scenario_compare_viewed` | Scenario panel in viewport |
| `seo_to_detail` | Click from SEO guide to vehicle |
| `lead_cta_initiated` | Inquiry modal opened |
| `lead_submitted` | Successful lead (no PII in event) |
| `bookmark_saved` | Reserved for future use |

## Internal reports

```bash
# Governance audit (no DB)
node scripts/audit-behavioral-intelligence.js

# Aggregates (requires MongoDB)
node scripts/report-behavioral-intelligence.js 7
```

Admin API: `GET /api/behavioral/report?days=7` (admin JWT).

## Governance

See `zyvev-backend/docs/behavioral-intelligence-governance.md`.
