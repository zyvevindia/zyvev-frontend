import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  STATUS_LABELS,
  INSIGHT_LEVEL_LABELS,
  canHumanApprove,
  insightLevelTone,
} from "../../agents/analytics/index.js";
import { groupInsightsByCategory } from "../../agents/analytics/analyticsInsights.js";
import {
  apiApproveAnalyticsReport,
  apiGetAnalyticsDashboard,
  apiRejectAnalyticsReport,
  apiRunAnalyticsReport,
} from "../../services/analyticsApi.js";
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

export default function AnalyticsAgentPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reviewer =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "admin"
      : "admin";

  const refresh = useCallback(() => {
    const res = apiGetAnalyticsDashboard();
    if (res.ok) setDashboard(res.data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRunReport() {
    setLoading(true);
    setError("");
    const res = await apiRunAnalyticsReport();
    if (!res.ok) setError(res.errors?.join("; ") || "Report failed");
    refresh();
    setLoading(false);
  }

  function handleApprove(reportId) {
    const res = apiApproveAnalyticsReport(reportId, { approvedBy: reviewer });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  function handleReject(reportId) {
    const res = apiRejectAnalyticsReport(reportId, {
      rejectedBy: reviewer,
      reason: "Rejected from analytics dashboard",
    });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  const latest = dashboard?.latestReport;
  const metrics = latest?.metrics;
  const grouped = groupInsightsByCategory(latest?.insights || []);
  const opportunities = (latest?.insights || []).filter(
    (i) => i.level === "OPPORTUNITY"
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <nav style={{ marginBottom: "1rem", fontSize: 14 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
        {" · "}
        <Link to="/admin/audit">Audit</Link>
        {" · "}
        <Link to="/admin/monitoring">Monitoring</Link>
      </nav>

      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.5rem" }}>
          Analytics Agent v1
        </h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
          Business intelligence across catalog, scores, SEO, agents, monitoring,
          and audit. Read-only insights — no autonomous actions.
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
          onClick={handleRunReport}
        >
          {loading ? "Analyzing…" : "Generate analytics report"}
        </button>
      </div>

      {metrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 10,
            marginBottom: "1rem",
          }}
        >
          <Tile label="Platform health" value={metrics.platformHealthScore} />
          <Tile label="Growth" value={metrics.growthScore} tone="green" />
          <Tile label="Trust" value={metrics.trustScore} />
          <Tile label="Coverage" value={metrics.coverageScore} />
          <Tile label="Freshness" value={metrics.freshnessScore} />
          <Tile label="Agent efficiency" value={metrics.agentEfficiency ?? "—"} />
        </div>
      )}

      {metrics?.kpi && (
        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>KPIs</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              fontSize: 13,
            }}
          >
            <Kpi label="Vehicles" value={metrics.kpi.vehicleCount} />
            <Kpi label="Variants" value={metrics.kpi.variantCount} />
            <Kpi label="Avg score" value={metrics.kpi.averageScore ?? "—"} />
            <Kpi label="SEO pages" value={metrics.kpi.seoPagesGenerated} />
            <Kpi label="SEO backlog" value={metrics.kpi.seoDraftBacklog} />
            <Kpi label="Insights" value={metrics.kpi.insightCount} />
          </div>
        </div>
      )}

      {dashboard?.healthTrend?.length > 1 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Platform health trend
          </h2>
          <TrendChart
            points={dashboard.healthTrend}
            keyName="platformHealthScore"
            color="#7c3aed"
          />
          <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>
            Growth trend
          </h3>
          <TrendChart
            points={dashboard.healthTrend}
            keyName="growthScore"
            color="#16a34a"
          />
        </div>
      )}

      {metrics?.topRankings?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={card}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
              Top rankings
            </h2>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {metrics.topRankings.map((r) => (
                <li key={r.familySlug} style={{ marginBottom: 4 }}>
                  {r.displayName || r.familySlug} — {r.overallScore}{" "}
                  {r.grade ? `(${r.grade})` : ""}
                </li>
              ))}
            </ol>
          </div>
          <div style={card}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
              Category leaders
            </h2>
            {Object.entries(metrics.categoryLeaders || {}).map(([cat, leader]) => (
              <p key={cat} style={{ margin: "4px 0", fontSize: 13 }}>
                <strong style={{ textTransform: "capitalize" }}>{cat}</strong>:{" "}
                {leader.displayName || leader.familySlug} ({leader.score})
              </p>
            ))}
          </div>
        </div>
      )}

      {metrics?.scoreDistribution && (
        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Score distribution
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(metrics.scoreDistribution).map(([grade, count]) =>
              count > 0 ? (
                <span key={grade} style={adminBadge("neutral")}>
                  {grade}: {count}
                </span>
              ) : null
            )}
          </div>
        </div>
      )}

      {latest && (
        <>
          <div style={card}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
              Recommendation
            </h2>
            <p style={{ margin: "0 0 8px", fontSize: 14 }}>
              <strong>{latest.recommendation?.label}</strong> —{" "}
              {latest.recommendation?.summary}
            </p>
            <span style={adminBadge("neutral")}>
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

          {opportunities.length > 0 && (
            <div style={{ ...card, borderLeft: "4px solid #16a34a" }}>
              <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
                Strategic opportunities
              </h2>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {opportunities.map((i) => (
                  <li key={i.id}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={card}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Insights</h2>
            {Object.entries(grouped).map(([cat, insights]) => (
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
                  {insights.map((i) => (
                    <li key={i.id} style={{ marginBottom: 4 }}>
                      <span style={adminBadge(insightLevelTone(i.level))}>
                        {INSIGHT_LEVEL_LABELS[i.level]}
                      </span>{" "}
                      {i.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={card}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
          Report history
        </h2>
        <table
          style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: 6 }}>Time</th>
              <th style={{ padding: 6 }}>Status</th>
              <th style={{ padding: 6 }}>Health</th>
              <th style={{ padding: 6 }}>Growth</th>
              <th style={{ padding: 6 }}>Insights</th>
              <th style={{ padding: 6 }}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.reports || []).map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 6 }}>
                  {r.completedAt
                    ? new Date(r.completedAt).toLocaleString()
                    : "—"}
                </td>
                <td style={{ padding: 6 }}>
                  {STATUS_LABELS[r.status] || r.status}
                </td>
                <td style={{ padding: 6 }}>
                  {r.metrics?.platformHealthScore ?? "—"}
                </td>
                <td style={{ padding: 6 }}>
                  {r.metrics?.growthScore ?? "—"}
                </td>
                <td style={{ padding: 6 }}>
                  {r.metrics?.insightCount ?? 0}
                </td>
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

function Kpi({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{value}</div>
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
