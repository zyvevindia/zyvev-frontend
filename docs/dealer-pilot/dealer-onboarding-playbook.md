# Dealer onboarding playbook (operational beta)

Use this before handing a pilot dealer live leads.

## Scope (pilot)

- **1 metro** (agreed city coverage)
- **Up to 3 models** with accurate pricing and availability
- **No CRM integration** — dealer uses EVSavari dashboard + WhatsApp only

## Pre-onboarding (ops)

1. Confirm dealer application approved in **Admin → Dealer applications**
2. Create dealer account (**Admin → Dealers**)
3. Share login URL: `https://evsavari.com/dealer`
4. Run **Admin → Operational QA → Dealer onboarding checklist** (all items checked)

## Dealer setup (30–45 min)

| Step | Owner | Done when |
|------|--------|-----------|
| Profile | Dealer | Showroom name, city, phone, WhatsApp number |
| Inventory | Dealer | ≥1 listing: image, ex-showroom price, range, variant label |
| Notification | Dealer | Confirms test lead received on dashboard |
| WhatsApp | Dealer | Opens sample lead → WhatsApp with vehicle context |
| SLA | Ops + dealer | Written agree: respond within **4 business hours** on new leads |

## Test lead flow

1. Ops submits **QA test lead** from `/admin/ops-qa` OR buyer form on a pilot model page
2. Lead appears in **Admin → Leads** (status: new)
3. Assign to pilot dealer
4. Dealer marks **read** → **contacted** within SLA
5. Archive test leads tagged `[QA-TEST]` after verification

## Handoff to live traffic

- [ ] Pilot models appear on city/guide pages for agreed metro
- [ ] Unmatched lead count = 0 in ops queue
- [ ] Dealer responsiveness (7d) visible on **Traffic intelligence**
- [ ] Ops contact for escalations documented

## Do not

- Share internal lead quality scores or tiers with dealers
- Promise public reviews or star ratings (trust-first narrative)
- Add dealers outside pilot metro without ops approval
