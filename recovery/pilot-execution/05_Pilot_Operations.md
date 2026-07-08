# Lead Operations Audit — MVP-02

**Scope:** Ownership, assignment, retry, escalation, audit, duplicate suppression, rate limiting, notifications

---

## Operations Matrix

| Capability | Implementation | Verified? |
|---|---|---|
| **Lead ownership** | `assignedDealerId` in POST payload via `leadRouting.js` | ⚠️ Sent, not confirmed by API |
| **Assignment** | Frontend routing plan + Admin `POST .../assign` | ⚠️ Partial |
| **Retry** | `safeFetchJson` 20s timeout on submit | ✅ Code |
| **Escalation** | `fallback-ops-queue` in routing when no city match | ✅ Code |
| **Audit trail** | `opsAuditLog.js` on admin/dealer actions | ✅ Code |
| **Duplicate suppression** | Expected `merged: true` on API | ❌ **Not working** |
| **Rate limiting** | Not in frontend | ❌ Unknown backend |
| **Notifications** | No email/WhatsApp on new lead in frontend | ❌ Gap (PCS-01 #16) |

---

## Lead Ownership

**File:** `src/utils/leadRouting.js`

Pilot desk IDs (examples):

- `pilot-ncr-01` — Gurgaon / Noida
- `pilot-delhi-01` — Delhi
- `fallback-ops-queue` — unmatched cities

Payload attached in `src/services/leadSubmitApi.js`:

```javascript
assignedDealerId: routing.plan.dealerId,
leadMetadata: { routing: routing.plan, routingLog: routing.log }
```

---

## Assignment (Admin Override)

**File:** `src/Admin.jsx`

- `POST /api/admin/leads/:id/assign` — manual reassignment
- Ops can correct routing failures

---

## Retry / Failure Recovery

| Layer | Behavior |
|---|---|
| Submit timeout | 20s via `safeFetchJson` |
| Network error | User message: "Unable to connect to server." |
| Validation error | Field-level errors from API `errors` object |
| Turnstile expire | Token cleared; user must re-solve |

**Gap:** No client-side retry button or idempotency key on submit.

---

## Escalation

Unrouted leads → `fallback-ops-queue` + status `new_unrouted`.

**Manual escalation:** Admin monitors unassigned queue; no automated alert.

---

## Audit Trail

**File:** `src/services/opsAuditLog.js`

Dealer dashboard logs actions via `AUDIT_ACTIONS` (status changes, etc.).

**Gap:** Buyer submit audit is API-side only — not verified in frontend.

---

## Duplicate Suppression

**Expected:** Second submit with same phone → `merged: true`, same `leadId`

**Observed (production 2026-07-08):**

```json
First:  {"leadId":"6a4d5e919573bc1d0b94717e","merged":false}
Second: {"leadId":"6a4d5e919573bc1d0b947182","merged":false}
```

**Verdict:** **OPEN BLOCKER** — backend `zyvev-backend`

---

## Rate Limiting

- Contact/newsletter forms may have backend limits (not audited here)
- `/leads` — no frontend throttle; honeypot only on modal

**Risk:** Bot traffic until Turnstile live on production.

---

## Notifications

| Channel | Status |
|---|---|
| Dealer email on new lead | ❌ Not in frontend repo |
| Dealer WhatsApp alert | Manual via `openDealerLeadWhatsApp` |
| Ops alert on fallback queue | ❌ Not implemented |

---

## Manual Fallback

1. Monitor admin leads for `fallback-ops-queue`
2. Manual assign via Admin → Assign dealer
3. Phone follow-up using lead phone from admin export
4. Delete QA test leads tagged `[QA-TEST]` or `leadMetadata.smokeTest`

---

## Certification Verdict

**Lead operations:** **FAIL** — duplicate suppression and notifications block pilot-grade ops.
