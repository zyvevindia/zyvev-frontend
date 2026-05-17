/**
 * Dealer operational quality indicators — response, backlog, SLA.
 */

const wrap = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
  marginBottom: "1rem",
};

const card = (tone) => ({
  padding: "12px 14px",
  borderRadius: "12px",
  background:
    tone === "warn"
      ? "#fff7ed"
      : tone === "danger"
        ? "#fef2f2"
        : tone === "ok"
          ? "#f0fdf4"
          : "#f8fafc",
  border: `1px solid ${
    tone === "warn"
      ? "#fed7aa"
      : tone === "danger"
        ? "#fecaca"
        : tone === "ok"
          ? "#bbf7d0"
          : "#e2e8f0"
  }`,
});

function Metric({ label, value, hint, tone = "neutral" }) {
  return (
    <div style={card(tone)}>
      <div style={{ fontSize: "11px", color: "#64748b" }}>
        {label}
      </div>
      <strong style={{ fontSize: "1.2rem" }}>{value}</strong>
      {hint && (
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export default function DealerQualityBar({
  analytics,
  leads = [],
  unreadCount = 0,
}) {
  const openLeads = leads.filter(
    (l) => !["won", "lost", "converted"].includes(l.status)
  ).length;

  const overdueCount = leads.filter((l) => {
    if (!l.createdAt) return false;
    const hrs = (Date.now() - new Date(l.createdAt).getTime()) / 3600000;
    return hrs > 4 && l.status === "new";
  }).length;

  const resp = analytics?.responsiveness;
  const score = resp?.responseScore;
  const scoreTone =
    score == null
      ? "neutral"
      : score >= 80
        ? "ok"
        : score >= 50
          ? "warn"
          : "danger";

  return (
    <div style={wrap}>
      <Metric
        label="Response score"
        value={score != null ? `${score}%` : "—"}
        hint="7-day dealer performance"
        tone={scoreTone}
      />
      <Metric
        label="Avg first response"
        value={
          resp?.avgFirstResponseHours != null
            ? `${resp.avgFirstResponseHours}h`
            : "—"
        }
        hint="Target: under 4h"
        tone={
          resp?.avgFirstResponseHours > 4 ? "warn" : "ok"
        }
      />
      <Metric
        label="SLA breaches"
        value={resp?.slaBreaches ?? 0}
        tone={(resp?.slaBreaches || 0) > 0 ? "danger" : "ok"}
      />
      <Metric
        label="Unread leads"
        value={unreadCount}
        tone={unreadCount > 0 ? "warn" : "ok"}
      />
      <Metric
        label="Open backlog"
        value={openLeads}
        hint={`${leads.length} total assigned`}
        tone={openLeads > 10 ? "warn" : "neutral"}
      />
      <Metric
        label="Overdue (4h+)"
        value={overdueCount}
        tone={overdueCount > 0 ? "danger" : "ok"}
      />
    </div>
  );
}
