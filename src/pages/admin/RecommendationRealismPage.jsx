import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildRecommendationRealismReport } from "../../ops/recommendationRealismOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function RecommendationRealismPage() {
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
    () => (ctx ? buildRecommendationRealismReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Recommendation realism"
      description="TRUSTED / GOOD / NEEDS_REVIEW — score gaps, ownership/charging realism, contradictory logic, and confidence maturity."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="recommendation-realism"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="recommendation-realism"
            mapCsvRow={(r) => ({
              pairSlug: r.pairSlug,
              status: r.status,
              realismScore: r.realismScore,
              ownershipRealismScore: r.ownershipRealismScore,
              chargingRealismScore: r.chargingRealismScore,
              confidenceMaturityScore: r.confidenceMaturityScore,
              humanReviewSuggested: r.humanReviewSuggested,
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
                { label: "TRUSTED", value: report.statusCounts.TRUSTED },
                { label: "GOOD", value: report.statusCounts.GOOD },
                { label: "NEEDS_REVIEW", value: report.statusCounts.NEEDS_REVIEW },
                { label: "Avg realism", value: report.avgRealismScore },
                {
                  label: "Human review queue",
                  value: report.humanReviewQueue.length,
                },
              ]}
            />
          </div>
          {report.weakRecommendationClusters?.length ? (
            <div style={{ ...adminCard, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Weak recommendation clusters</h3>
              <ul>
                {report.weakRecommendationClusters.map((c) => (
                  <li key={c.issue}>
                    <code>{c.issue}</code> — {c.count} pair(s)
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <OpsTable
            columns={[
              { key: "pair", label: "Pair", render: (r) => <code>{r.pairSlug}</code> },
              { key: "status", label: "Status", render: (r) => adminBadge(r.status) },
              { key: "realism", label: "Realism", render: (r) => r.realismScore },
              { key: "own", label: "Ownership", render: (r) => r.ownershipRealismScore },
              { key: "chg", label: "Charging", render: (r) => r.chargingRealismScore },
              { key: "nuance", label: "Nuance", render: (r) => r.recommendationNuanceScore },
              { key: "conf", label: "Conf. maturity", render: (r) => r.confidenceMaturityScore },
              {
                key: "hint",
                label: "Editorial",
                render: (r) => r.editorialHint || (r.humanReviewSuggested ? "Review" : "—"),
              },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.pairSlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to score recommendation realism.</p>
      )}
    </PostLaunchAdminShell>
  );
}
