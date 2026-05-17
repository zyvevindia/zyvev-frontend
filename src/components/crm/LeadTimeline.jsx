import { useMemo } from "react";

import { labelForStatus } from "../../crm/leadPipeline";
import {
  buildLeadTimeline,
  hoursSince,
  timelineStageIndex,
} from "../../utils/leadTimeline";

const STAGES = [
  { key: "created", label: "Created" },
  { key: "assigned", label: "Assigned" },
  { key: "contacted", label: "Contacted" },
  { key: "follow_up", label: "Follow-up" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
];

const styles = {
  wrap: { marginTop: "0.75rem" },
  progress: {
    display: "flex",
    gap: "4px",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  step: (active, done) => ({
    flex: "1 1 72px",
    minWidth: "64px",
    padding: "6px 8px",
    borderRadius: "8px",
    fontSize: "0.7rem",
    fontWeight: 600,
    textAlign: "center",
    background: done ? "#dcfce7" : active ? "#dbeafe" : "#f1f5f9",
    color: done ? "#166534" : active ? "#1d4ed8" : "#64748b",
  }),
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    borderLeft: "2px solid #e2e8f0",
    marginLeft: "8px",
  },
  item: {
    position: "relative",
    padding: "0 0 12px 16px",
    fontSize: "0.85rem",
  },
  dot: {
    position: "absolute",
    left: "-7px",
    top: "4px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#2563eb",
    border: "2px solid #fff",
  },
  label: { fontWeight: 600, color: "#0f172a" },
  meta: { fontSize: "0.75rem", color: "#64748b", marginTop: "2px" },
  compact: { fontSize: "0.8rem" },
};

function formatAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Operational timeline for a single lead.
 */
export default function LeadTimeline({
  lead,
  auditEntries = [],
  compact = false,
  showProgress = true,
}) {
  const events = useMemo(
    () => buildLeadTimeline(lead, auditEntries),
    [lead, auditEntries]
  );

  const currentStage = useMemo(() => {
    if (!lead) return "created";
    if (lead.status === "won" || lead.status === "converted") return "converted";
    if (lead.status === "lost") return "lost";
    if (lead.status === "follow_up" || lead.status === "follow-up") {
      return "follow_up";
    }
    if (
      ["contacted", "interested", "test_drive", "negotiation"].includes(
        lead.status
      )
    ) {
      return "contacted";
    }
    if (lead.dealer || lead.assignedTo || lead.assignedAt) return "assigned";
    return "created";
  }, [lead]);

  const currentIdx = timelineStageIndex(currentStage);
  const ageHrs = hoursSince(lead?.createdAt);

  if (!lead) return null;

  return (
    <div style={styles.wrap}>
      {showProgress && !compact && (
        <div style={styles.progress}>
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              style={styles.step(i === currentIdx, i < currentIdx)}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}

      {ageHrs != null && (
        <p style={{ ...styles.meta, margin: "0 0 0.5rem" }}>
          Open {ageHrs}h · Status: {labelForStatus(lead.status)}
          {lead.firstRespondedAt &&
            ` · First response ${hoursSince(lead.firstRespondedAt)}h after create`}
        </p>
      )}

      <ul style={{ ...styles.list, ...(compact ? styles.compact : {}) }}>
        {events.length === 0 ? (
          <li style={styles.item}>
            <span style={styles.dot} />
            <span style={styles.label}>Created</span>
            <div style={styles.meta}>{formatAt(lead.createdAt)}</div>
          </li>
        ) : (
          events.map((e, i) => (
            <li key={`${e.stage}-${e.at}-${i}`} style={styles.item}>
              <span style={styles.dot} />
              <div style={styles.label}>{e.label}</div>
              <div style={styles.meta}>
                {formatAt(e.at)}
                {e.detail ? ` · ${e.detail}` : ""}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
