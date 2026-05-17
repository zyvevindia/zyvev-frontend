# How EVSavari works — operator guide

For ops, sales, and editorial staff during **operational beta**.

## Product in one paragraph

EVSavari helps Indian buyers choose an EV through **trust-first guides** (cities, comparisons, ownership), then connects them to **verified dealers** via forms and WhatsApp. Dealers work leads in the **dealer dashboard**; ops work assignment and SLA in **Admin CRM**.

## Buyer journey

```
SEO / discovery page → vehicle detail or compare → lead (form or WhatsApp) → admin CRM → dealer dashboard
```

| Touchpoint | Route examples | Lead signal |
|------------|----------------|-------------|
| City guide | `/cities/{city}/evs` | WhatsApp, links to models |
| Compare guide | `/compare/{slug}` | WhatsApp with compare slugs |
| Compare tool | `/compare` | Form + WhatsApp |
| Vehicle family | `/cars/{family-slug}` | Form, test drive, WhatsApp |
| Listing card | `/cars` catalog | Form + WhatsApp |

## Admin surfaces

| URL | Purpose |
|-----|---------|
| `/admin` | Leads, dealers, ops pulse |
| `/admin/traffic` | Conversion, WhatsApp, compare trends, indexing readiness |
| `/admin/ops-qa` | QA test lead, checklists, SEO smoke, GSC helpers |
| `/admin/dealer-applications` | Approve new dealers |
| `/kanban` | Pipeline by status |

## Lead types

- **Form lead** — `POST /leads`, appears in CRM with source page and vehicle
- **WhatsApp intent** — click tracked + optional `whatsapp-intent` API; ops may follow up in WhatsApp thread
- **QA test leads** — name prefix `[QA-TEST]`; delete after validation

## Dealer responsibilities

- Respond within agreed SLA (pilot: 4 business hours)
- Keep listing price and availability accurate
- Update lead status (contacted, test drive, won/lost)

## Ops responsibilities

- Clear **unmatched** leads in ops queue
- Assign leads to correct pilot dealer
- Monitor **Traffic intelligence** for compare → lead and WhatsApp rates
- Run `npm run gsc:verify` after SEO/content deploys
- Use **Operational QA** before pilot traffic spikes

## What not to change in beta

- URL routes, canonicals, sitemap structure
- Family / variant architecture on vehicle pages
- Compare flow URLs and session storage behavior

## Escalation

| Issue | Action |
|-------|--------|
| Lead not in CRM | Check API health; submit QA test lead from ops-qa |
| Wrong dealer assignment | Reassign in admin; note in lead notes |
| Indexing drop | GSC page indexing + ops-qa canonical spot-check |
| Dealer not responding | Ops queue overdue list; pause pilot leads if needed |

## Related docs

- [dealer-onboarding-playbook.md](./dealer-onboarding-playbook.md)
- [search-console-operations/](../search-console-operations/)
- [dealer-pilot-package/](../dealer-pilot-package/)
