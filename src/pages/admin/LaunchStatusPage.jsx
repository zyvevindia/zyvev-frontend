import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import { LAUNCH_PROFILE } from "../../config/launchProfiles";
import { runLaunchValidation } from "../../launch/launchValidation";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1.25rem",
};

const badge = (ok) => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  background: ok ? "#dcfce7" : "#fee2e2",
  color: ok ? "#166534" : "#991b1b",
});

function StatusRow({ label, ok, detail }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        padding: "8px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ fontWeight: 600, color: "#334155" }}>{label}</span>
      <span style={{ textAlign: "right", fontSize: "0.85rem", color: "#64748b" }}>
        <span style={badge(ok)}>{ok ? "OK" : "FAIL"}</span>
        {detail ? (
          <div style={{ marginTop: "4px" }}>{detail}</div>
        ) : null}
      </span>
    </div>
  );
}

export default function LaunchStatusPage() {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const runChecks = useCallback(async () => {
    setRunning(true);
    setError("");
    try {
      const result = await runLaunchValidation();
      setReport(result);
    } catch (err) {
      setError(err?.message || "Validation failed");
      setReport(null);
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/ops-qa">Operational QA</Link>
        {" · "}
        <Link to="/admin/ops-snapshot">Ops snapshot</Link>
        {" · "}
        <Link to="/admin/catalog-ops">Catalog intelligence ops</Link>
        {" · "}
        <Link to="/admin/soft-launch-ops">Soft launch ops</Link>
        {" · "}
        <Link to="/admin/launch-readiness">Traffic readiness checklist</Link>
        {" · "}
        <Link to="/admin/media-qa">Media QA</Link>
        {" · "}
        <Link to="/admin/system-status">System status</Link>
        {" · "}
        <Link to="/admin/media-health">Media health</Link>
        {" · "}
        <Link to="/admin/catalog-health">Catalog health</Link>
        {" · "}
        <Link to="/admin/launch-checklist">Launch checklist</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Launch status</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Lightweight production diagnostics for Day-2 launch. Safe to remove after
        stabilization.
      </p>

      <div style={card}>
        <button
          type="button"
          onClick={runChecks}
          disabled={running}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: running ? "wait" : "pointer",
          }}
        >
          {running ? "Running checks…" : "Run launch validation"}
        </button>
        {error ? (
          <p style={{ color: "#dc2626", marginTop: "12px" }}>{error}</p>
        ) : null}
      </div>

      {report ? (
        <>
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Summary</h2>
            <p style={{ margin: "0 0 12px" }}>
              <span style={badge(report.ok)}>
                {report.ok ? "Launch checks passed" : "Issues detected"}
              </span>
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
              Checked at: {report.checkedAt}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              API: {API_URL} · Profile: {LAUNCH_PROFILE || "(unset)"} · Mode:{" "}
              {report.env?.mode}
            </p>
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>API health</h2>
            <StatusRow
              label="Catalog reachable"
              ok={report.api?.ok}
              detail={
                report.api?.ok
                  ? `${report.api.latencyMs}ms · total ${report.api.total ?? "—"}`
                  : report.api?.error
              }
            />
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Image / Cloudinary</h2>
            <StatusRow
              label="Tier-1 asset probe"
              ok={report.cloudinary?.ok}
              detail={
                report.cloudinary?.ok
                  ? `${report.cloudinary.checked} URLs OK`
                  : `${report.cloudinary?.broken ?? 0} broken`
              }
            />
            {report.cloudinary?.failures?.length > 0 ? (
              <ul style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "8px" }}>
                {report.cloudinary.failures.slice(0, 6).map((f) => (
                  <li key={f.url}>
                    {f.url} ({f.status || f.error || "fail"})
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Launch families</h2>
            <StatusRow
              label="Catalog coverage"
              ok={report.catalog?.families?.ok}
              detail={
                report.catalog?.families
                  ? `${report.catalog.families.found}/${report.catalog.families.expected} families`
                  : report.catalog?.error
              }
            />
            {report.catalog?.families?.missing?.length > 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#b45309" }}>
                Missing: {report.catalog.families.missing.join(", ")}
              </p>
            ) : null}
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Environment</h2>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "6px 0" }}>Variable</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {report.env?.rows?.map((row) => (
                  <tr key={row.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 8px 8px 0", fontWeight: 600 }}>
                      {row.key}
                    </td>
                    <td style={{ padding: "8px 0", color: "#475569" }}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            CLI: <code>npm run launch:validate</code> · Docs:{" "}
            <code>docs/launch/production-verification.md</code>
          </p>
        </>
      ) : null}
    </div>
  );
}
