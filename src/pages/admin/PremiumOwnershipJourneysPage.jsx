import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildPremiumOwnershipJourneyReport } from "../../ops/premiumOwnershipJourneyOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function PremiumOwnershipJourneysPage() {
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
    () => (ctx ? buildPremiumOwnershipJourneyReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Premium ownership journeys"
      description="Ownership intelligence for tier-1 EVs — target ≥90% PREMIUM_READY on active catalog families."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="premium-ownership-journeys"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="premium-ownership-journeys"
            mapCsvRow={(r) => ({
              familySlug: r.familySlug,
              status: r.status,
              compositeScore: r.compositeScore,
              ownershipRealismMaturity: r.ownershipRealismMaturity,
              chargingPracticalityMaturity: r.chargingPracticalityMaturity,
              trustCompleteness: r.trustCompleteness,
              recommendationMaturity: r.recommendationMaturity,
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
                  hint: report.goalMet
                    ? `≥${report.targetPct}% goal met`
                    : `Target ${report.targetPct}%`,
                },
                { label: "PREMIUM_READY", value: report.statusCounts.PREMIUM_READY },
                { label: "GOOD", value: report.statusCounts.GOOD },
                {
                  label: "NEEDS_IMPROVEMENT",
                  value: report.statusCounts.NEEDS_IMPROVEMENT,
                },
                { label: "Avg ownership realism", value: report.avgOwnershipRealism },
                { label: "Avg charging maturity", value: report.avgChargingRealism },
              ]}
            />
          </div>
          {report.weakOwnershipClusters?.length ? (
            <div style={{ ...adminCard, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Weak ownership clusters</h3>
              <ul>
                {report.weakOwnershipClusters.map((c) => (
                  <li key={c.issue}>
                    <code>{c.issue}</code> — {c.count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
              { key: "own", label: "Ownership", render: (r) => r.ownershipRealismMaturity },
              { key: "chg", label: "Charging", render: (r) => r.chargingPracticalityMaturity },
              { key: "trust", label: "Trust", render: (r) => r.trustCompleteness },
              { key: "rec", label: "Rec. maturity", render: (r) => r.recommendationMaturity },
              { key: "guide", label: "Guides", render: (r) => r.guideSupport },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.familySlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to score premium ownership journeys.</p>
      )}
    </PostLaunchAdminShell>
  );
}
