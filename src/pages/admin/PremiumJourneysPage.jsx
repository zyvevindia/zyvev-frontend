import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildPremiumJourneyReport } from "../../ops/premiumJourneyOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function PremiumJourneysPage() {
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
    () => (ctx ? buildPremiumJourneyReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Premium tier-1 journeys"
      description="Goal: ≥85% PREMIUM_READY on active tier-1 EVs — media, compare, trust, guides, leads, realism, SEO, ownership intelligence."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="premium-journeys"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="premium-journeys"
            mapCsvRow={(r) => ({
              familySlug: r.familySlug,
              status: r.status,
              compositeScore: r.compositeScore,
              mediaQuality: r.mediaQuality,
              recommendationRealism: r.recommendationRealism,
              guideSupport: r.guideSupport,
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
                  label: "PREMIUM_READY %",
                  value: `${report.premiumReadyPct}%`,
                  hint: report.goalMet ? "Goal met" : "Target ≥85%",
                },
                { label: "PREMIUM_READY", value: report.statusCounts.PREMIUM_READY },
                { label: "GOOD", value: report.statusCounts.GOOD },
                {
                  label: "NEEDS_IMPROVEMENT",
                  value: report.statusCounts.NEEDS_IMPROVEMENT,
                },
                { label: "Active in catalog", value: report.activeCount },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              {
                key: "ev",
                label: "EV",
                render: (r) => (
                  <>
                    <strong>{r.label}</strong>
                    <br />
                    <code>{r.familySlug}</code>
                  </>
                ),
              },
              { key: "status", label: "Status", render: (r) => adminBadge(r.status) },
              { key: "score", label: "Composite", render: (r) => r.compositeScore },
              { key: "media", label: "Media", render: (r) => r.mediaQuality },
              { key: "compare", label: "Compare", render: (r) => r.compareQuality },
              { key: "trust", label: "Trust", render: (r) => r.trustCompleteness },
              { key: "guide", label: "Guides", render: (r) => r.guideSupport },
              { key: "realism", label: "Realism", render: (r) => r.recommendationRealism },
              { key: "own", label: "Ownership intel", render: (r) => r.ownershipIntelligence },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.familySlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to score premium journeys.</p>
      )}
    </PostLaunchAdminShell>
  );
}
