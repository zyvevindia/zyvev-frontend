import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildTrustFeedbackReport } from "../../ops/trustFeedbackOps";
import { buildBetaWeeklySummary } from "../../ops/betaStabilizationOps";
import BetaWeeklySummarySection from "./BetaWeeklySummarySection";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function TrustFeedbackPage() {
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
    () => (ctx ? buildTrustFeedbackReport(ctx) : null),
    [ctx]
  );
  const weekly = useMemo(
    () => (ctx ? buildBetaWeeklySummary(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Trust feedback"
      description="Recommendation doubt clusters, guidance abandonment, volatility hotspots, and compare confusion — session buffer only."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="trust-feedback"
            rows={report.mostDoubtedComparePairs}
            fullReport={report}
            filenamePrefix="trust-feedback"
            mapCsvRow={(r) => ({
              pairSlug: r.pairSlug,
              doubtCount: r.count,
            })}
          />
        ) : null
      }
    >
      {report ? (
        <>
          {weekly ? (
            <BetaWeeklySummarySection
              summary={weekly}
              title="Doubt & guidance weekly"
              compact
            />
          ) : null}
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                {
                  label: "Trust friction",
                  value: report.trustFrictionScore,
                },
                {
                  label: "Confidence gap",
                  value: report.recommendationConfidenceGap,
                },
                {
                  label: "Realism disagreement",
                  value: report.compareRealismDisagreement,
                },
                {
                  label: "Switch after doubt",
                  value: report.compareSwitchAfterDoubt,
                },
                {
                  label: "Guidance engagement",
                  value: report.guidanceEngagementQuality,
                },
                {
                  label: "Confusion trend",
                  value: report.compareConfusionTrend,
                },
              ]}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most doubted compare pairs</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                { key: "count", label: "Doubt events", render: (r) => r.count },
              ]}
              rows={report.mostDoubtedComparePairs.map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="No doubt signals in buffer yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Abandoned after guidance</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                { key: "count", label: "Events", render: (r) => r.count },
              ]}
              rows={report.abandonedAfterGuidance.map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None recorded."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Trust volatility hotspots</h3>
            <OpsTable
              columns={[
                {
                  key: "slug",
                  label: "Vehicle",
                  render: (r) => <code>{r.slug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => (
                    <span style={adminBadge(statusTone.warn)}>{r.status}</span>
                  ),
                },
              ]}
              rows={report.trustVolatilityHotspots.map((r) => ({
                ...r,
                _key: r.slug,
              }))}
            />
          </div>

          {report.overconfidentButDistrusted?.length > 0 ? (
            <div style={adminCard}>
              <h3 style={{ marginTop: 0 }}>Overconfident but distrusted</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {report.overconfidentButDistrusted.map((r) => (
                  <li key={r.slug}>
                    {r.name || r.slug} — maturity {r.recommendationMaturityScore}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </PostLaunchAdminShell>
  );
}
