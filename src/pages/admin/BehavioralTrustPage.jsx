import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildBehavioralTrustReport } from "../../ops/behavioralTrustOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function BehavioralTrustPage() {
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
    () => (ctx ? buildBehavioralTrustReport(ctx) : null),
    [ctx]
  );

  const decayExportRows = useMemo(() => {
    if (!report) return [];
    return [
      ...(report.trustDecayAlerts || []),
      ...(report.highBounceCompare || []),
    ].map((r) => ({ ...r, _key: `decay-${r.pairSlug}` }));
  }, [report]);

  return (
    <PostLaunchAdminShell
      title="Behavioral trust calibration"
      description="TRUSTED / STABLE / NEEDS_REVIEW / LOW_CONFIDENCE — real compare abandonment, bounce, engagement, and catalog realism combined."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <>
            <OpsExportActions
              reportType="behavioral-trust"
              rows={report.rows}
              fullReport={report}
              filenamePrefix="behavioral-trust"
              mapCsvRow={(r) => ({
                pairSlug: r.pairSlug,
                status: r.status,
                behavioralTrustScore: r.behavioralTrustScore,
                compareTrustConfidence: r.compareTrustConfidence,
                trustDecayRisk: r.trustDecayRisk,
                ownershipRealismScore: r.ownershipRealismScore,
                chargingPracticalityScore: r.chargingPracticalityScore,
              })}
            />
            <OpsExportActions
              reportType="trust-decay-clusters"
              rows={decayExportRows}
              fullReport={{
                trustDecayAlerts: report.trustDecayAlerts,
                recurringWeakClusters: report.recurringWeakClusters,
              }}
              filenamePrefix="trust-decay-clusters"
              mapCsvRow={(r) => ({
                pairSlug: r.pairSlug,
                status: r.status,
                trustDecayRisk: r.trustDecayRisk,
                issues: (r.issues || []).join("; "),
              })}
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
                { label: "TRUSTED", value: report.statusCounts.TRUSTED },
                { label: "STABLE", value: report.statusCounts.STABLE },
                { label: "NEEDS_REVIEW", value: report.statusCounts.NEEDS_REVIEW },
                {
                  label: "LOW_CONFIDENCE",
                  value: report.statusCounts.LOW_CONFIDENCE,
                },
                { label: "Avg behavioral trust", value: report.avgBehavioralTrust },
                { label: "Trust decay alerts", value: report.trustDecayAlerts.length },
              ]}
            />
          </div>
          <div style={{ ...adminCard, marginTop: 16 }}>
            <MetricGrid
              metrics={[
                {
                  label: "Ownership realism (avg)",
                  value: report.avgOwnershipRealism,
                },
                {
                  label: "Charging practicality (avg)",
                  value: report.avgChargingPracticality,
                },
                {
                  label: "Engagement quality",
                  value: report.engagement.trustEngagementQuality,
                },
                {
                  label: "Tooltips opened",
                  value: report.engagement.trust_tooltip_opened,
                },
              ]}
            />
          </div>
          {report.recurringWeakClusters?.length ? (
            <div style={{ ...adminCard, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Weak compare clusters</h3>
              <ul>
                {report.recurringWeakClusters.map((c) => (
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
              { key: "trust", label: "Behavioral trust", render: (r) => r.behavioralTrustScore },
              { key: "decay", label: "Decay risk", render: (r) => r.trustDecayRisk },
              { key: "own", label: "Ownership", render: (r) => r.ownershipRealismScore },
              { key: "chg", label: "Charging", render: (r) => r.chargingPracticalityScore },
              {
                key: "hints",
                label: "Actions",
                render: (r) => (r.hints?.length ? r.hints.join(" · ") : "—"),
              },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.pairSlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>
          Refresh with admin login to merge traffic-ops and local behavioral buffer.
        </p>
      )}
    </PostLaunchAdminShell>
  );
}
