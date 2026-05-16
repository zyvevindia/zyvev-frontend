# Rollback Checklist

Use when production cutover introduces **material** risk. Prefer **flag rollback** before full redeploy when possible.

---

## Rollback triggers (any)

- [ ] Lead submit broken in production
- [ ] Widespread API 5xx on catalog/SEO/behavioral
- [ ] Canonical/noindex regression on money pages
- [ ] `/admin` or `/dealer` appearing in index samples
- [ ] PII detected in behavioral event payloads

**Not rollback triggers:**

- Low Day-1 GSC indexed count
- Single-variant trust copy mismatch (editorial fix)
- Market health `watch` with core audits passing

---

## Step 1 — Stop learning (2 min)

**Backend:**

- [ ] `BEHAVIORAL_INTELLIGENCE_ENABLED=false`
- [ ] Redeploy or restart with updated env

**Frontend:**

- [ ] `VITE_BEHAVIORAL_INTELLIGENCE=false`
- [ ] Redeploy Vercel

See [../runbooks/disable-behavioral-tracking.md](../runbooks/disable-behavioral-tracking.md)

---

## Step 2 — Profile downgrade (if needed)

**Option A — soft-launch (SEO static, no behavioral):**

- [ ] Backend + frontend env → `soft-launch` profile per [launchProfiles.js](https://github.com) / `validate-launch-profile.js soft-launch`

**Option B — Vercel instant rollback:**

- [ ] Vercel → Deployments → Promote previous production deployment
- [ ] Confirm `robots.txt` + sitemap unchanged or restored

---

## Step 3 — Verify rollback

```bash
npm run ops:live-smoke https://evsavari.com
npm run ops:seo
npm run validate:production
```

- [ ] Lead flow works
- [ ] No new canonical errors
- [ ] Behavioral route returns disabled or 403 per policy

---

## Step 4 — Communicate

- [ ] Log incident in ops notes
- [ ] Update [week-1-live-ops-summary.md](../weekly-live-ops/week-1-live-ops-summary.md)
- [ ] Pause dealer pilot handoffs until stable 48h

---

## Post-mortem (within 48h)

- Root cause
- Env vs code vs content
- Updated checklist item if gap found
