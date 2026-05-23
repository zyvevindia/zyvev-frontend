import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildOwnershipRealismReport } from "../../ops/ownershipRealismOps";
import { buildUserSuitabilityReport } from "../../ops/userSuitabilityOps";
import { buildChargingPracticalityReport } from "../../ops/chargingPracticalityOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function OwnershipIntelligencePage() {
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

  const realism = useMemo(
    () => (ctx ? buildOwnershipRealismReport(ctx) : null),
    [ctx]
  );
  const suitability = useMemo(
    () => (ctx ? buildUserSuitabilityReport(ctx) : null),
    [ctx]
  );
  const charging = useMemo(
    () => (ctx ? buildChargingPracticalityReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Ownership intelligence"
      description="Ownership realism, usage-profile suitability, and charging practicality — usage patterns only, no demographics."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={realism?.generatedAt}
      extraActions={
        realism ? (
          <OpsExportActions
            reportType="ownership-intelligence"
            rows={realism.rows}
            fullReport={{ realism, suitability, charging }}
            filenamePrefix="ownership-intelligence"
            mapCsvRow={(r) => ({
              slug: r.slug,
              status: r.status,
              ownershipRealismScore: r.ownershipRealismScore,
              chargingPracticalityScore: r.chargingPracticalityScore,
              apartmentSuitabilityScore: r.apartmentSuitabilityScore,
              flags: r.flags.join("; "),
            })}
          />
        ) : null
      }
    >
      {realism && suitability && charging ? (
        <>
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                { label: "Trusted %", value: `${realism.trustedPct}%` },
                {
                  label: "HIGHLY_SUITABLE",
                  value: realism.statusCounts.HIGHLY_SUITABLE,
                },
                { label: "SUITABLE", value: realism.statusCounts.SUITABLE },
                {
                  label: "NEEDS_REVIEW",
                  value:
                    realism.statusCounts.NEEDS_REVIEW +
                    realism.statusCounts.LOW_CONFIDENCE,
                },
                {
                  label: "Ownership maturity avg",
                  value: suitability.ownershipMaturityAvg,
                },
                {
                  label: "Charging flagged",
                  value: charging.flaggedCount,
                },
              ]}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Per-EV ownership realism</h3>
            <OpsTable
              columns={[
                {
                  key: "vehicle",
                  label: "Vehicle",
                  render: (r) => <code>{r.slug}</code>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => (
                    <span style={adminBadge(statusTone.warn)}>{r.status}</span>
                  ),
                },
                {
                  key: "own",
                  label: "Ownership",
                  render: (r) => r.ownershipRealismScore,
                },
                {
                  key: "chg",
                  label: "Charging",
                  render: (r) => r.chargingPracticalityScore,
                },
                {
                  key: "apt",
                  label: "Apartment",
                  render: (r) => r.apartmentSuitabilityScore,
                },
                {
                  key: "hwy",
                  label: "Highway",
                  render: (r) => r.highwayConfidenceScore,
                },
                {
                  key: "flags",
                  label: "Flags",
                  render: (r) => r.flags.join(", ") || "—",
                },
              ]}
              rows={realism.rows.slice(0, 25).map((r) => ({
                ...r,
                _key: r.slug,
              }))}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strongest profile matches</h3>
            <OpsTable
              columns={[
                {
                  key: "vehicle",
                  label: "Vehicle",
                  render: (r) => r.name || r.slug,
                },
                {
                  key: "top",
                  label: "Top profile",
                  render: (r) => r.topProfiles[0]?.profileLabel || "—",
                },
                {
                  key: "fit",
                  label: "Fit",
                  render: (r) => r.topProfiles[0]?.fitScore ?? "—",
                },
                {
                  key: "weak",
                  label: "Weakest profile",
                  render: (r) => r.weakestProfile?.profileLabel || "—",
                },
              ]}
              rows={suitability.vehicleProfiles.slice(0, 15).map((v) => ({
                ...v,
                _key: v.slug,
              }))}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Compare suitability gaps</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "insights",
                  label: "Insights",
                  render: (r) =>
                    r.insights.map((i) => i.text).join(" | ") || "—",
                },
              ]}
              rows={suitability.compareGaps.slice(0, 10).map((g) => ({
                ...g,
                _key: g.pairSlug,
              }))}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak realism warnings</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {realism.weakApartmentPracticality.slice(0, 5).map((r) => (
                <li key={r.slug}>
                  {r.name}: apartment practicality weak
                </li>
              ))}
              {realism.overconfidentOwnership.slice(0, 5).map((r) => (
                <li key={`o-${r.slug}`}>
                  {r.name}: overconfident ownership copy risk
                </li>
              ))}
              {suitability.unrealisticClusters.slice(0, 5).map((r) => (
                <li key={`u-${r.slug}`}>
                  {r.name}: weak top profile fit
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </PostLaunchAdminShell>
  );
}
