import { useCallback, useMemo, useState } from "react";



import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";

import { buildRecommendationRefinementReport } from "../../ops/recommendationRefinementOps";

import OpsExportActions from "../../components/admin/OpsExportActions";

import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";



export default function RecommendationRefinementPage() {

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

    () => (ctx ? buildRecommendationRefinementReport(ctx) : null),

    [ctx]

  );



  return (

    <PostLaunchAdminShell

      title="Recommendation refinement"

      description="Unstable pairs, doubt journeys, calibration queues — threshold views from existing maturity ops."

      loading={loading}

      error={error}

      onRefresh={load}

      lastLoaded={report?.generatedAt}

      extraActions={

        report ? (

          <OpsExportActions

            reportType="recommendation-refinement"

            rows={report.unstableComparePairs}

            fullReport={report}

            filenamePrefix="recommendation-refinement"

            mapCsvRow={(r) => ({

              pairSlug: r.pairSlug,

              priority: r.refinementPriorityScore,

              volatility: r.trustVolatility,

              flags: (r.flags || []).join("; "),

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

                  label: "Confidence drift",

                  value: report.recommendationConfidenceDrift,

                },

                {

                  label: "Trust recovery",

                  value: report.compareTrustRecoveryTrend,

                },

                {

                  label: "Volatility trend",

                  value: report.recommendationVolatilityTrend,

                },

                {

                  label: "Compare stability",

                  value: report.compareStabilityEvolution,

                },

                {

                  label: "Ownership drift",

                  value: report.ownershipRealismDrift,

                },

                {

                  label: "Abandon after guidance",

                  value: report.abandonmentAfterGuidance,

                },

              ]}

            />

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Most unstable compare pairs</h3>

            <OpsTable

              columns={[

                {

                  key: "pair",

                  label: "Pair",

                  render: (r) => <code>{r.pairSlug}</code>,

                },

                {

                  key: "pri",

                  label: "Priority",

                  render: (r) => r.refinementPriorityScore,

                },

                {

                  key: "vol",

                  label: "Volatility",

                  render: (r) => r.trustVolatility,

                },

                {

                  key: "flags",

                  label: "Flags",

                  render: (r) => (r.flags || []).join(", ") || "—",

                },

              ]}

              rows={report.mostUnstableComparePairs.map((r) => ({

                ...r,

                _key: r.pairSlug,

              }))}

            />

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>High-confidence but distrusted</h3>

            <OpsTable

              columns={[

                {

                  key: "slug",

                  label: "Vehicle / pair",

                  render: (r) => <code>{r.slug || r.pairSlug}</code>,

                },

                {

                  key: "score",

                  label: "Maturity",

                  render: (r) => r.recommendationMaturityScore,

                },

              ]}

              rows={report.highConfidenceButDistrusted.map((r) => ({

                ...r,

                _key: r.slug || r.pairSlug,

              }))}

              emptyLabel="None flagged."

            />

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Repeated-switch compare journeys</h3>

            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>

              Sessions that started a new compare after marking recommendation doubt:{" "}

              <strong>{report.repeatedSwitchCompareJourneys}</strong>

            </p>

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Weak realism hotspots</h3>

            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>

              {report.weakRealismHotspots.map((h) => (

                <li key={`${h.type}-${h.slug}`}>

                  {h.type}: <code>{h.slug}</code> {h.name ? `(${h.name})` : ""}

                </li>

              ))}

            </ul>

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Requires editorial calibration</h3>

            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>

              {report.requiresEditorialCalibration.map((q) => (

                <li key={`${q.pairSlug}-${q.reason}`}>

                  {q.pairSlug} — {q.reason || "review"} (priority{" "}

                  {q.refinementPriorityScore})

                </li>

              ))}

            </ul>

          </div>



          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Recommendations stable under traffic?</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.recommendationsStableUnderTraffic ? "Yes" : "Review"} · Trust
              persistence: {report.recommendationTrustPersistence ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Recommendations stable under scale?</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.recommendationsStableUnderScale ? "Yes" : "Review"} · Trust durability:{" "}
              {report.trustDurabilityUnderTraffic ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak trust durability</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakTrustDurabilityUnderTraffic ?? report.weakTrustConsistency ?? "—"} ·
              Fatigue under usage: {report.recommendationFatigueUnderUsage ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Distrust recurring under growth</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.distrustRecurringUnderGrowth ? "Watch — review pairs" : "Low"} · Trend:{" "}
              {report.distrustRecurrenceTrend ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most consistently trusted recommendations</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(
                report.mostConsistentlyTrustedRecommendations ||
                report.mostTrustedDurableRecommendations ||
                []
              ).map((r) => ({
                ...r,
                _key: `consistent-${r.pairSlug}`,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak trust consistency</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakTrustConsistency ?? report.weakTrustPersistence ?? "—"} · Trend:{" "}
              {report.trustConsistencyTrend ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most durable useful recommendations</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(
                report.mostDurableUsefulRecommendations ||
                report.mostUsefulLongTermRecommendations ||
                []
              ).map((r) => ({
                ...r,
                _key: `durable-${r.pairSlug}`,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak recommendation durability</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakRecommendationDurability ?? report.weakRecommendationUsefulness ?? "—"}
              {" · "}
              Durability: {report.recommendationDurabilityPersistence ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak recommendation usefulness</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakRecommendationUsefulness ?? report.weakUsefulnessPersistence ?? "—"}
              {" · "}
              Evolution: {report.recommendationUsefulnessEvolution ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Recommendation fatigue persistence</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.recommendationFatiguePersistence ?? "—"} · Distrust recurrence:{" "}
              {report.distrustRecurrenceQuality ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strong ownership-realism trust</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.strongOwnershipRealismTrust ?? "—"} · Realism durability:{" "}
              {report.ownershipRealismDurability ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most useful long-term recommendations</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.mostUsefulLongTermRecommendations || []).map((r) => ({
                ...r,
                _key: `useful-${r.pairSlug}`,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak usefulness persistence</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakUsefulnessPersistence ?? "—"} · Strong ownership realism:{" "}
              {report.strongOwnershipRealismTrust ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most trusted long-term recommendations</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.mostTrustedLongTermRecommendations ||
                report.mostTrustedDurableRecommendations ||
                []
              ).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Distrust returning after revisit</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.distrustReturningAfterRevisit || []).map((r) => ({
                ...r,
                _key: `ret-${r.pairSlug}`,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most trusted durable recommendations</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.mostTrustedDurableRecommendations || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Recommendation fatigue hotspots</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.recommendationFatigueHotspots || []).map((r) => ({
                ...r,
                _key: `fatigue-${r.pairSlug}`,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Trust decay after revisit</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.trustDecayAfterRevisit || []).map((r) => ({
                ...r,
                _key: `decay-${r.pairSlug}`,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Recommendations trusted repeatedly?</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.recommendationsTrustedRepeatedly
                ? "Yes — repeat usage trust is persistent"
                : "Building — review calibration queues"}
              {" · "}
              Weak trust persistence: {report.weakTrustPersistence ?? "—"}
              {" · "}
              Fatigue: {report.recommendationFatigueDetection ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Ownership realism durability</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.ownershipRealismDurability ?? "—"} · Distrust after revisit:{" "}
              {(report.distrustRecurringAfterRevisit || []).length} pairs flagged
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Recommendations improving over time?</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.recommendationsImprovingOverTime ? "Yes — maturity trend improving" : "Watch — review calibration queues"}
              {" · "}
              Stability: {report.recommendationStabilityPersistence ?? "—"}
              {" · "}
              Long-term volatility: {report.longTermTrustVolatility ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most durable compare recommendations</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.mostDurableCompareRecommendations || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak recommendation recovery</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                {
                  key: "vol",
                  label: "Volatility",
                  render: (r) => r.trustVolatility,
                },
              ]}
              rows={(report.weakRecommendationRecovery || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most persistent distrust clusters</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                { key: "count", label: "Doubt events", render: (r) => r.count },
              ]}
              rows={report.mostPersistentDistrustClusters.map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None in buffer."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak realism that survives calibration</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Persistence: {report.weakRealismPersistence} ·{" "}
              {(report.weakRealismSurvivesCalibration || []).join(", ") || "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak charging-practicality trust</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {report.weakChargingPracticalityTrust.map((r) => (
                <li key={r.slug}>
                  <code>{r.slug}</code> — {(r.flags || []).join(", ")}
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Low-confidence high-traffic compares</h3>

            <OpsTable

              columns={[

                {

                  key: "pair",

                  label: "Pair",

                  render: (r) => <code>{r.pairSlug}</code>,

                },

                {

                  key: "traffic",

                  label: "Traffic",

                  render: (r) => r.trafficStarted ?? r.started ?? "—",

                },

              ]}

              rows={report.lowConfidenceHighTraffic.map((r) => ({

                ...r,

                _key: r.pairSlug,

              }))}

              emptyLabel="None flagged."

            />

          </div>

        </>

      ) : null}

    </PostLaunchAdminShell>

  );

}

