import { useEffect, useState } from "react";

import { fetchOpsAuditPaginated } from "../../services/opsAuditLog";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

const ACTION_LABELS = {
  dealer_application_review: "Dealer application",
  lead_assigned: "Lead assigned",
  lead_status_changed: "Status changed",
  lead_read_admin: "Admin read",
  lead_read_dealer: "Dealer read",
  lead_read_all_dealer: "All leads read (dealer)",
  dealer_override: "Dealer override",
  admin_override: "Admin override",
  whatsapp_intent: "WhatsApp intent",
  bulk_lead_read: "Bulk read",
  bulk_lead_assign: "Bulk assign",
  bulk_status_update: "Bulk status update",
};

export default function OpsAuditLogPanel({
  limit = 25,
  targetId,
  days = 14,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchOpsAuditPaginated({
      page,
      limit,
      targetId,
      days,
      action: actionFilter || undefined,
    }).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [page, limit, targetId, days, actionFilter]);

  const entries = data?.entries || [];

  return (
    <section style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          {targetId ? "Lead audit trail" : "Operational audit log"}
        </h2>
        {data?.retentionDays && (
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Retention: {data.retentionDays} days
            {data.source === "local" && " (local buffer)"}
          </span>
        )}
      </div>

      {!targetId && (
        <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>
          Action filter{" "}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}

      {loading && <p style={{ color: "#64748b" }}>Loading…</p>}
      {!loading && entries.length === 0 && (
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          No audit entries in this period.
        </p>
      )}
      {!loading && entries.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            fontSize: "0.85rem",
          }}
        >
          {entries.map((e) => (
            <li
              key={e.id || e._id}
              style={{
                padding: "0.5rem 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <strong>{ACTION_LABELS[e.action] || e.action}</strong>
              {e.targetId && (
                <span style={{ color: "#64748b" }}>
                  {" "}
                  · {String(e.targetId).slice(-8)}
                </span>
              )}
              <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {new Date(e.at).toLocaleString("en-IN")} · {e.actorRole}
                {e.actorLabel ? ` · ${e.actorLabel}` : ""}
                {e.metadata?.summary ? ` · ${e.metadata.summary}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span style={{ fontSize: "0.85rem" }}>
            Page {page} / {data.totalPages} ({data.total} entries)
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
