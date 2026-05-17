# Day-1 soft launch checklist

Use with `/admin/ops-qa` and `/admin/media-qa`.

## Before traffic

- [ ] Production API health: `GET /cars?limit=1` returns 200
- [ ] Cloudinary hero/listing/compare for 6 production families (see `npm run media:audit -- --probe`)
- [ ] `npm run seo:qa` passes (no blocking errors)
- [ ] Sitemaps live: `/sitemap.xml`, `/sitemaps/cars.xml`
- [ ] WhatsApp sales number set (`VITE_WHATSAPP_SALES_NUMBER`)
- [ ] Admin login + dealer login smoke-tested

## First hour

- [ ] Home, `/cars`, one family detail, `/compare` load on mobile (4G throttle)
- [ ] Submit test lead from detail + compare; appears in Admin → Leads
- [ ] WhatsApp CTA opens with correct vehicle context
- [ ] Report issue footer link opens modal and submits (check Ops audit for `site_feedback`)

## First day

- [ ] Review Ops audit log for `site_feedback` entries
- [ ] Check broken-image reports in Media QA probe
- [ ] Monitor unmatched leads / dealer assignment queue
- [ ] GSC: submit sitemap if not already indexed

## Escalation

See [critical-issue-playbook.md](./critical-issue-playbook.md) and [rollback-checklist.md](./rollback-checklist.md).
