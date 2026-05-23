import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildTrustedConversionReport } from "../../ops/trustedConversionOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function TrustedConversionsPage() {
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
    () => (ctx ? buildTrustedConversionReport(ctx) : null),
    [ctx]
  );

  const multiSessionExport = useMemo(() => {
    if (!report?.multiSession) return [];
    return [
      ...(report.multiSession.repeatFamilies || []).map((r) => ({
        type: "repeat_family",
        key: r.family,
        count: r.views,
      })),
      ...(report.multiSession.repeatComparePairs || []).map((r) => ({
        type: "repeat_compare",
        key: r.pairSlug,
        count: r.count,
      })),
    ];
  }, [report]);

  return (
    <PostLaunchAdminShell
      title="Trusted conversions"
      description="HIGH_CONFIDENCE / TRUSTED / DEVELOPING / NEEDS_REVIEW — lead quality, CTA trust, compare→lead realism, multi-session buyer intelligence."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <>
            <OpsExportActions
              reportType="trusted-conversions"
              rows={report.rows}
              fullReport={report}
              filenamePrefix="trusted-conversions"
              mapCsvRow={(r) => ({
                path: r.path,
                funnel: r.funnel,
                status: r.status,
                conversionTrustScore: r.conversionTrustScore,
                leadQualityConfidence: r.leadQualityConfidence,
                ctaTrustConfidence: r.ctaTrustConfidence,
                conversionMaturityScore: r.conversionMaturityScore,
                trustDrivenConversionScore: r.trustDrivenConversionScore,
                conversionDecayRisk: r.conversionDecayRisk,
                leadIntentMaturity: r.leadIntentMaturity,
              })}
            />
            <OpsExportActions
              reportType="weak-conversion-clusters"
              rows={report.weakConversionClusters}
              fullReport={{ weakConversionClusters: report.weakConversionClusters }}
              filenamePrefix="weak-conversion-clusters"
              mapCsvRow={(r) => ({ issue: r.issue, count: r.count })}
            />
            <OpsExportActions
              reportType="compare-abandonment"
              rows={report.compareAbandonment}
              fullReport={{ compareAbandonment: report.compareAbandonment }}
              filenamePrefix="compare-abandonment"
              mapCsvRow={(r) => ({
                pairSlug: r.pairSlug || r.slug,
                dropOffRate: r.dropOffRate,
                started: r.started,
              })}
            />
            <OpsExportActions
              reportType="multi-session-intelligence"
              rows={multiSessionExport}
              fullReport={{
                multiSession: report.multiSession,
                analytics: report.analytics,
              }}
              filenamePrefix="multi-session-intelligence"
              mapCsvRow={(r) => ({
                type: r.type,
                key: r.key,
                count: r.count,
              })}
            />
            <OpsExportActions
              reportType="behavioral-analytics-maturity"
              rows={[
                {
                  metric: "analyticsConfidence",
                  value: report.analytics?.analyticsConfidence,
                },
                {
                  metric: "behavioralIntelligenceMaturity",
                  value: report.analytics?.behavioralIntelligenceMaturity,
                },
                {
                  metric: "compareFunnelConfidence",
                  value: report.analytics?.compareFunnelConfidence,
                },
                {
                  metric: "multiSessionMaturity",
                  value: report.multiSession?.multiSessionMaturityScore,
                },
              ]}
              fullReport={report.analytics}
              filenamePrefix="behavioral-analytics-maturity"
              mapCsvRow={(r) => ({ metric: r.metric, value: r.value })}
            />
          </>
        ) : null
      }
    >
      {report ? (
        <>
          {report.bufferNote ? (
            <p style={{ color: "#b45309", fontSize: "0.85rem" }}>{report.bufferNote}</p>
          ) : null}
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                {
                  label: "HIGH_CONFIDENCE",
                  value: report.statusCounts.HIGH_CONFIDENCE,
                },
                { label: "TRUSTED", value: report.statusCounts.TRUSTED },
                { label: "DEVELOPING", value: report.statusCounts.DEVELOPING },
                {
                  label: "NEEDS_REVIEW",
                  value: report.statusCounts.NEEDS_REVIEW,
                },
                {
                  label: "Avg conversion trust",
                  value: report.avgConversionTrust,
                },
                {
                  label: "Analytics confidence",
                  value: report.analytics?.analyticsConfidence,
                },
                {
                  label: "Multi-session maturity",
                  value: report.multiSession?.multiSessionMaturityScore,
                },
                {
                  label: "Mobile friction",
                  value: report.analytics?.device?.mobileFrictionSeverity,
                },
              ]}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Channel preference</h3>
            <p style={{ fontSize: "0.9rem", color: "#475569" }}>
              WhatsApp clicks: {report.channelPreference.whatsappClicks} · Callback
              leads (buffer): {report.channelPreference.callbackLeads}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              {report.channelPreference.note}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Conversion journeys</h3>
          <OpsTable
            columns={[
              { key: "path", label: "Path", render: (r) => <code>{r.path}</code> },
              { key: "status", label: "Status", render: (r) => adminBadge(r.status) },
              {
                key: "trust",
                label: "Trust",
                render: (r) => r.conversionTrustScore,
              },
              {
                key: "lead",
                label: "Lead quality",
                render: (r) => r.leadQualityConfidence,
              },
              {
                key: "cta",
                label: "CTA trust",
                render: (r) => r.ctaTrustConfidence,
              },
              {
                key: "decay",
                label: "Decay risk",
                render: (r) => r.conversionDecayRisk,
              },
              {
                key: "hints",
                label: "Suggestions",
                render: (r) => (r.hints || []).join(" · ") || "—",
              },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.key }))}
          />
          </div>

          {report.highFrictionJourneys?.length > 0 ? (
            <div style={adminCard}>
              <h3 style={{ marginTop: 0 }}>High-friction journeys</h3>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
                {report.highFrictionJourneys.map((r) => (
                  <li key={r.key}>
                    <code>{r.path}</code> — decay {r.conversionDecayRisk}% (
                    {r.frictionSeverity})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to load trusted conversion intelligence.</p>
      )}
    </PostLaunchAdminShell>
  );
}
