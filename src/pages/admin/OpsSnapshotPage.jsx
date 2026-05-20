import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

function CounterGrid({ counters = {} }) {
  const rows = Object.entries(counters);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
      }}
    >
      {rows.map(([key, value]) => (
        <div
          key={key}
          style={{
            background: "#f8fafc",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            {key.replace(/([A-Z])/g, " $1")}
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OpsSnapshotPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (withDb = false) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Admin login required");
      }

      const res = await fetch(
        `${API_URL}/api/admin/ops-snapshot?db=${withDb ? "true" : "false"}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      setSnapshot(data);
    } catch (err) {
      setError(err?.message || "Failed to load snapshot");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
      <p>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/launch-status">Launch status</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Ops snapshot</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Lightweight in-process counters since last API restart. For persistent
        analytics use GA4 / PostHog; for CRM use lead exports.
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <button type="button" onClick={() => load(false)} disabled={loading}>
          {loading ? "Loading…" : "Refresh snapshot"}
        </button>
        <button type="button" onClick={() => load(true)} disabled={loading}>
          Include DB summary
        </button>
      </div>

      {error && (
        <p style={{ color: "#dc2626" }} role="alert">
          {error}
        </p>
      )}

      {snapshot && (
        <>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Counters</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Started {snapshot.startedAt} · Generated {snapshot.generatedAt}
            </p>
            <CounterGrid counters={snapshot.counters} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Top viewed EVs</h2>
            <ul>
              {(snapshot.topViewedEvs || []).map((row) => (
                <li key={row.key}>
                  {row.key} — {row.count}
                </li>
              ))}
            </ul>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Top compare combinations</h2>
            <ul>
              {(snapshot.topCompareCombinations || []).map((row) => (
                <li key={row.vehicles.join("|")}>
                  {row.vehicles.join(" vs ")} — {row.count}
                </li>
              ))}
            </ul>
          </section>

          {snapshot.recentErrors?.length > 0 && (
            <section style={card}>
              <h2 style={{ marginTop: 0 }}>Recent errors</h2>
              <pre
                style={{
                  fontSize: "0.8rem",
                  overflow: "auto",
                  background: "#f8fafc",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                {JSON.stringify(snapshot.recentErrors, null, 2)}
              </pre>
            </section>
          )}

          {snapshot.dbSummary && (
            <section style={card}>
              <h2 style={{ marginTop: 0 }}>Database summary</h2>
              <pre
                style={{
                  fontSize: "0.8rem",
                  overflow: "auto",
                  background: "#f8fafc",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                {JSON.stringify(snapshot.dbSummary, null, 2)}
              </pre>
            </section>
          )}
        </>
      )}
    </div>
  );
}
