import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildBehavioralIntelligenceReport } from "../../ops/behavioralIntelligenceOps";
import { buildBetaWeeklySummary } from "../../ops/betaStabilizationOps";
import BetaWeeklySummarySection from "./BetaWeeklySummarySection";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function BehavioralIntelligencePage() {
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
    () => (ctx ? buildBehavioralIntelligenceReport(ctx) : null),
    [ctx]
  );
  const weekly = useMemo(
    () => (ctx ? buildBetaWeeklySummary(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Behavioral intelligence"
      description="Compare engagement, completion, trust trends, and conversion signals — session-scoped buffer only (no fingerprinting)."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="behavioral-intelligence"
            rows={report.weeklySnapshots}
            fullReport={report}
            filenamePrefix="behavioral-intelligence"
            mapCsvRow={(s) => ({
              week: s.week,
              engagementQuality: s.engagementQuality,
              completionPct: s.completionPct,
              conversionConfidence: s.conversionConfidence,
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
              title="Journey weekly summary"
              compact
            />
          ) : null}
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                {
                  label: "Engagement quality",
                  value: report.engagementQuality,
                },
                {
                  label: "Compare completion %",
                  value: `${report.compareCompletionPct}%`,
                },
                {
                  label: "Trust trend",
                  value: report.recommendationTrustTrend,
                },
                {
                  label: "Conversion confidence",
                  value: report.globalSignals.lead_submitted,
                  hint: `started ${report.globalSignals.lead_started}`,
                },
                {
                  label: "Confusion flags",
                  value: report.confusionIndicators.length,
                },
                {
                  label: "Guidance engagement",
                  value: report.guidanceEngagement ?? 0,
                },
                {
                  label: "Rec. stability",
                  value: report.recommendationStabilityTrend,
                },
                {
                  label: "Charging realism",
                  value: report.chargingRealismTrend,
                },
              ]}
            />
          </div>

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Global signals (buffer)</h3>
            <pre style={{ fontSize: "0.8rem", overflow: "auto" }}>
              {JSON.stringify(report.globalSignals, null, 2)}
            </pre>
          </div>

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Top converting compare pairs</h3>
          <OpsTable
            columns={[
              {
                key: "pair",
                label: "Pair",
                render: (r) => <code>{r.pairSlug}</code>,
              },
              { key: "q", label: "Quality", render: (r) => r.compareQualityScore },
              { key: "c", label: "Credibility", render: (r) => r.credibilityScore },
            ]}
            rows={report.topConvertingComparePairs}
            emptyLabel="No strong pairs yet."
          />
          </div>

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Low-trust compare pairs</h3>
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
            ]}
            rows={report.lowTrustComparePairs}
            emptyLabel="None flagged."
          />
          </div>
        </>
      ) : null}
    </PostLaunchAdminShell>
  );
}
