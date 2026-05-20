import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import normalizeCar from "../../utils/normalizeCar";
import { buildCatalogOpsSummary } from "../../intelligence/catalogAudit.js";
import "../../styles/ev-trust.css";

export default function CatalogOpsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("issues");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/cars?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load catalog");
      const data = await res.json();
      setCars((data?.cars || []).map(normalizeCar));
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const summary = useMemo(
    () => (cars.length ? buildCatalogOpsSummary(cars) : null),
    [cars]
  );

  const filteredVehicles = useMemo(() => {
    if (!summary?.vehicles) return [];
    if (filter === "all") return summary.vehicles;
    if (filter === "stale") {
      return summary.vehicles.filter((v) => v.freshness?.isStale);
    }
    if (filter === "unreviewed") {
      return summary.vehicles.filter((v) => !v.reviewed);
    }
    return summary.vehicles.filter((v) => v.issueCount > 0);
  }, [summary, filter]);

  return (
    <div className="catalog-ops-page">
      <p style={{ marginBottom: 8 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/ops-qa">Operational QA</Link>
        {" · "}
        <Link to="/admin/launch-status">Launch status</Link>
        {" · "}
        <Link to="/admin/catalog-ingestion">Catalog ingestion</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Catalog intelligence ops</h1>
      <p style={{ color: "#64748b", maxWidth: 640 }}>
        Internal governance view — stale data, missing intelligence, and review
        queue signals. Deterministic audits only; no auto-publish.
      </p>

      <button
        type="button"
        onClick={load}
        disabled={loading}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: "#0f172a",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "Loading…" : "Run catalog audit"}
      </button>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {summary && (
        <>
          <div className="catalog-ops-metrics">
            <div className="catalog-ops-metric">
              <strong>{summary.totalVehicles}</strong>
              <span>Vehicles audited</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.staleCount}</strong>
              <span>Stale / needs review</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.unreviewedCount}</strong>
              <span>Unreviewed</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.incompleteIntelligenceCount}</strong>
              <span>Incomplete intelligence</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.missingChargingCount}</strong>
              <span>Missing charging intel</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.taxonomyMismatchCount}</strong>
              <span>Taxonomy gaps</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.compareRiskCount}</strong>
              <span>Compare risks</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{summary.escalationCount}</strong>
              <span>Escalations</span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8, fontSize: "0.875rem" }}>
              Filter:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6 }}
            >
              <option value="issues">With issues</option>
              <option value="stale">Stale only</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="all">All</option>
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="catalog-ops-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Freshness</th>
                  <th>Issues</th>
                  <th>Priority</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.slice(0, 50).map((row) => (
                  <tr
                    key={row.slug}
                    data-severity={row.severity}
                  >
                    <td>{row.name}</td>
                    <td>{row.freshness?.stateLabel || "—"}</td>
                    <td>{row.issueCount}</td>
                    <td>{row.reviewPriority || "—"}</td>
                    <td>{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 16 }}>
            Audited at {summary.auditedAt}. Change detection demo: compare two
            snapshots via{" "}
            <code>detectCatalogChanges(before, after)</code> in ops scripts.
          </p>
        </>
      )}
    </div>
  );
}
