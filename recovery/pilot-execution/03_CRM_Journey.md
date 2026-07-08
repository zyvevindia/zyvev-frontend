# CRM Journey Certification — MVP-02

**Surfaces:** Admin leads console, Sales Kanban, Sales dashboard, Ops QA

---

## CRM Surfaces

| Surface | File | API |
|---|---|---|
| Admin leads | `src/Admin.jsx` | `GET /api/admin/leads`, assign, read, status |
| Sales Kanban | `src/pages/KanbanBoard.jsx` | `GET /api/sales/leads`, `PATCH .../status` |
| Sales dashboard | `src/pages/SalesDashboard.jsx` | `GET /api/sales/leads`, notes, follow-up |
| Lead detail drawer | `src/components/LeadDetailDrawer.jsx` | Notes API |
| Ops QA test lead | `src/pages/admin/OperationalQaPage.jsx` | Direct `POST /leads` |
| Ops health | `src/services/opsHealthApi.js` | `GET /api/admin/leads?page=1&limit=1` |
| Admin export | `src/services/adminExportApi.js` | Paginated leads export |

---

## CRM Journey Steps

| Step | Admin | Sales Kanban | Status |
|---|---|---|---|
| List leads | ✅ `Admin.jsx` L358 | ✅ `KanbanBoard.jsx` L84 | Code only |
| Filter / paginate | ✅ query string | Column by status | Code only |
| Assign dealer | ✅ `POST .../assign` | — | Code only |
| Update status | ✅ | ✅ L176 | Code only |
| Add notes | — | ✅ `SalesDashboard` | Code only |
| Schedule follow-up | — | ✅ `.../followup` | Code only |
| Mark read | ✅ | — | Code only |
| Audit trail | ✅ `opsAuditLog` on admin actions | Partial | Code only |

---

## Pipeline Status Model

**File:** `src/crm/leadPipeline.js`

Used by dealer dashboard and CRM for consistent status labels (`labelForStatus`, `PIPELINE_STATUS_VALUES`).

---

## Ops QA Path

`OperationalQaPage.jsx` submits test leads:

```104:122:src/pages/admin/OperationalQaPage.jsx
  const submitTestLead = async () => {
    ...
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        ...
          name: "[QA-TEST] Ops lifecycle",
          phone: "9876543210",
```

**Note:** QA page does **not** use Turnstile — ops-only path. Buyer-facing path now uses Turnstile via `LeadInquiryModal`.

---

## Certification Gaps

| Gap | Evidence | Owner |
|---|---|---|
| No authenticated CRM probe in CI | `LEAD_SMOKE_SALES_TOKEN` unset — Playwright skipped | QA + Ops |
| Duplicate leads in CRM | API creates duplicate records (`merged: false`) | Backend |
| Assignment visibility | Admin assign API exists; E2E not run | QA |
| Lead reconciliation | No automated reconcile job in frontend | Backend/Ops |

---

## Manual CRM Verification (Pre-Pilot)

1. Admin login → Leads tab
2. Submit live test lead via vehicle page or `OperationalQaPage`
3. Confirm lead appears in admin list with correct city/vehicle
4. Assign to pilot dealer
5. Sales Kanban shows lead in `new` column
6. Move through pipeline → `won` or `lost`
7. Export CSV via admin export — verify row

---

## Certification Verdict

| Criterion | Verdict |
|---|---|
| CRM UI complete | **PASS** (code) |
| Lead visible in CRM after buyer submit | **NOT PROVEN** |
| Full status lifecycle | **NOT PROVEN** |

**Overall CRM journey:** **FAIL** (certification incomplete)
