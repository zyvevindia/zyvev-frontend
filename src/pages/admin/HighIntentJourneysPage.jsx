import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildHighIntentJourneyReport } from "../../ops/highIntentJourneyOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function HighIntentJourneysPage() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCtx(await loadPostLaunchOpsContext({ days: 7 }));
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const report = useMemo(
    () => (ctx ? buildHighIntentJourneyReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="High-intent journeys"
      description="Top traffic EVs and compare pairs — funnel quality, friction severity, and conversion confidence."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="high-intent-journeys"
            rows={report.funnels}
            fullReport={report}
            filenamePrefix="high-intent-journeys"
            mapCsvRow={(r) => ({
              pairSlug: r.pairSlug,
              compareStarts: r.compareStarts,
              completionRate: r.completionRate,
              frictionSeverity: r.frictionSeverity,
              journeyQualityScore: r.journeyQualityScore,
              conversionConfidence: r.conversionConfidence,
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
                { label: "Leads (period)", value: report.leadFunnel.leads },
                {
                  label: "Compare started",
                  value: report.leadFunnel.compareStarted,
                },
                {
                  label: "Compare completion %",
                  value: report.leadFunnel.compareCompletionRate ?? "—",
                },
                {
                  label: "High friction funnels",
                  value: report.highFriction.length,
                },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              { key: "pair", label: "Compare pair", render: (r) => r.pairSlug },
              { key: "starts", label: "Starts", render: (r) => r.compareStarts },
              {
                key: "cr",
                label: "Completion %",
                render: (r) => r.completionRate ?? "—",
              },
              {
                key: "friction",
                label: "Friction",
                render: (r) => (
                  <span
                    style={adminBadge(
                      r.frictionSeverity === "high"
                        ? "red"
                        : r.frictionSeverity === "medium"
                          ? "yellow"
                          : "green"
                    )}
                  >
                    {r.frictionSeverity}
                  </span>
                ),
              },
              { key: "jq", label: "Journey score", render: (r) => r.journeyQualityScore },
              {
                key: "cc",
                label: "Conv. confidence",
                render: (r) => r.conversionConfidence,
              },
            ]}
            rows={report.funnels.map((r) => ({ ...r, _key: r.key }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to analyze journeys.</p>
      )}
    </PostLaunchAdminShell>
  );
}
