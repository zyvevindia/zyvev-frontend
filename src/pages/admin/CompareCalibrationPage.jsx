import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildCompareCalibrationReport } from "../../ops/compareCalibrationOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function CompareCalibrationPage() {
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
    () => (ctx ? buildCompareCalibrationReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Compare calibration"
      description="CALIBRATED / ACCEPTABLE / NEEDS_TUNING — score separation, trust quality, charging/ownership practicality, and editorial hints."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="compare-calibration"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="compare-calibration"
            mapCsvRow={(r) => ({
              pairSlug: r.pairSlug,
              status: r.status,
              calibrationScore: r.calibrationScore,
              trustQualityScore: r.trustQualityScore,
              recommendationConfidencePct: r.recommendationConfidencePct,
              compareMaturityLevel: r.compareMaturityLevel,
              issues: r.issues.join("; "),
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
                { label: "CALIBRATED", value: report.statusCounts.CALIBRATED },
                { label: "ACCEPTABLE", value: report.statusCounts.ACCEPTABLE },
                {
                  label: "NEEDS_TUNING",
                  value: report.statusCounts.NEEDS_TUNING,
                },
                {
                  label: "Editorial queue",
                  value: report.needsEditorial.length,
                },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              { key: "pair", label: "Pair", render: (r) => <code>{r.pairSlug}</code> },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span style={adminBadge(statusTone[r.status] || "neutral")}>
                    {r.status}
                  </span>
                ),
              },
              { key: "cal", label: "Calibration", render: (r) => r.calibrationScore },
              { key: "trust", label: "Trust quality", render: (r) => r.trustQualityScore },
              {
                key: "conf",
                label: "Rec. conf. %",
                render: (r) => `${r.recommendationConfidencePct}%`,
              },
              { key: "mat", label: "Maturity", render: (r) => r.compareMaturityLevel },
              {
                key: "hint",
                label: "Hint",
                render: (r) => r.editorialHint || "—",
              },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.pairSlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to run calibration.</p>
      )}
    </PostLaunchAdminShell>
  );
}
