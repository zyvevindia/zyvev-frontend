# Behavioral Activation Checklist

**Policy:** Privacy-first · Anonymous sessions only · No PII in events  
**Enable when:** Production smoke passed and ops approves Week 1 learning.

---

## Environment

### Backend

- [ ] `BEHAVIORAL_INTELLIGENCE_ENABLED=true`
- [ ] `MONGO_URI` set (TTL indexes for events)
- [ ] Rate limits appropriate for public traffic

### Frontend

- [ ] `VITE_BEHAVIORAL_INTELLIGENCE=true`
- [ ] `VITE_LAUNCH_PROFILE=public-beta`
- [ ] Redeploy after env change

---

## Pre-flight audits

```bash
cd zyvev-backend
node -e "const a=require('./services/behavioral-intelligence-audits');console.log(a.auditBehavioralIntelligence().errors)"
npm run ops:controlled-launch
```

- [ ] Behavioral audit `errors: 0`
- [ ] `launchReady: true`

---

## Event integrity (allowed types)

Verify tracking fires in browser (network tab → POST `/api/behavioral/events`):

| Event | Page / action |
|-------|----------------|
| `detail_page_viewed` | Vehicle detail load |
| `compare_started` / `compare_completed` | Compare flow |
| `ownership_panel_viewed` | Trust / ownership panel in view |
| `charging_reality_expanded` | Charging section expand |
| `scenario_compare_viewed` | Compare trust panel |
| `seo_to_detail` | SEO guide → vehicle |
| `lead_cta_initiated` | Lead modal open |
| `lead_submitted` | Successful submit *(no PII in payload)* |

---

## Privacy constraints

- [ ] No email/phone/name in event payloads
- [ ] No device fingerprinting
- [ ] No third-party ad pixels in buyer flows
- [ ] Retention policy documented (90d default)

---

## Lead attribution continuity

- [ ] Lead records include `sourcePage` / intent context
- [ ] `npm run ops:continuity` passes (if DB available)
- [ ] Compare-assisted leads identifiable internally (not shared with dealers)

---

## Post-activation validation

```bash
npm run ops:market-learning -- --db 7
npm run ops:behavioral-quality
```

- [ ] Events appearing in DB (after traffic)
- [ ] No schema validation errors in logs

**Workflow:** [week-1-market-learning-workflow.md](./week-1-market-learning-workflow.md)

---

## Rollback

Disable flags → [../production-validation/rollback-checklist.md](../production-validation/rollback-checklist.md)
