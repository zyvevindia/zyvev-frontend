import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  STATUS_LABELS,
  SEVERITY_LABELS,
  canHumanApprove,
  severityTone,
} from "../../agents/audit/index.js";
import { groupFindingsByCategory } from "../../agents/audit/auditFindings.js";
import {
  apiApproveAuditRun,
  apiGetAuditDashboard,
  apiRejectAuditRun,
  apiRunAuditScan,
} from "../../services/auditApi.js";
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

export default function AuditAgentPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reviewer =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "admin"
      : "admin";

  const refresh = useCallback(() => {
    const res = apiGetAuditDashboard();
    if (res.ok) setDashboard(res.data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRunAudit() {
    setLoading(true);
    setError("");
    const res = await apiRunAuditScan();
    if (!res.ok) setError(res.errors?.join("; ") || "Audit failed");
    refresh();
    setLoading(false);
  }

  function handleApprove(runId) {
    const res = apiApproveAuditRun(runId, { approvedBy: reviewer });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  function handleReject(runId) {
    const res = apiRejectAuditRun(runId, {
      rejectedBy: reviewer,
      reason: "Rejected from audit dashboard",
    });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  const latest = dashboard?.latestRun;
  const metrics = latest?.metrics;
  const grouped = groupFindingsByCategory(latest?.findings || []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <nav style={{ marginBottom: "1rem", fontSize: 14 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
        {" · "}
        <Link to="/admin/monitoring">Monitoring</Link>
      </nav>

      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.5rem" }}>
          Audit Agent v1
        </h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
          Verify catalog, score, SEO, agent governance, registry, and monitoring
          integrity. Findings and recommendations only — no autonomous corrections.
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
          onClick={handleRunAudit}
        >
          {loading ? "Auditing…" : "Run integrity audit"}
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
          <Tile label="Audit score" value={metrics.auditScore} />
          <Tile label="Trust score" value={metrics.trustScore} />
          <Tile label="Findings" value={metrics.findingCount} />
          <Tile label="Critical" value={metrics.criticalCount} tone="red" />
          <Tile label="Warnings" value={metrics.warningCount} tone="yellow" />
          <Tile
            label="Resolution rate"
            value={
              metrics.resolutionRatePct != null
                ? `${metrics.resolutionRatePct}%`
                : "—"
            }
          />
        </div>
      )}

      {dashboard?.auditTrend?.length > 1 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Audit score trend
          </h2>
          <TrendChart
            points={dashboard.auditTrend}
            keyName="auditScore"
            color="#7c3aed"
          />
          <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>
            Trust score trend
          </h3>
          <TrendChart
            points={dashboard.auditTrend}
            keyName="trustScore"
            color="#0d9488"
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
            <span
              style={adminBadge(
                severityTone(
                  latest.recommendation?.code === "BLOCKED"
                    ? "CRITICAL"
                    : "neutral"
                )
              )}
            >
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

          <div style={card}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Findings</h2>
            {Object.entries(grouped).map(([cat, findings]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 13,
                    textTransform: "capitalize",
                    margin: "0 0 6px",
                  }}
                >
                  {cat.replace(/_/g, " ")}
                </h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                  {findings.map((f) => (
                    <li key={f.id} style={{ marginBottom: 4 }}>
                      <span style={adminBadge(severityTone(f.severity))}>
                        {SEVERITY_LABELS[f.severity]}
                      </span>{" "}
                      {f.message}
                      {f.entityId ? (
                        <span style={{ color: "#94a3b8" }}> ({f.entityId})</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!latest.findings?.length && (
              <p style={{ color: "#64748b" }}>No findings — integrity checks passed.</p>
            )}
          </div>
        </>
      )}

      <div style={card}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
          Audit history
        </h2>
        <table
          style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: 6 }}>Time</th>
              <th style={{ padding: 6 }}>Status</th>
              <th style={{ padding: 6 }}>Audit</th>
              <th style={{ padding: 6 }}>Trust</th>
              <th style={{ padding: 6 }}>Findings</th>
              <th style={{ padding: 6 }}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.runs || []).map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 6 }}>
                  {r.completedAt
                    ? new Date(r.completedAt).toLocaleString()
                    : "—"}
                </td>
                <td style={{ padding: 6 }}>
                  {STATUS_LABELS[r.status] || r.status}
                </td>
                <td style={{ padding: 6 }}>{r.metrics?.auditScore ?? "—"}</td>
                <td style={{ padding: 6 }}>{r.metrics?.trustScore ?? "—"}</td>
                <td style={{ padding: 6 }}>{r.metrics?.findingCount ?? 0}</td>
                <td style={{ padding: 6 }}>{r.recommendation?.code}</td>
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
