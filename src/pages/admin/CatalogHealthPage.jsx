import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import normalizeCar from "../../utils/normalizeCar";
import { safeFetchJsonWithRetry } from "../../utils/safeFetch";
import {
  buildCatalogHealthRows,
  summarizeCatalogHealth,
  sortByHealthPriority,
  detectDuplicateVariants,
  CATALOG_HEALTH_STATUS,
} from "../../ops/catalogHealthScore";
import { TIER1_FAMILY_SLUGS } from "../../ops/tier1Families";
import { resolveFamilySlugFromCar } from "../../media/familyMediaManifest";
import { adminBadge, adminCard, statusTone } from "./adminOpsStyles";

export default function CatalogHealthPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tier1Only, setTier1Only] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [auditedAt, setAuditedAt] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState({
    count: 0,
    duplicateSlugs: new Set(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await safeFetchJsonWithRetry(`${API_URL}/cars?limit=100`, {
      label: "catalog-health",
      timeoutMs: 20000,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Failed to load catalog");
      setCars([]);
      return;
    }
    const normalized = (result.data?.cars || []).map(normalizeCar);
    setCars(normalized);
    const dup = detectDuplicateVariants(normalized);
    setAuditedAt(new Date().toISOString());
    setDuplicateInfo(dup);
  }, []);

  const rows = useMemo(() => {
    let list = buildCatalogHealthRows(cars, {
      duplicateSlugs: duplicateInfo.duplicateSlugs || new Set(),
    });
    if (tier1Only) {
      list = list.filter((r) => {
        const car = cars.find((c) => c.slug === r.slug);
        const family = car ? resolveFamilySlugFromCar(car) : "";
        return TIER1_FAMILY_SLUGS.includes(family);
      });
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (severityFilter !== "all") {
      list = list.filter((r) => r.severity === severityFilter);
    }
    return [...list].sort(sortByHealthPriority);
  }, [cars, tier1Only, statusFilter, severityFilter, duplicateInfo]);

  const summary = useMemo(() => summarizeCatalogHealth(rows), [rows]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/catalog-ops">Catalog intelligence ops</Link>
        {" · "}
        <Link to="/admin/system-status">System status</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Catalog health</h1>
      <p style={{ color: "#64748b", maxWidth: 680 }}>
        Deterministic READY / PARTIAL / NEEDS_REVIEW scoring from specs,
        intelligence, and trust freshness.
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
          marginBottom: 16,
        }}
      >
        {loading ? "Auditing…" : "Run catalog health audit"}
      </button>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      {auditedAt ? (
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 12 }}>
          Last audit: {new Date(auditedAt).toLocaleString("en-IN")}
          {duplicateInfo.count > 0
            ? ` · ${duplicateInfo.count} possible duplicate variant(s)`
            : ""}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div style={adminCard}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Audited</div>
                <strong>{summary.total}</strong>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>READY</div>
                <strong>{summary.counts[CATALOG_HEALTH_STATUS.READY]}</strong>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>PARTIAL</div>
                <strong>{summary.counts[CATALOG_HEALTH_STATUS.PARTIAL]}</strong>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>NEEDS_REVIEW</div>
                <strong>
                  {summary.counts[CATALOG_HEALTH_STATUS.NEEDS_REVIEW]}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Compare ready</div>
                <strong>{summary.compareReadyPercent}%</strong>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Image ready</div>
                <strong>{summary.imageReadyCount}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={{ fontSize: "0.875rem" }}>
              <input
                type="checkbox"
                checked={tier1Only}
                onChange={(e) => setTier1Only(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Tier-1 OEMs only
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6 }}
            >
              <option value="all">All statuses</option>
              <option value={CATALOG_HEALTH_STATUS.READY}>READY</option>
              <option value={CATALOG_HEALTH_STATUS.PARTIAL}>PARTIAL</option>
              <option value={CATALOG_HEALTH_STATUS.NEEDS_REVIEW}>
                NEEDS_REVIEW
              </option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6 }}
            >
              <option value="all">All severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                fontSize: "0.85rem",
                borderCollapse: "collapse",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                  <th style={{ padding: 10 }}>Vehicle</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Missing</th>
                  <th style={{ padding: 10 }}>Severity</th>
                  <th style={{ padding: 10 }}>Images</th>
                  <th style={{ padding: 10 }}>Compare</th>
                  <th style={{ padding: 10 }}>SEO</th>
                  <th style={{ padding: 10 }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 10 }}>
                      <strong>{row.name}</strong>
                      <div>
                        <code style={{ fontSize: "0.75rem" }}>{row.slug}</code>
                      </div>
                    </td>
                    <td style={{ padding: 10 }}>
                      <span style={adminBadge(statusTone[row.status])}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      {row.missingFields.length
                        ? row.missingFields.join(", ")
                        : "—"}
                      {row.isDuplicate ? (
                        <div style={{ fontSize: "0.75rem", color: "#b45309" }}>
                          duplicate variant
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: 10 }}>
                      <span style={adminBadge(row.severity === "high" ? "red" : row.severity === "medium" ? "yellow" : "neutral")}>
                        {row.severity}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <span
                        style={adminBadge(row.imageReady ? "green" : "yellow")}
                      >
                        {row.imageReady ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <span
                        style={adminBadge(row.compareReady ? "green" : "yellow")}
                      >
                        {row.compareReady ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <span
                        style={adminBadge(row.seoReady ? "green" : "yellow")}
                      >
                        {row.seoReady ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: 10, color: "#64748b" }}>
                      {row.reasons[0] || row.audit?.summary || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
