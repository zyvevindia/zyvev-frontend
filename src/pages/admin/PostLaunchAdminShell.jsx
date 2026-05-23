import { Link } from "react-router-dom";

import { adminCard } from "./adminOpsStyles";

const NAV = [
  { to: "/admin/catalog-intelligence", label: "Catalog intel" },
  { to: "/admin/ownership-intelligence", label: "Ownership intel" },
  { to: "/admin/recommendation-maturity", label: "Rec. maturity" },
  { to: "/admin/trust-feedback", label: "Trust feedback" },
  { to: "/admin/recommendation-refinement", label: "Rec. refinement" },
  { to: "/admin/conversion-refinement", label: "Conv. refinement" },
  { to: "/admin/content-usefulness", label: "Content usefulness" },
  { to: "/admin/behavioral-intelligence", label: "Behavioral intel" },
  { to: "/admin/media-staging", label: "Media staging" },
  { to: "/admin/behavioral-trust", label: "Behavioral trust" },
  { to: "/admin/public-beta-ops", label: "Trusted beta ops" },
  { to: "/admin/recommendation-realism", label: "Realism" },
  { to: "/admin/premium-ownership-journeys", label: "Premium ownership" },
  { to: "/admin/ownership-authority", label: "Ownership authority" },
  { to: "/admin/trusted-conversions", label: "Trusted conversions" },
  { to: "/admin/compare-calibration", label: "Compare calibration" },
  { to: "/admin/high-intent-journeys", label: "High-intent journeys" },
  { to: "/admin/user-insights", label: "User insights" },
  { to: "/admin/compare-quality", label: "Compare quality" },
  { to: "/admin/catalog-freshness", label: "Catalog freshness" },
  { to: "/admin/seo-authority", label: "SEO authority" },
  { to: "/admin/seo-opportunities", label: "SEO opportunities" },
  { to: "/admin/feedback-learning", label: "Feedback learning" },
  { to: "/admin/soft-launch-monitor", label: "Launch monitor" },
  { to: "/admin/performance-learning", label: "Performance" },
  { to: "/admin/system-status", label: "System status" },
];

export default function PostLaunchAdminShell({
  title,
  description,
  children,
  loading = false,
  error = "",
  onRefresh,
  lastLoaded,
  extraActions = null,
}) {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
      </p>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          marginBottom: "1.25rem",
          fontSize: "0.8rem",
        }}
        aria-label="Post-launch ops"
      >
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "#f1f5f9",
              color: "#0f172a",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <h1 style={{ marginTop: 0 }}>{title}</h1>
      {description ? (
        <p style={{ color: "#64748b", lineHeight: 1.6, maxWidth: 720 }}>
          {description}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Loading…" : "Refresh data"}
          </button>
        ) : null}
        {extraActions}
        {lastLoaded ? (
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Updated {new Date(lastLoaded).toLocaleString("en-IN")}
          </span>
        ) : null}
      </div>

      {error ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>
      ) : null}

      {children}
    </div>
  );
}

export function MetricGrid({ metrics = [] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "1rem",
      }}
    >
      {metrics.map((m) => (
        <div key={m.label}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{m.label}</div>
          <strong style={{ fontSize: "1.2rem" }}>{m.value}</strong>
          {m.hint ? (
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{m.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function OpsTable({ columns, rows, emptyLabel = "No rows" }) {
  if (!rows?.length) {
    return <p style={{ color: "#64748b" }}>{emptyLabel}</p>;
  }
  return (
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
            {columns.map((col) => (
              <th key={col.key} style={{ padding: 10 }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._key} style={{ borderTop: "1px solid #f1f5f9" }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: 10, verticalAlign: "top" }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { adminCard };
