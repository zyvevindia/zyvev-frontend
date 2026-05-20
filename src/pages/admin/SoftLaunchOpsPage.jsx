import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import normalizeCar from "../../utils/normalizeCar";
import { buildContentOpsSummary } from "../../intelligence/contentOpsAudit.js";
import { summarizeLocalFeedback } from "../../services/feedbackApi";
import { safeFetchJson } from "../../utils/safeFetch";
import {
  computeOpsTrafficAlerts,
  prioritizeHighTrafficWeakModels,
} from "../../utils/opsTrafficAlerts.js";

import "../../styles/ev-trust.css";

export default function SoftLaunchOpsPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [feedbackDigest, setFeedbackDigest] = useState(0);

  const feedbackSummary = useMemo(
    () => summarizeLocalFeedback(),
    [feedbackDigest, snapshot]
  );

  const trafficAlerts = useMemo(
    () => computeOpsTrafficAlerts(snapshot, feedbackSummary),
    [snapshot, feedbackSummary]
  );

  const weakHighTraffic = useMemo(
    () =>
      snapshot
        ? prioritizeHighTrafficWeakModels(
            snapshot.liveOps,
            snapshot.vehicles || []
          )
        : [],
    [snapshot]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      const catalogRes = await safeFetchJson(`${API_URL}/cars?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        label: "soft_launch_catalog",
      });

      if (!catalogRes.ok) {
        throw new Error(catalogRes.error || "Catalog fetch failed");
      }

      const normalized = (catalogRes.data?.cars || []).map(normalizeCar);
      const summary = buildContentOpsSummary(normalized);

      if (token) {
        const opsRes = await safeFetchJson(
          `${API_URL}/api/admin/ops-snapshot?db=false`,
          {
            headers: { Authorization: `Bearer ${token}` },
            label: "ops_snapshot",
          }
        );
        if (opsRes.ok) {
          summary.liveOps = opsRes.data;
        }
      }

      setSnapshot(summary);
      setFeedbackDigest((d) => d + 1);
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const content = snapshot?.contentOps;

  return (
    <div className="catalog-ops-page">
      <p>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/catalog-ops">Catalog ops</Link>
        {" · "}
        <Link to="/admin/ops-snapshot">Ops snapshot</Link>
        {" · "}
        <Link to="/admin/launch-readiness">Traffic readiness</Link>
        {" · "}
        <Link to="/admin/real-usage-learning">Real usage learning</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Soft launch operations</h1>
      <p style={{ color: "#64748b", maxWidth: 640 }}>
        Beta visibility — catalog quality, local feedback signals, and traffic
        highlights. Internal use only.
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
        {loading ? "Loading…" : "Refresh soft-launch dashboard"}
      </button>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="catalog-ops-metrics" style={{ marginTop: 20 }}>
        <div className="catalog-ops-metric">
          <strong>{feedbackSummary.usefulnessTotal}</strong>
          <span>Usefulness votes (local)</span>
        </div>
        <div className="catalog-ops-metric">
          <strong>{feedbackSummary.usefulnessYes}</strong>
          <span>Yes votes</span>
        </div>
        <div className="catalog-ops-metric">
          <strong>{feedbackSummary.usefulnessNo}</strong>
          <span>Not really</span>
        </div>
        <div className="catalog-ops-metric">
          <strong>{feedbackSummary.issueCount}</strong>
          <span>Issue reports (local buffer)</span>
        </div>
      </div>

      {snapshot && trafficAlerts.length > 0 && (
        <section
          style={{
            marginTop: 20,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #fde68a",
            background: "#fffbeb",
          }}
          aria-label="Traffic and catalog alerts"
        >
          <h2 style={{ margin: "0 0 8px", fontSize: "0.95rem", color: "#92400e" }}>
            Lightweight alerts
          </h2>
          <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#78350f", fontSize: "0.875rem" }}>
            {trafficAlerts.map((a) => (
              <li key={a.code} style={{ marginBottom: 6 }}>
                <strong>{a.level.toUpperCase()}</strong> — {a.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {snapshot && weakHighTraffic.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: "1rem" }}>Prioritize: high traffic × open issues</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
            Cross of API top-viewed slugs with catalog audit rows (internal enrichment queue).
          </p>
          <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
            {weakHighTraffic.map((row) => (
              <li key={row.slug}>
                <Link to={`/cars/${row.slug}`}>{row.name || row.slug}</Link> — {row.views}{" "}
                views · {row.issueCount} issue(s)
              </li>
            ))}
          </ul>
        </section>
      )}

      {snapshot && (
        <>
          <div className="catalog-ops-metrics">
            <div className="catalog-ops-metric">
              <strong>{snapshot.staleCount}</strong>
              <span>Stale / needs review</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{snapshot.unreviewedCount}</strong>
              <span>Unreviewed</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{snapshot.missingChargingCount}</strong>
              <span>Missing charging intel</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{snapshot.compareRiskCount}</strong>
              <span>Compare risks</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{content?.thinProfileCount ?? "—"}</strong>
              <span>Thin profiles</span>
            </div>
            <div className="catalog-ops-metric">
              <strong>{content?.compareCoveragePct ?? "—"}%</strong>
              <span>Compare guide coverage</span>
            </div>
          </div>

          {snapshot.liveOps?.topViewed?.length > 0 && (
            <section style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: "1rem" }}>Top viewed EVs (API)</h2>
              <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
                {snapshot.liveOps.topViewed.slice(0, 8).map((row) => (
                  <li key={row.slug || row.name}>
                    {row.name || row.slug} — {row.views ?? row.count} views
                  </li>
                ))}
              </ul>
            </section>
          )}

          {snapshot.liveOps?.topCompares?.length > 0 && (
            <section style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: "1rem" }}>Top compare combinations</h2>
              <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
                {snapshot.liveOps.topCompares.slice(0, 6).map((row, i) => (
                  <li key={i}>{row.label || row.slugs?.join(" vs ")}</li>
                ))}
              </ul>
            </section>
          )}

          {content?.discoveryGapNote && (
            <p style={{ color: "#b45309", fontSize: "0.875rem" }}>
              {content.discoveryGapNote}
            </p>
          )}
        </>
      )}
    </div>
  );
}
