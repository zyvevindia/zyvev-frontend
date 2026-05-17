import { useEffect, useMemo, useState } from "react";

import LeadTimeline from "../crm/LeadTimeline";
import { fetchOpsAuditLog } from "../../services/opsAuditLog";
import {
  buildLeadTimeline,
  timelineToCsvRows,
} from "../../utils/leadTimeline";
import { downloadCsvFromObjects } from "../../utils/csvExport";

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.4)",
  zIndex: 10060,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
};

const panel = {
  background: "#fff",
  borderRadius: "16px",
  maxWidth: "520px",
  width: "100%",
  maxHeight: "85vh",
  overflow: "auto",
  padding: "1.25rem",
  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
};

export default function LeadTimelineModal({ lead, onClose }) {
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    if (!lead?._id) return;
    fetchOpsAuditLog({ limit: 80, targetId: lead._id }).then(setAudit);
  }, [lead?._id]);

  const events = useMemo(
    () => buildLeadTimeline(lead, audit),
    [lead, audit]
  );

  const exportTimeline = () => {
    const rows = timelineToCsvRows(events);
    if (!rows.length) return;
    downloadCsvFromObjects(
      rows,
      (r) => r,
      `lead-timeline-${lead._id?.slice(-6) || "export"}.csv`
    );
  };

  if (!lead) return null;

  return (
    <div
      style={backdrop}
      role="presentation"
      onClick={onClose}
    >
      <div
        style={panel}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>{lead.name}</h2>
            <p
              style={{
                margin: "0.25rem 0 0",
                color: "#64748b",
                fontSize: "0.9rem",
              }}
            >
              {lead.phone} · {lead.vehicleName || "—"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={exportTimeline}>
              Export CSV
            </button>
            <button type="button" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <LeadTimeline lead={lead} auditEntries={audit} showProgress />
      </div>
    </div>
  );
}
