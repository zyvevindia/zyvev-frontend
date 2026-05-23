import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildRecommendationMaturityReport } from "../../ops/recommendationMaturityOps";
import { buildCalibrationReviewQueues } from "../../ops/betaStabilizationOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function RecommendationMaturityPage() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCtx(await loadPostLaunchOpsContext());
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const report = useMemo(
    () => (ctx ? buildRecommendationMaturityReport(ctx) : null),
    [ctx]
  );
  const queues = useMemo(
    () => (ctx ? buildCalibrationReviewQueues(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Recommendation maturity"
      description="TRUSTED / MATURE / DEVELOPING / NEEDS_REVIEW / LOW_CONFIDENCE — maturity trends, trust decay, and weak recommendation clusters."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="recommendation-maturity"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="recommendation-maturity"
            mapCsvRow={(r) => ({
              slug: r.slug,
              status: r.status,
              recommendationMaturityScore: r.recommendationMaturityScore,
              trustVolatility: r.trustVolatility,
              flags: r.flags.join("; "),
            })}
          />
        ) : null
      }
    >
      {report ? (
        <>
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                { label: "Trusted %", value: `${report.trustedPct}%` },
                { label: "TRUSTED", value: report.statusCounts.TRUSTED },
                { label: "MATURE", value: report.statusCounts.MATURE },
                { label: "DEVELOPING", value: report.statusCounts.DEVELOPING },
                {
                  label: "NEEDS_REVIEW",
                  value:
                    report.statusCounts.NEEDS_REVIEW +
                    report.statusCounts.LOW_CONFIDENCE,
                },
                { label: "Maturity trend", value: report.maturityTrend },
                {
                  label: "Trust decay alerts",
                  value: report.trustDecayAlerts.length,
                },
              ]}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Per-EV maturity</h3>
            <OpsTable
              columns={[
                {
                  key: "vehicle",
                  label: "Vehicle",
                  render: (r) => <code>{r.slug}</code>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => (
                    <span style={adminBadge(statusTone.warn)}>{r.status}</span>
                  ),
                },
                {
                  key: "mat",
                  label: "Maturity",
                  render: (r) => r.recommendationMaturityScore,
                },
                {
                  key: "own",
                  label: "Ownership mat.",
                  render: (r) => r.ownershipConfidenceMaturity,
                },
                {
                  key: "chg",
                  label: "Charging mat.",
                  render: (r) => r.chargingRealismMaturity,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={report.rows.slice(0, 25).map((r) => ({
                ...r,
                _key: r.slug,
              }))}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Immature compare pairs</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => (
                    <span style={adminBadge(statusTone.warn)}>{r.status}</span>
                  ),
                },
                {
                  key: "avg",
                  label: "Avg maturity",
                  render: (r) => r.avgMaturity,
                },
                {
                  key: "flags",
                  label: "Flags",
                  render: (r) => r.flags.join(", ") || "—",
                },
              ]}
              rows={report.immatureRecommendationPairs.map((p) => ({
                ...p,
                _key: p.pairSlug,
              }))}
            />
          </div>

          {queues ? (
            <div style={adminCard}>
              <h3 style={{ marginTop: 0 }}>Calibration review queues</h3>
              <p style={{ fontSize: "0.8rem" }}>
                Calibration ({queues.calibrationReviewQueue.length}) · Unstable (
                {queues.unstableRecommendationQueue.length}) · Weak realism (
                {queues.weakRealismReviewQueue.length})
              </p>
            </div>
          ) : null}

          {report.trustDecayAlerts.length > 0 ? (
            <div style={adminCard}>
              <h3 style={{ marginTop: 0 }}>Trust decay alerts</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {report.trustDecayAlerts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </PostLaunchAdminShell>
  );
}
