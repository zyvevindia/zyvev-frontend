import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  STATUS_LABELS,
  statusTone,
  canHumanApprove,
  canHumanExecute,
} from "../../agents/orchestrator/agentStatus.js";
import { AGENT_IDS } from "../../agents/orchestrator/agentRegistry.js";
import {
  apiApproveOrchestratorExecution,
  apiExecuteOrchestratorApproved,
  apiGetOrchestratorDashboard,
  apiListOrchestratorExecutions,
  apiRejectOrchestratorExecution,
  apiRunOrchestratorAgent,
} from "../../services/orchestratorApi.js";
import { adminBadge, adminCard } from "./adminOpsStyles.js";

const card = { ...adminCard, marginBottom: "1rem" };

const btnPrimary = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};

const btnSecondary = {
  ...btnPrimary,
  background: "#e2e8f0",
  color: "#0f172a",
};

const btnSuccess = {
  ...btnPrimary,
  background: "#166534",
};

const btnDanger = {
  ...btnPrimary,
  background: "#991b1b",
};

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDuration(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export default function AgentsDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [activeExecutionId, setActiveExecutionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simFamilySlug, setSimFamilySlug] = useState("tata-nexon-ev");

  const reviewer =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "admin"
      : "admin";

  const refresh = useCallback(() => {
    const data = apiGetOrchestratorDashboard();
    setDashboard(data);
    setExecutions(apiListOrchestratorExecutions({ limit: 50 }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeExecution = useMemo(
    () => executions.find((e) => e.id === activeExecutionId) || null,
    [executions, activeExecutionId]
  );

  async function handleSimulate(agentId) {
    setLoading(true);
    setError("");
    try {
      const result = await apiRunOrchestratorAgent(agentId, {
        familySlug: simFamilySlug,
        label: `Orchestrator simulation — ${simFamilySlug}`,
      });
      if (!result.ok) {
        setError(result.errors?.join("; ") || "Simulation failed");
      } else {
        setActiveExecutionId(result.executionId);
      }
      refresh();
    } catch (e) {
      setError(e?.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(executionId) {
    const res = apiApproveOrchestratorExecution(executionId, {
      approvedBy: reviewer,
    });
    if (!res.ok) setError(res.errors?.join("; "));
    else setError("");
    refresh();
  }

  async function handleReject(executionId) {
    const res = apiRejectOrchestratorExecution(executionId, {
      rejectedBy: reviewer,
      reason: "Rejected from agent dashboard",
    });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  async function handleExecute(executionId) {
    setLoading(true);
    const res = await apiExecuteOrchestratorApproved(executionId, {
      executedBy: reviewer,
    });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
    setLoading(false);
  }

  const metrics = dashboard?.metrics;
  const governance = dashboard?.governance;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <nav style={{ marginBottom: "1rem", fontSize: 14 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/vehicle-creation">Vehicle Creation</Link>
        {" · "}
        <Link to="/admin/change-detection">Change Detection</Link>
        {" · "}
        <Link to="/admin/seo">SEO Agent</Link>
        {" · "}
        <Link to="/admin/monitoring">Monitoring Agent</Link>
        {" · "}
        <Link to="/admin/audit">Audit Agent</Link>
        {" · "}
        <Link to="/admin/analytics">Analytics Agent</Link>
        {" · "}
        <Link to="/admin/catalog-ingestion">Catalog Import</Link>
      </nav>

      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.5rem" }}>
          EVSavari Agent Platform
        </h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
          Human-governed agent ecosystem. Agents recommend — humans approve —
          no autonomous publishing.
        </p>
      </header>

      {error ? (
        <div
          style={{
            ...card,
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      ) : null}

      {governance && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: "1rem",
          }}
        >
          <MetricTile
            label="Success rate"
            value={
              metrics?.successRatePct != null
                ? `${metrics.successRatePct}%`
                : "—"
            }
          />
          <MetricTile
            label="Failure rate"
            value={
              metrics?.failureRatePct != null
                ? `${metrics.failureRatePct}%`
                : "—"
            }
          />
          <MetricTile
            label="Avg duration"
            value={formatDuration(metrics?.averageDurationMs)}
          />
          <MetricTile
            label="Human approvals"
            value={metrics?.humanApprovals ?? 0}
          />
          <MetricTile
            label="Rejected"
            value={metrics?.rejectedActions ?? 0}
          />
          <MetricTile
            label="Governance"
            value={
              governance.passed ? "No autonomous actions" : "Violation!"
            }
            tone={governance.passed ? "green" : "red"}
          />
        </div>
      )}

      <div style={card}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
          Simulate agent run (read-only score / simulated VC & CD)
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={simFamilySlug}
            onChange={(e) => setSimFamilySlug(e.target.value)}
            placeholder="family slug"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              minWidth: 200,
            }}
          />
          <button
            type="button"
            style={btnSecondary}
            disabled={loading}
            onClick={() => handleSimulate(AGENT_IDS.SCORE_ENGINE)}
          >
            Run Score Engine
          </button>
          <button
            type="button"
            style={btnSecondary}
            disabled={loading}
            onClick={() => handleSimulate(AGENT_IDS.VEHICLE_CREATION)}
          >
            Simulate Vehicle Creation
          </button>
          <button
            type="button"
            style={btnSecondary}
            disabled={loading}
            onClick={() => handleSimulate(AGENT_IDS.CHANGE_DETECTION)}
          >
            Simulate Change Detection
          </button>
        </div>
        <p style={{ margin: "0.75rem 0 0", fontSize: 13, color: "#64748b" }}>
          VC/CD simulations use golden dossier data without live OEM fetch.
          Approve → Execute to record human-governed action (no auto-publish).
        </p>
      </div>

      <div style={card}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Registered agents</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "8px 6px" }}>Agent</th>
                <th style={{ padding: "8px 6px" }}>Last run</th>
                <th style={{ padding: "8px 6px" }}>Status</th>
                <th style={{ padding: "8px 6px" }}>Recommendation</th>
                <th style={{ padding: "8px 6px" }}>Approval</th>
                <th style={{ padding: "8px 6px" }}>Runs</th>
                <th style={{ padding: "8px 6px" }}></th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.agents || []).map((agent) => (
                <tr key={agent.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 6px" }}>
                    <strong>{agent.label}</strong>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {agent.name}
                      {agent.version ? ` v${agent.version}` : ""}
                      {agent.placeholder ? " (placeholder)" : ""}
                    </div>
                  </td>
                  <td style={{ padding: "10px 6px", fontSize: 13 }}>
                    {formatTime(agent.lastRun)}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <span style={adminBadge(statusTone(agent.status))}>
                      {STATUS_LABELS[agent.status] || agent.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 6px", fontSize: 13 }}>
                    {agent.recommendation?.label || "—"}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    {agent.placeholder
                      ? "—"
                      : agent.approvalRequired
                        ? "Required"
                        : "Not required"}
                  </td>
                  <td style={{ padding: "10px 6px" }}>{agent.runCount ?? 0}</td>
                  <td style={{ padding: "10px 6px" }}>
                    {agent.adminRoute ? (
                      <Link to={agent.adminRoute}>Open →</Link>
                    ) : agent.placeholder ? (
                      <span style={{ color: "#94a3b8" }}>Coming soon</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
            Execution history
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {executions.length === 0 ? (
              <li style={{ color: "#64748b", fontSize: 14 }}>No executions yet.</li>
            ) : (
              executions.map((exec) => (
                <li key={exec.id} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveExecutionId(exec.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border:
                        activeExecutionId === exec.id
                          ? "2px solid #1d4ed8"
                          : "1px solid #e2e8f0",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {exec.agentName}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {formatTime(exec.createdAt)} ·{" "}
                      <span style={adminBadge(statusTone(exec.status))}>
                        {STATUS_LABELS[exec.status]}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
            Execution detail
          </h2>
          {!activeExecution ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Select an execution to review.
            </p>
          ) : (
            <>
              <DetailRow label="Agent" value={activeExecution.agentName} />
              <DetailRow
                label="Status"
                value={STATUS_LABELS[activeExecution.status]}
              />
              <DetailRow
                label="Duration"
                value={formatDuration(activeExecution.durationMs)}
              />
              <DetailRow
                label="Recommendation"
                value={activeExecution.recommendation?.summary || "—"}
              />
              <DetailRow
                label="Approval required"
                value={activeExecution.approvalRequired ? "Yes" : "No"}
              />
              {activeExecution.approval?.approvedBy && (
                <DetailRow
                  label="Approved by"
                  value={activeExecution.approval.approvedBy}
                />
              )}
              {activeExecution.executedAt && (
                <DetailRow
                  label="Executed at"
                  value={formatTime(activeExecution.executedAt)}
                />
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {canHumanApprove(activeExecution.status) && (
                  <>
                    <button
                      type="button"
                      style={btnSuccess}
                      onClick={() => handleApprove(activeExecution.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      style={btnDanger}
                      onClick={() => handleReject(activeExecution.id)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {canHumanExecute(activeExecution.status) && (
                  <button
                    type="button"
                    style={btnPrimary}
                    disabled={loading}
                    onClick={() => handleExecute(activeExecution.id)}
                  >
                    Execute approved action
                  </button>
                )}
              </div>

              <details style={{ marginTop: 12, fontSize: 12 }}>
                <summary>Input / output</summary>
                <pre
                  style={{
                    overflow: "auto",
                    background: "#f8fafc",
                    padding: 8,
                    borderRadius: 8,
                    maxHeight: 240,
                  }}
                >
                  {JSON.stringify(
                    {
                      input: activeExecution.input,
                      output: activeExecution.output,
                      recommendation: activeExecution.recommendation,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </>
          )}
        </div>
      </div>

      <div style={{ ...card, marginTop: 16, background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>
          Execution model
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.55 }}>
          Agent → Recommendation → Human Review → Approve → Execute. The
          orchestrator never publishes catalog changes without an explicit human
          approval and execute step.
        </p>
      </div>
    </div>
  );
}

function MetricTile({ label, value, tone = "neutral" }) {
  return (
    <div
      style={{
        ...adminCard,
        marginBottom: 0,
        padding: "0.85rem 1rem",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
        <span style={adminBadge(tone)}>{value}</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        padding: "4px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}
