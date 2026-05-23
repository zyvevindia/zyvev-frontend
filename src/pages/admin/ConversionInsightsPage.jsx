import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildConversionInsightsReport } from "../../ops/conversionInsightsOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function ConversionInsightsPage() {
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
    () => (ctx ? buildConversionInsightsReport(ctx) : null),
    [ctx]
  );

  const funnelRows = useMemo(() => {
    if (!report) return [];
    return [...report.compareLeadRows, ...report.detailLeadRows].map((r) => ({
      ...r,
      _key: r.key,
    }));
  }, [report]);

  return (
    <PostLaunchAdminShell
      title="Conversion insights"
      description="Compare and detail → lead funnels, friction severity, WhatsApp vs callback signals, and weak CTA pages."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="conversion-insights"
            rows={funnelRows}
            fullReport={report}
            filenamePrefix="conversion-insights"
            mapCsvRow={(r) => ({
              path: r.path,
              funnel: r.funnel,
              conversionQualityScore: r.conversionQualityScore,
              frictionSeverity: r.frictionSeverity,
              leadConfidence: r.leadConfidence,
              views: r.views,
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
                {
                  label: "Conversion quality",
                  value: report.overallConversionQuality,
                },
                {
                  label: "Compare completion",
                  value:
                    report.compareCompletionRate != null
                      ? `${report.compareCompletionRate}%`
                      : "—",
                },
                { label: "Leads (period)", value: report.leadsTotal },
                {
                  label: "High friction",
                  value: report.frictionSummary.high,
                },
              ]}
            />
            {report.mobileFrictionNote ? (
              <p style={{ marginTop: 12, color: "#b45309", fontSize: "0.85rem" }}>
                {report.mobileFrictionNote}
              </p>
            ) : null}
          </div>

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Lead channel preference</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              WhatsApp clicks: {report.callbackPreference.whatsappClicks} · Callback
              leads: {report.callbackPreference.callbackLeads}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              {report.callbackPreference.note}
            </p>
          </div>

          <h3>Funnel rows</h3>
          <OpsTable
            columns={[
              { key: "path", label: "Path", render: (r) => <code>{r.path}</code> },
              { key: "funnel", label: "Funnel", render: (r) => r.funnel },
              {
                key: "quality",
                label: "Quality",
                render: (r) => r.conversionQualityScore,
              },
              {
                key: "friction",
                label: "Friction",
                render: (r) => adminBadge(r.frictionSeverity),
              },
              {
                key: "conf",
                label: "Lead conf.",
                render: (r) => r.leadConfidence,
              },
            ]}
            rows={funnelRows}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to load conversion insights.</p>
      )}
    </PostLaunchAdminShell>
  );
}
