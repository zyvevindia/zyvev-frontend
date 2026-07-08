# Dealer Journey Certification — MVP-02

**Flow:** Assigned lead → Dealer portal → Inbox → Read → Status → Notes → Follow-up → Closure

---

## Dealer Portal Architecture

| Component | Path |
|---|---|
| Dashboard | `src/pages/DealerDashboard.jsx` |
| Auth | `src/auth` — JWT in `localStorage.token` |
| Leads API | `GET ${API_URL}/api/dealer/leads` |
| Mark read | `POST /api/dealer/leads/:id/read` |
| Read all | `POST /api/dealer/leads/read-all` |
| Status update | `PATCH /api/dealer/leads/:id/status` |
| Notes | `POST /api/dealer/leads/:id/notes` |
| WhatsApp ops | `openDealerLeadWhatsApp` in `src/utils/whatsappOps.js` |
| Audit | `logOpsAudit` / `AUDIT_ACTIONS` in `src/services/opsAuditLog.js` |
| Timeline | `LeadTimeline` component |

---

## Load Behavior

```302:306:src/pages/DealerDashboard.jsx
  useEffect(() => {

    refreshAll();

  }, []);
```

- Leads load **once on mount** via `refreshAll()` → `loadLeads()`
- Manual refresh after status/notes updates (`await loadLeads()`)
- **No polling** for new leads while dashboard is open
- Auth check interval: 60s (`setInterval` → logout if token invalid)

**Pilot impact:** Dealer must refresh page to see new leads unless they trigger an action that calls `loadLeads()`.

---

## Dealer Journey Steps

| Step | UI | API | Certified? |
|---|---|---|---|
| Login | `/dealer/login` | Backend auth | ⚠️ Not probed in MVP-02 |
| View leads | Leads tab | `GET /api/dealer/leads` | ❌ No token probe |
| Unread badge | `unreadCount` state | From API response | ❌ Unproven |
| Open lead detail | Row expand / timeline | — | Code exists |
| Mark read | Action button | `POST .../read` | Code exists |
| Update status | Quick statuses: contacted, follow_up, interested, won, lost | `PATCH .../status` | Code exists |
| Add notes | Notes field | `POST .../notes` | Code exists |
| WhatsApp follow-up | Button | Client-side deep link | Code exists |
| Closure | Status `won` / `lost` | `PATCH .../status` | Code exists |

---

## Assignment Linkage

Buyer submit sends `assignedDealerId` from `buildLeadRoutingPlan()` (e.g. `pilot-ncr-01` for Gurgaon).

**Gap:** No evidence that:

1. Backend maps `pilot-ncr-01` to a real dealer user account
2. `GET /api/dealer/leads` filters by authenticated dealer
3. A lead submitted in production appears in a specific dealer's inbox

**Unblock:** Set `LEAD_SMOKE_DEALER_TOKEN` to a pilot dealer JWT and run:

```bash
npm run lead:journey:smoke -- --live
npx playwright test tests/leads
```

---

## Dealer Onboarding Checklist (Pilot)

- [ ] Dealer account created in backend with matching `dealerId` / city mapping
- [ ] Login verified at `https://evsavari.com/dealer/login`
- [ ] Test lead submitted with dealer's city (e.g. Gurgaon)
- [ ] Lead visible in dealer dashboard within 5 min (after manual refresh)
- [ ] Status update + note saved and persisted
- [ ] WhatsApp deep link tested on mobile

---

## Certification Verdict

| Criterion | Verdict |
|---|---|
| Dealer UI implemented | **PASS** (code review) |
| Dealer receives assigned lead | **NOT PROVEN** |
| End-to-end dealer closure | **NOT PROVEN** |

**Overall dealer journey:** **FAIL** (certification incomplete)
