import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  collectDeploymentDiagnostics,
  collectRuntimeEnvRows,
  runSystemHealthProbe,
} from "../../utils/systemStatus";
import { adminBadge, adminCard } from "./adminOpsStyles";

function HealthDot({ state }) {
  const color =
    state === "green"
      ? "#22c55e"
      : state === "yellow"
        ? "#eab308"
        : "#ef4444";
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        marginRight: 8,
      }}
      aria-hidden
    />
  );
}

export default function SystemStatusPage() {
  const build = collectDeploymentDiagnostics();
  const envRows = collectRuntimeEnvRows();
  const [health, setHealth] = useState(null);
  const [probing, setProbing] = useState(false);

  const runProbe = useCallback(async () => {
    setProbing(true);
    try {
      const result = await runSystemHealthProbe();
      setHealth(result);
    } finally {
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    runProbe();
  }, [runProbe]);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/launch-checklist">Launch checklist</Link>
        {" · "}
        <Link to="/admin/media-health">Media health</Link>
        {" · "}
        <Link to="/admin/catalog-health">Catalog health</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>System status</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Runtime environment diagnostics for production verification. Admin-only;
        not linked from public routes.
      </p>

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Build metadata</h2>
        <table style={{ width: "100%", fontSize: "0.85rem" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", fontWeight: 600 }}>Release</td>
              <td>{build.releaseVersion}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontWeight: 600 }}>Commit</td>
              <td>
                <code>{build.commit}</code>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontWeight: 600 }}>Built at</td>
              <td>{build.builtAtFormatted}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontWeight: 600 }}>Environment</td>
              <td>
                {build.environment} ({build.mode})
              </td>
            </tr>
          </tbody>
        </table>
        {build.apiMisconfigured ? (
          <p style={{ color: "#b91c1c", marginTop: 12, fontSize: "0.9rem" }}>
            Production API URL points at localhost — fix VITE_API_URL on Vercel.
          </p>
        ) : null}
      </div>

      <div style={adminCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>API health</h2>
          <button
            type="button"
            onClick={runProbe}
            disabled={probing}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 600,
              cursor: probing ? "wait" : "pointer",
            }}
          >
            {probing ? "Checking…" : "Re-check"}
          </button>
        </div>
        {health ? (
          <>
            <p style={{ marginTop: 12 }}>
              <HealthDot state={health.apiState} />
              <span style={adminBadge(health.apiState)}>
                {health.apiStateLabel}
              </span>
              {health.likelyColdStart ? (
                <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "#854d0e" }}>
                  Likely cold start
                </span>
              ) : null}
              {health.timeoutDetected ? (
                <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "#b91c1c" }}>
                  Timeout detected
                </span>
              ) : null}
            </p>
            <ul style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.7 }}>
              <li>Base URL: {build.apiUrl}</li>
              <li>
                Latency: {health.api.latencyMs}ms · Status:{" "}
                {health.api.status || "—"}
              </li>
              <li>
                Catalog total: {health.api.total ?? "—"}
                {health.api.error ? ` · Error: ${health.api.error}` : ""}
              </li>
              <li>Checked: {health.checkedAt}</li>
            </ul>
            <h3 style={{ fontSize: "0.95rem", marginTop: 16 }}>Cloudinary tier-1 probe</h3>
            <p style={{ margin: "8px 0" }}>
              <HealthDot state={health.cloudinaryState} />
              <span style={adminBadge(health.cloudinaryState)}>
                {health.cloudinaryStateLabel}
              </span>
            </p>
            <ul style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.7 }}>
              <li>
                URLs checked: {health.cloudinary?.checked ?? "—"} · Broken:{" "}
                {health.cloudinary?.broken ?? 0}
              </li>
            </ul>
          </>
        ) : (
          <p style={{ color: "#64748b" }}>Running probe…</p>
        )}
      </div>

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Cloudinary</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          Cloud: <strong>{build.cloudinaryCloud}</strong> · Prefix:{" "}
          <code>{build.cloudinaryPrefix}</code>
        </p>
      </div>

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Analytics & monitoring</h2>
        <ul style={{ fontSize: "0.9rem", lineHeight: 1.8, margin: 0 }}>
          <li>
            Analytics master switch:{" "}
            <span style={adminBadge(build.analytics.enabled ? "green" : "neutral")}>
              {build.analytics.enabled ? "On" : "Off"}
            </span>
          </li>
          <li>GA4: {build.analytics.ga4 ? "configured" : "not configured"}</li>
          <li>PostHog: {build.analytics.posthog ? "configured" : "not configured"}</li>
          <li>
            Sentry: {build.analytics.sentry ? "configured" : "not configured"}
            {build.analytics.sentry
              ? ` (traces ${build.analytics.sentrySampleRate})`
              : ""}
          </li>
          <li>App env tag: {build.analytics.appEnv}</li>
        </ul>
      </div>

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Environment variables</h2>
        <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b" }}>
              <th>Variable</th>
              <th>Baked / resolved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {envRows.map((row) => (
              <tr key={row.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "8px 8px 8px 0", fontWeight: 600 }}>
                  {row.key}
                </td>
                <td style={{ padding: "8px 0", color: "#475569" }}>
                  {row.value}
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    → {row.resolved}
                  </div>
                </td>
                <td style={{ padding: "8px 0" }}>
                  <span style={adminBadge(row.ok ? "green" : "red")}>
                    {row.ok ? "OK" : "Check"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
