import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  STATUS_LABELS,
  MONITORING_STATUS,
  ALERT_LEVEL_LABELS,
  canHumanApprove,
  alertLevelTone,
} from "../../agents/monitoring/index.js";
import { groupAlertsByCategory } from "../../agents/monitoring/monitoringAlerts.js";
import {
  apiApproveMonitoringScan,
  apiGetMonitoringDashboard,
  apiRejectMonitoringScan,
  apiRunMonitoringScan,
} from "../../services/monitoringApi.js";
import { adminBadge, adminCard } from "./adminOpsStyles.js";

const card = { ...adminCard, marginBottom: "1rem" };

const btnPrimary = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSuccess = { ...btnPrimary, background: "#166534" };
const btnDanger = { ...btnPrimary, background: "#991b1b" };

export default function MonitoringAgentPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reviewer =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "admin"
      : "admin";

  const refresh = useCallback(() => {
    const res = apiGetMonitoringDashboard();
    if (res.ok) setDashboard(res.data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRunScan() {
    setLoading(true);
    setError("");
    const res = await apiRunMonitoringScan();
    if (!res.ok) setError(res.errors?.join("; ") || "Scan failed");
    refresh();
    setLoading(false);
  }

  function handleApprove(scanId) {
    const res = apiApproveMonitoringScan(scanId, { approvedBy: reviewer });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  function handleReject(scanId) {
    const res = apiRejectMonitoringScan(scanId, {
      rejectedBy: reviewer,
      reason: "Rejected from monitoring dashboard",
    });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  const latest = dashboard?.latestScan;
  const metrics = latest?.metrics;
  const grouped = groupAlertsByCategory(latest?.alerts || []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <nav style={{ marginBottom: "1rem", fontSize: 14 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
      </nav>

      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.5rem" }}>
          Monitoring Agent v1
        </h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
          Observe catalog freshness, OEM health, agent metrics, score drift, and
          SEO signals. Recommendations only — no autonomous corrections.
        </p>
      </header>

      {error ? (
        <div style={{ ...card, background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={loading}
          onClick={handleRunScan}
        >
          {loading ? "Scanning…" : "Run platform scan"}
        </button>
      </div>

      {metrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
            marginBottom: "1rem",
          }}
        >
          <Tile label="Health score" value={metrics.healthScore} />
          <Tile label="Freshness" value={metrics.freshnessScore} />
          <Tile label="Alerts" value={metrics.alertCount} />
          <Tile label="Critical" value={metrics.criticalCount} tone="red" />
          <Tile label="Warnings" value={metrics.warningCount} tone="yellow" />
        </div>
      )}

      {dashboard?.healthTrend?.length > 1 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Health trend
          </h2>
          <TrendChart
            points={dashboard.healthTrend}
            keyName="healthScore"
            color="#166534"
          />
          <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>
            Freshness trend
          </h3>
          <TrendChart
            points={dashboard.healthTrend}
            keyName="freshnessScore"
            color="#1d4ed8"
          />
        </div>
      )}

      {latest && (
        <>
          <div style={card}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
              Latest recommendation
            </h2>
            <p style={{ margin: "0 0 8px", fontSize: 14 }}>
              <strong>{latest.recommendation?.label}</strong> —{" "}
              {latest.recommendation?.summary}
            </p>
            <span style={adminBadge(alertLevelTone(latest.recommendation?.code === "BLOCKED" ? "CRITICAL" : "neutral"))}>
              {latest.recommendation?.code}
            </span>
            {canHumanApprove(latest.status) && (
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={btnSuccess}
                  onClick={() => handleApprove(latest.id)}
                >
                  Approve review
                </button>
                <button
                  type="button"
                  style={btnDanger}
                  onClick={() => handleReject(latest.id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Panel title="Agent metrics" metrics={metrics?.agentMetrics} />
            <Panel title="Registry & SEO" latest={latest} grouped={grouped} />
          </div>

          <div style={card}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Alerts</h2>
            {Object.entries(grouped).map(([cat, alerts]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, textTransform: "capitalize", margin: "0 0 6px" }}>
                  {cat.replace(/_/g, " ")}
                </h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                  {alerts.map((a) => (
                    <li key={a.id} style={{ marginBottom: 4 }}>
                      <span style={adminBadge(alertLevelTone(a.level))}>
                        {ALERT_LEVEL_LABELS[a.level]}
                      </span>{" "}
                      {a.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!latest.alerts?.length && (
              <p style={{ color: "#64748b" }}>No alerts — platform healthy.</p>
            )}
          </div>
        </>
      )}

      <div style={card}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
          Execution history
        </h2>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: 6 }}>Time</th>
              <th style={{ padding: 6 }}>Status</th>
              <th style={{ padding: 6 }}>Health</th>
              <th style={{ padding: 6 }}>Alerts</th>
              <th style={{ padding: 6 }}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.scans || []).map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 6 }}>
                  {s.completedAt
                    ? new Date(s.completedAt).toLocaleString()
                    : "—"}
                </td>
                <td style={{ padding: 6 }}>
                  {STATUS_LABELS[s.status] || s.status}
                </td>
                <td style={{ padding: 6 }}>{s.metrics?.healthScore ?? "—"}</td>
                <td style={{ padding: 6 }}>{s.metrics?.alertCount ?? 0}</td>
                <td style={{ padding: 6 }}>{s.recommendation?.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, tone = "neutral" }) {
  return (
    <div style={{ ...adminCard, marginBottom: 0, padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
        <span style={adminBadge(tone)}>{value ?? "—"}</span>
      </div>
    </div>
  );
}

function TrendChart({ points, keyName, color }) {
  const max = Math.max(...points.map((p) => p[keyName] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {points.map((p, i) => (
        <div
          key={i}
          title={`${p[keyName]} @ ${p.at || i}`}
          style={{
            flex: 1,
            height: `${((p[keyName] || 0) / max) * 100}%`,
            minHeight: 4,
            background: color,
            borderRadius: 4,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

function Panel({ title, metrics, latest, grouped }) {
  if (metrics) {
    return (
      <div style={card}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>{title}</h2>
        {Object.entries(metrics).map(([key, m]) => (
          <div key={key} style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>{m.agentId || key}</strong>
            <div style={{ color: "#64748b" }}>
              Runs: {m.totalRuns ?? 0}
              {m.successRatePct != null && ` · Success ${m.successRatePct}%`}
              {m.failureRatePct != null && ` · Fail ${m.failureRatePct}%`}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const seoAlerts = grouped?.seo_health?.length ?? 0;
  const regAlerts = grouped?.registry_health?.length ?? 0;

  return (
    <div style={card}>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>{title}</h2>
      <p style={{ fontSize: 13, margin: "4px 0" }}>
        SEO alerts: {seoAlerts}
      </p>
      <p style={{ fontSize: 13, margin: "4px 0" }}>
        Registry alerts: {regAlerts}
      </p>
      <p style={{ fontSize: 13, margin: "4px 0" }}>
        Registry entries: {latest?.snapshot?.registry?.length ?? "—"}
      </p>
    </div>
  );
}
