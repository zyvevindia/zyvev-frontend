import { useEffect, useState } from "react";

const SAVED_FILTERS_KEY = "evsavari-admin-saved-lead-filters";

const DEFAULT_SAVED = [
  { id: "unmatched", label: "Unmatched queue", filter: "unmatched" },
  { id: "overdue", label: "Overdue SLA", filter: "overdue" },
  { id: "whatsapp", label: "WhatsApp leads", filter: "whatsapp" },
];

function loadSavedFilters() {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SAVED;
  } catch {
    return DEFAULT_SAVED;
  }
}

const bar = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  marginBottom: "0.75rem",
  padding: "0.75rem",
  background: "#f8fafc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
};

const btn = {
  padding: "0.35rem 0.65rem",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: "12px",
  cursor: "pointer",
};

const btnPrimary = {
  ...btn,
  background: "#2563eb",
  color: "#fff",
  borderColor: "#2563eb",
};

/**
 * Admin leads toolbar — filters, bulk ops, export.
 */
export default function AdminLeadsOpsBar({
  leadFilter,
  onFilterChange,
  selectedCount,
  dealersList = [],
  onBulkAssign,
  onBulkMarkRead,
  onBulkStatus,
  onExportClient,
  onExportServer,
  exporting,
}) {
  const [savedFilters] = useState(loadSavedFilters);
  const [exportDays, setExportDays] = useState("7");
  const [bulkDealerId, setBulkDealerId] = useState("");
  const [quickStatus, setQuickStatus] = useState("contacted");

  useEffect(() => {
    if (!bulkDealerId && dealersList[0]?._id) {
      setBulkDealerId(dealersList[0]._id);
    }
  }, [dealersList, bulkDealerId]);

  return (
    <div style={bar}>
      <label style={{ fontSize: "12px" }}>
        Filter{" "}
        <select
          value={leadFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="">All</option>
          <option value="unmatched">Unmatched</option>
          <option value="overdue">Overdue</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </label>

      <span style={{ fontSize: "12px", color: "#64748b" }}>Saved:</span>
      {savedFilters.map((f) => (
        <button
          key={f.id}
          type="button"
          style={leadFilter === f.filter ? btnPrimary : btn}
          onClick={() => onFilterChange(f.filter)}
        >
          {f.label}
        </button>
      ))}

      {selectedCount > 0 && (
        <>
          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            {selectedCount} selected
          </span>
          <select
            value={bulkDealerId}
            onChange={(e) => setBulkDealerId(e.target.value)}
            style={{ fontSize: "12px", padding: "4px" }}
          >
            <option value="">Quick assign dealer…</option>
            {dealersList.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            style={btnPrimary}
            disabled={!bulkDealerId}
            onClick={() => onBulkAssign(bulkDealerId)}
          >
            Assign selected
          </button>
          <button type="button" style={btn} onClick={onBulkMarkRead}>
            Mark read
          </button>
          <select
            value={quickStatus}
            onChange={(e) => setQuickStatus(e.target.value)}
            style={{ fontSize: "12px", padding: "4px" }}
          >
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow-up</option>
            <option value="interested">Interested</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <button
            type="button"
            style={btn}
            onClick={() => onBulkStatus(quickStatus)}
          >
            Set status
          </button>
        </>
      )}

      <span style={{ marginLeft: "auto" }} />

      <label style={{ fontSize: "12px" }}>
        Export days{" "}
        <input
          type="number"
          min="1"
          max="90"
          value={exportDays}
          onChange={(e) => setExportDays(e.target.value)}
          style={{ width: "48px", padding: "4px" }}
        />
      </label>
      <button
        type="button"
        style={btn}
        disabled={exporting}
        onClick={() => onExportServer(Number(exportDays) || 7)}
      >
        Server CSV
      </button>
      <button
        type="button"
        style={btnPrimary}
        disabled={exporting}
        onClick={() => onExportClient(Number(exportDays) || 7)}
      >
        {exporting ? "Exporting…" : "Export filtered"}
      </button>
    </div>
  );
}
