import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildConversionQualityReport } from "../../ops/conversionQualityOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function ConversionQualityPage() {
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
    () => (ctx ? buildConversionQualityReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Conversion quality"
      description="Trust-weighted lead journeys — conversion trust score, lead quality confidence, journey maturity."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="conversion-quality"
            rows={report.journeyRows}
            fullReport={report}
            filenamePrefix="conversion-quality"
            mapCsvRow={(r) => ({
              path: r.path,
              funnel: r.funnel,
              conversionTrustScore: r.conversionTrustScore,
              leadQualityConfidence: r.leadQualityConfidence,
              journeyMaturityScore: r.journeyMaturityScore,
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
                  label: "Conversion trust",
                  value: report.overallConversionTrust,
                },
                {
                  label: "Journey maturity",
                  value: report.avgJourneyMaturity,
                },
                {
                  label: "Trust uplift",
                  value: report.trustUpliftProxy,
                },
                {
                  label: "Trust tooltips",
                  value: report.trustTooltipEngagement,
                },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              { key: "path", label: "Path", render: (r) => <code>{r.path}</code> },
              { key: "funnel", label: "Funnel", render: (r) => r.funnel },
              {
                key: "trust",
                label: "Trust score",
                render: (r) => r.conversionTrustScore,
              },
              {
                key: "lead",
                label: "Lead quality",
                render: (r) => r.leadQualityConfidence,
              },
              {
                key: "mat",
                label: "Maturity",
                render: (r) => r.journeyMaturityScore,
              },
              {
                key: "friction",
                label: "Friction",
                render: (r) => adminBadge(r.frictionSeverity),
              },
            ]}
            rows={report.journeyRows.map((r) => ({ ...r, _key: r.key }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to load conversion quality.</p>
      )}
    </PostLaunchAdminShell>
  );
}
