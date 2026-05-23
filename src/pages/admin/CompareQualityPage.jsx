import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildCompareQualityReport } from "../../ops/compareQualityOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function CompareQualityPage() {
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
    () => (ctx ? buildCompareQualityReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Compare quality"
      description="Credibility and quality scores for compare pairs — STRONG / ACCEPTABLE / NEEDS_REVIEW. Uses catalog intelligence + traffic completion heuristics."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="compare-quality"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="compare-quality"
            mapCsvRow={(r) => ({
              pairSlug: r.pairSlug,
              status: r.status,
              compareQualityScore: r.compareQualityScore,
              credibilityScore: r.credibilityScore,
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
                { label: "STRONG", value: report.statusCounts.STRONG },
                { label: "ACCEPTABLE", value: report.statusCounts.ACCEPTABLE },
                {
                  label: "NEEDS_REVIEW",
                  value: report.statusCounts.NEEDS_REVIEW,
                },
                { label: "Pairs scored", value: report.rows.length },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              {
                key: "pair",
                label: "Pair",
                render: (r) => <code>{r.pairSlug}</code>,
              },
              {
                key: "status",
                label: "Quality",
                render: (r) => (
                  <span style={adminBadge(statusTone[r.status] || "neutral")}>
                    {r.status}
                  </span>
                ),
              },
              {
                key: "cred",
                label: "Credibility",
                render: (r) => r.credibilityScore,
              },
              {
                key: "score",
                label: "Compare score",
                render: (r) => r.compareQualityScore,
              },
              {
                key: "conf",
                label: "Rec. confidence",
                render: (r) => r.recommendationConfidence,
              },
              {
                key: "issues",
                label: "Issues",
                render: (r) => r.issues.join(", ") || "—",
              },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.pairSlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to score compare pairs.</p>
      )}
    </PostLaunchAdminShell>
  );
}
