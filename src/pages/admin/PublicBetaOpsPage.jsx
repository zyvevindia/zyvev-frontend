import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildPublicBetaOpsReport } from "../../ops/publicBetaOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";
import BetaWeeklySummarySection from "./BetaWeeklySummarySection";

const severityTone = {
  high: "red",
  medium: "yellow",
  low: "green",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const cockpitCard = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#fff",
  textDecoration: "none",
  color: "inherit",
  display: "block",
};

export default function PublicBetaOpsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const ctx = await loadPostLaunchOpsContext();
      setReport(await buildPublicBetaOpsReport(ctx));
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const weeklyRows = useMemo(
    () =>
      (report?.trustWeeklySnapshots || report?.weeklySnapshots || []).map((s) => ({
        ...s,
        _key: s.week || s.at,
      })),
    [report]
  );

  return (
    <PostLaunchAdminShell
      title="Public beta ops"
      description="Operational cockpit — unified intelligence links, trust alerts, doubt feedback, and beta confidence evolution."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="public-beta-ops"
            rows={weeklyRows}
            fullReport={report}
            filenamePrefix="public-beta-ops"
            mapCsvRow={(s) => ({
              week: s.week,
              betaStabilityScore: s.betaStabilityScore,
              trustedRealismPct: s.trustedRealismPct,
              premiumReadyPct: s.premiumReadyPct,
              conversionTrustScore: s.conversionTrustScore,
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
                  label: "Beta stability",
                  value: report.betaStabilityScore,
                  hint: "Composite public-beta health",
                },
                {
                  label: "Ops confidence",
                  value: report.operationalConfidence?.operationalConfidenceIndex ?? "—",
                },
                {
                  label: "Beta confidence",
                  value: report.betaConfidenceEvolution,
                },
                {
                  label: "Realism trend",
                  value: report.realismTrend,
                },
                {
                  label: "Trusted realism %",
                  value: `${report.trustedRealismPct}%`,
                },
                {
                  label: "Premium ready %",
                  value: `${report.premiumReadyPct}%`,
                  hint: report.premiumGoalMet ? "≥85% goal" : "Below 85% goal",
                },
                {
                  label: "Authority depth",
                  value: report.authorityDepthScore,
                },
                {
                  label: "Conversion trust",
                  value: report.conversionTrustScore,
                },
                {
                  label: "Behavioral trust",
                  value: report.behavioralTrustPct != null ? `${report.behavioralTrustPct}%` : "—",
                  hint: report.behavioralTrustTrend,
                },
                {
                  label: "Trust decay alerts",
                  value: report.trustDecayAlertCount ?? 0,
                },
                {
                  label: "Rec. maturity",
                  value: report.recommendationMaturityScore ?? "—",
                },
                {
                  label: "Operational trust",
                  value: report.operationalTrustScore ?? "—",
                },
              ]}
            />
          </div>

          {report.stabilization ? (
            <>
              <BetaWeeklySummarySection
                summary={report.stabilization.weeklySummary}
                title="Real-user validation (weekly)"
              />
              <div style={{ ...adminCard, marginTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Trust conversion signals</h3>
                <MetricGrid
                  metrics={[
                    {
                      label: "Lead confidence trend",
                      value:
                        report.stabilization.trustConversion
                          .compareLeadConfidenceTrend,
                    },
                    {
                      label: "Trust-assisted conversion",
                      value:
                        report.stabilization.trustConversion
                          .trustAssistedConversionIndicator ?? "—",
                    },
                    {
                      label: "Recommendation clarity",
                      value:
                        report.stabilization.trustConversion
                          .recommendationClarityIndicator,
                    },
                    {
                      label: "Beta stability",
                      value: report.stabilization.stability.betaStabilityTrend,
                    },
                    {
                      label: "Ops confidence",
                      value:
                        report.stabilization.stability
                          .operationalConfidenceTrend,
                    },
                    {
                      label: "Regression warnings",
                      value:
                        report.stabilization.stability.regressionEarlyWarning
                          ?.length ?? 0,
                    },
                  ]}
                />
              </div>
              <div style={{ ...adminCard, marginTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Calibration review queues</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Calibration:{" "}
                  {report.stabilization.calibrationQueues.calibrationReviewQueue
                    .length}{" "}
                  · Unstable:{" "}
                  {
                    report.stabilization.calibrationQueues
                      .unstableRecommendationQueue.length
                  }{" "}
                  · Weak realism:{" "}
                  {
                    report.stabilization.calibrationQueues
                      .weakRealismReviewQueue.length
                  }
                </p>
                <p style={{ fontSize: "0.8rem" }}>
                  <Link to="/admin/recommendation-refinement">
                    Recommendation refinement →
                  </Link>
                  {" · "}
                  <Link to="/admin/conversion-refinement">
                    Conversion refinement →
                  </Link>
                </p>
              </div>

              {report.stabilization.growth?.bestAcquisitionSources ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Acquisition intelligence</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Acquisition quality",
                        value:
                          report.stabilization.growth.acquisitionQualityScore ??
                          "—",
                      },
                      {
                        label: "Trusted visitor ratio",
                        value:
                          report.stabilization.growth.trustedVisitorRatio != null
                            ? `${report.stabilization.growth.trustedVisitorRatio}%`
                            : "—",
                      },
                      {
                        label: "Acquisition maturity",
                        value:
                          report.stabilization.acquisitionCalibration
                            ?.acquisitionMaturity ?? "—",
                      },
                      {
                        label: "Source trend",
                        value:
                          report.stabilization.acquisitionCalibration
                            ?.trustedSourceTrend ?? "—",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Best:{" "}
                    {report.stabilization.growth.bestAcquisitionSources
                      .map((s) => s.channel)
                      .join(", ") || "—"}{" "}
                    · Weak:{" "}
                    {report.stabilization.growth.weakAcquisitionSources
                      ?.map((s) => s.channel)
                      .join(", ") || "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.realPublicOperations ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Public operations discipline</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Platform healthy under live traffic?",
                        value: report.stabilization.realPublicOperations
                          .platformHealthyUnderLiveTraffic
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Recommendations stable under usage?",
                        value: report.stabilization.realPublicOperations
                          .recommendationsStableUnderUsage
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority content fresh?",
                        value: report.stabilization.realPublicOperations.authorityContentFresh
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Repeat-user quality healthy?",
                        value: report.stabilization.realPublicOperations.repeatUserQualityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Operational stability healthy?",
                        value: report.stabilization.realPublicOperations
                          .operationalStabilityHealthy
                          ? "Yes"
                          : "Review",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Freshness:{" "}
                    {report.stabilization.realPublicOperations.operationalFreshnessQuality ??
                      "—"}{" "}
                    · Platform health:{" "}
                    {report.stabilization.realPublicOperations.publicPlatformHealthPersistence ??
                      "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.realPublicOperations ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Real public operations</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Live production maturity",
                        value:
                          report.stabilization.realPublicOperations.liveProductionMaturity ??
                          "—",
                      },
                      {
                        label: "Platform stable under public traffic?",
                        value: report.stabilization.realPublicOperations
                          .platformStableUnderPublicTraffic
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Recs remaining useful?",
                        value: report.stabilization.realPublicOperations
                          .recommendationsRemainingUseful
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority compounding?",
                        value: report.stabilization.realPublicOperations
                          .authorityUsefulnessCompounding
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Operational trust healthy?",
                        value: report.stabilization.realPublicOperations.operationalTrustHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Broader public launch?",
                        value: report.stabilization.realPublicOperations
                          .readyForBroaderPublicLaunch
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.realPublicOperations ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Disciplined traffic operations</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Traffic quality stable?",
                        value: report.stabilization.realPublicOperations.trafficQualityStable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Trusted discovery healthy?",
                        value: report.stabilization.realPublicOperations.trustedDiscoveryHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Repeat-user acquisition durable?",
                        value: report.stabilization.realPublicOperations
                          .repeatUserAcquisitionDurable
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Authority-entry quality healthy?",
                        value: report.stabilization.realPublicOperations
                          .authorityEntryQualityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Wider public traffic?",
                        value: report.stabilization.realPublicOperations.readyForWiderPublicTraffic
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.livePlatform ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Live platform operations</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Platform healthy under traffic?",
                        value: report.stabilization.livePlatform.platformHealthyUnderTraffic
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Recs stable under usage?",
                        value: report.stabilization.livePlatform.recommendationsStableUnderUsage
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Repeat-user quality healthy?",
                        value: report.stabilization.livePlatform.repeatUserQualityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority content fresh?",
                        value: report.stabilization.livePlatform.authorityContentFresh
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Operational stability healthy?",
                        value: report.stabilization.livePlatform.operationalStabilityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Broader public launch?",
                        value: report.stabilization.livePlatform.readyForBroaderPublicLaunch
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.livePlatform?.trafficQualityHealthy != null ||
              report.stabilization.marketValidation?.trafficQualityHealthy != null ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Real traffic readiness</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Traffic quality healthy?",
                        value: (report.stabilization.livePlatform?.trafficQualityHealthy ??
                          report.stabilization.marketValidation?.trafficQualityHealthy)
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Discovery quality stable?",
                        value: (report.stabilization.livePlatform?.discoveryQualityStable ??
                          report.stabilization.marketValidation?.discoveryQualityStable)
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Trusted entry journeys durable?",
                        value: (report.stabilization.livePlatform?.trustedEntryJourneysDurable ??
                          report.stabilization.marketValidation?.trustedEntryJourneysDurable)
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Repeat-user acquisition healthy?",
                        value: report.stabilization.livePlatform?.repeatUserAcquisitionHealthy
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Broader public traffic?",
                        value: (report.stabilization.livePlatform?.readyForBroaderPublicTraffic ??
                          report.stabilization.marketValidation?.readyForBroaderPublicTraffic)
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.productionLaunch ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Production launch readiness</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Production quality maturity",
                        value:
                          report.stabilization.productionLaunch.productionQualityMaturity ??
                          "—",
                      },
                      {
                        label: "Platform quality stable?",
                        value: report.stabilization.productionLaunch.platformQualityStable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Performance healthy?",
                        value: report.stabilization.productionLaunch.performanceHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Recs remaining useful?",
                        value: report.stabilization.productionLaunch
                          .recommendationsRemainingUseful
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority compounding?",
                        value: report.stabilization.productionLaunch
                          .authorityUsefulnessCompounding
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Public production launch?",
                        value: report.stabilization.productionLaunch
                          .readyForPublicProductionLaunch
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.performanceReliability ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Performance & stability</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Performance stable under growth?",
                        value: report.stabilization.performanceReliability
                          .performanceStableUnderGrowth
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Compare rendering reliable?",
                        value: report.stabilization.performanceReliability
                          .compareRenderingReliable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Media delivery healthy?",
                        value: report.stabilization.performanceReliability.mediaDeliveryHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Route transitions smooth?",
                        value: report.stabilization.performanceReliability
                          .routeTransitionsSmooth
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Production stability healthy?",
                        value: report.stabilization.performanceReliability
                          .productionStabilityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Perceived speed",
                        value:
                          report.stabilization.performanceReliability.perceivedSpeedQuality ??
                          "—",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.publicExperience ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Public experience polish</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Public experience maturity",
                        value:
                          report.stabilization.publicExperience.publicExperienceMaturity ??
                          "—",
                      },
                      {
                        label: "Users consistently trusting?",
                        value: report.stabilization.publicExperience
                          .usersConsistentlyTrustingEvsavari
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Authority compounding?",
                        value: report.stabilization.publicExperience
                          .authorityUsefulnessCompounding
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Recs remaining useful?",
                        value: report.stabilization.publicExperience
                          .recommendationsRemainingUseful
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Experience polished?",
                        value: report.stabilization.publicExperience.publicExperiencePolished
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Disciplined expansion?",
                        value: report.stabilization.publicExperience
                          .readyForDisciplinedExpansion
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Calm UX: {report.stabilization.publicExperience.calmUxQualityTrend ?? "—"}
                    {" · "}
                    Trust consistency:{" "}
                    {report.stabilization.publicExperience.trustConsistencyEvolution ?? "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.trustedScaling ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Trusted scaling readiness</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Trust stable under growth?",
                        value: report.stabilization.trustedScaling.trustStableUnderGrowth
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Recs durable at higher usage?",
                        value: report.stabilization.trustedScaling
                          .recommendationsDurableAtHigherUsage
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority usefulness holding?",
                        value: report.stabilization.trustedScaling.authorityUsefulnessHolding
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Repeat-user quality healthy?",
                        value: report.stabilization.trustedScaling.repeatUserQualityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "UX usefulness",
                        value:
                          report.stabilization.trustedScaling.userExperienceUsefulness ?? "—",
                      },
                      {
                        label: "Ready for disciplined scaling?",
                        value: report.stabilization.trustedScaling.readyForDisciplinedExpansion
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Users trusting repeatedly:{" "}
                    {report.stabilization.trustedScaling.usersTrustingEvsavariRepeatedly
                      ? "Yes"
                      : "Building"}
                    {" · "}
                    Authority compounding:{" "}
                    {report.stabilization.trustedScaling.authorityUsefulnessCompounding
                      ? "Yes"
                      : "Review"}
                    {" · "}
                    Recs practically useful:{" "}
                    {report.stabilization.trustedScaling.recommendationsPracticallyUseful
                      ? "Yes"
                      : "Review"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.marketValidation?.scalingTrustDurability ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Public beta — scaling trust</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Scaling trust durability",
                        value:
                          report.stabilization.marketValidation.scalingTrustDurability ?? "—",
                      },
                      {
                        label: "Repeat-user stability",
                        value:
                          report.stabilization.marketValidation.repeatUserStability ?? "—",
                      },
                      {
                        label: "Compare quality under load",
                        value:
                          report.stabilization.marketValidation.compareQualityUnderLoad ?? "—",
                      },
                      {
                        label: "Authority retention",
                        value:
                          report.stabilization.marketValidation.authorityRetentionStability ??
                          "—",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.trustedBrand ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Trusted brand & user value</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Trusted brand maturity",
                        value: report.stabilization.trustedBrand.trustedBrandMaturity,
                      },
                      {
                        label: "Users remembering EVSavari?",
                        value: report.stabilization.trustedBrand.usersRememberingEvsavari
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "User value persistence",
                        value:
                          report.stabilization.trustedBrand.userValuePersistence ?? "—",
                      },
                      {
                        label: "Recs practically valuable?",
                        value: report.stabilization.trustedBrand
                          .recommendationsPracticallyValuable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority memorability",
                        value:
                          report.stabilization.trustedBrand.authorityMemorability ?? "—",
                      },
                      {
                        label: "Disciplined scaling?",
                        value: report.stabilization.trustedBrand.readyForDisciplinedScaling
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.trustedGrowth ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Trusted growth & public presence</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Trusted discovery quality",
                        value:
                          report.stabilization.trustedGrowth.trustedDiscoveryQuality ??
                          "—",
                      },
                      {
                        label: "Returning for recs?",
                        value: report.stabilization.trustedGrowth
                          .usersReturningBecauseRecommendationsHelp
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Recommendation habit",
                        value:
                          report.stabilization.trustedGrowth
                            .recommendationHabitFormation ?? "—",
                      },
                      {
                        label: "Rec. trust persistence",
                        value:
                          report.stabilization.trustedGrowth
                            .recommendationTrustPersistence ?? "—",
                      },
                      {
                        label: "Trusted growth maturity",
                        value:
                          report.stabilization.trustedGrowth.trustedGrowthMaturity,
                      },
                      {
                        label: "Disciplined growth ready?",
                        value: report.stabilization.trustedGrowth
                          .readyForDisciplinedGrowth
                          ? "Yes"
                          : "Hold",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Durable entry journeys:{" "}
                    {report.stabilization.trustedGrowth.mostDurableAuthorityEntryJourneys
                      ?.map((j) => j.pair || j.from)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(", ") || "—"}
                    {" · "}
                    Revisited compares:{" "}
                    {report.stabilization.trustedGrowth.mostRevisitedCompareJourneys
                      ?.map((p) => p.pairSlug)
                      .slice(0, 3)
                      .join(", ") || "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.publicAuthority ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Public authority & trusted adoption</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Public authority maturity",
                        value:
                          report.stabilization.publicAuthority.publicAuthorityMaturity,
                      },
                      {
                        label: "Users trusting repeatedly?",
                        value: report.stabilization.publicAuthority
                          .usersTrustingEvsavariRepeatedly
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Authority compounding?",
                        value: report.stabilization.publicAuthority
                          .authorityUsefulnessCompounding
                          ? "Yes"
                          : "Early",
                      },
                      {
                        label: "Recommendations durable?",
                        value: report.stabilization.publicAuthority
                          .recommendationsDurable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Trusted discovery healthy?",
                        value: report.stabilization.publicAuthority
                          .trustedDiscoveryHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Broader visibility?",
                        value: report.stabilization.publicAuthority
                          .readyForBroaderVisibility
                          ? "Ready"
                          : "Hold",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Best discovery:{" "}
                    {report.stabilization.publicAuthority.bestTrustedDiscoveryPaths
                      ?.map((p) => p.channel)
                      .join(", ") || "—"}
                    {" · "}
                    Authority visibility:{" "}
                    {report.stabilization.publicAuthority.authorityVisibilityTrend ??
                      "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.retentionAuthority ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Retention & authority compounding</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Trusted return-user quality",
                        value:
                          report.stabilization.retentionAuthority
                            .trustedReturnUserQuality ?? "—",
                      },
                      {
                        label: "Retention confidence",
                        value:
                          report.stabilization.retentionAuthority
                            .retentionConfidenceTrend ?? "—",
                      },
                      {
                        label: "Repeat compare durability",
                        value:
                          report.stabilization.retentionAuthority
                            .repeatCompareDurability ?? "—",
                      },
                      {
                        label: "Community discovery",
                        value:
                          report.stabilization.retentionAuthority
                            .communityDiscoveryMaturity ?? "—",
                      },
                      {
                        label: "Rec. durability confidence",
                        value:
                          report.stabilization.retentionAuthority
                            .recommendationDurabilityConfidence ?? "—",
                      },
                      {
                        label: "Retention authority ready?",
                        value: report.stabilization.retentionAuthority
                          .retentionAuthorityReady
                          ? "Yes"
                          : "Building",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    Durable compares:{" "}
                    {report.stabilization.retentionAuthority.mostDurableCompareJourneys
                      ?.map((p) => p.pairSlug)
                      .join(", ") || "—"}
                    {" · "}
                    Weak retention:{" "}
                    {report.stabilization.retentionAuthority.weakRetentionJourneys
                      ?.length ?? 0}{" "}
                    journeys
                  </p>
                  <p style={{ fontSize: "0.8rem" }}>
                    Referrals:{" "}
                    {report.stabilization.retentionAuthority.highestTrustReferralPaths
                      ?.map((p) => p.channel)
                      .join(", ") || "—"}
                    {" · "}
                    Revisited guides:{" "}
                    {report.stabilization.retentionAuthority.mostRevisitedOwnershipGuides
                      ?.map((g) => g.path)
                      .slice(0, 3)
                      .join(", ") || "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.adoptionMaturity ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Adoption maturity</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Users adopting platform?",
                        value: report.stabilization.adoptionMaturity
                          .usersAdoptingAsTrustedPlatform
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Authority compounding?",
                        value: report.stabilization.adoptionMaturity
                          .authorityUsefulnessCompounding
                          ? "Yes"
                          : "Early",
                      },
                      {
                        label: "Rec. durability healthy?",
                        value: report.stabilization.adoptionMaturity
                          .recommendationDurabilityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Retention stable?",
                        value: report.stabilization.adoptionMaturity
                          .retentionQualityStable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Broader acquisition?",
                        value: report.stabilization.adoptionMaturity
                          .readyForBroaderAcquisition
                          ? "Ready"
                          : "Hold",
                      },
                      {
                        label: "Adoption trend",
                        value:
                          report.stabilization.adoptionMaturity
                            .adoptionMaturityTrend,
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.growth?.bestAuthorityAcquisitionPaths ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Authority distribution</h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Best paths:{" "}
                    {report.stabilization.growth.bestAuthorityAcquisitionPaths
                      .map((p) => p.path)
                      .join(", ") || "—"}
                  </p>
                  <p style={{ fontSize: "0.8rem" }}>
                    Authority entry quality:{" "}
                    {report.stabilization.growth.authorityEntryQuality ??
                      report.stabilization.adoptionGrowth?.authorityEntryQuality ??
                      "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.marketValidation ||
              report.stabilization.growth?.returnUserTrustHealth ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Market validation & retention</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Return-user trust health",
                        value:
                          report.stabilization.growth?.returnUserTrustHealth ??
                          report.stabilization.marketValidation
                            ?.returnUserTrustHealth ??
                          "—",
                      },
                      {
                        label: "Repeat compare quality",
                        value:
                          report.stabilization.growth?.repeatCompareQuality ??
                          "—",
                      },
                      {
                        label: "Trusted repeat visitors",
                        value:
                          report.stabilization.growth?.trustedRepeatVisitors ??
                          "—",
                      },
                      {
                        label: "Recommendation revisit",
                        value:
                          report.stabilization.growth
                            ?.recommendationRevisitQuality ?? "—",
                      },
                      {
                        label: "Trusted session ratio",
                        value:
                          report.stabilization.growth?.trustedSessionRatio !=
                          null
                            ? `${report.stabilization.growth.trustedSessionRatio}%`
                            : "—",
                      },
                      {
                        label: "Retention trend",
                        value:
                          report.stabilization.marketValidation
                            ?.retentionMaturityTrend ??
                          report.stabilization.learningMaturity
                            ?.retentionMaturityTrend ??
                          "—",
                      },
                      {
                        label: "Returning for recs?",
                        value: report.stabilization.growth
                          ?.usersReturningForRecommendations
                          ? "Yes"
                          : "Watch",
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
                    High-return pairs:{" "}
                    {report.stabilization.growth?.highReturnComparePairs
                      ?.map((p) => p.pairSlug)
                      .join(", ") || "—"}
                  </p>
                </div>
              ) : null}

              {report.stabilization.learningMaturity ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Learning maturity</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Platform learning effectively?",
                        value: report.stabilization.learningMaturity
                          .platformLearningEffectively
                          ? "Yes"
                          : "Building",
                      },
                      {
                        label: "Rec. quality improving?",
                        value: report.stabilization.learningMaturity
                          .recommendationQualityImproving
                          ? "Yes"
                          : "Watch",
                      },
                      {
                        label: "Traffic quality healthy?",
                        value: report.stabilization.learningMaturity
                          .trafficQualityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Trust stability acceptable?",
                        value: report.stabilization.learningMaturity
                          .trustStabilityAcceptable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority compounding?",
                        value: report.stabilization.learningMaturity
                          .authorityUsefulnessCompounding
                          ? "Yes"
                          : "Early",
                      },
                      {
                        label: "Learning trend",
                        value:
                          report.stabilization.learningMaturity
                            .learningMaturityTrend,
                      },
                      {
                        label: "Users returning (trust)?",
                        value: report.stabilization.learningMaturity
                          .usersReturningTrustImproving
                          ? "Yes"
                          : "Watch",
                      },
                      {
                        label: "Rec. stabilizing?",
                        value: report.stabilization.learningMaturity
                          .recommendationQualityStabilizing
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Retention healthy?",
                        value: report.stabilization.learningMaturity
                          .retentionQualityHealthy
                          ? "Yes"
                          : "Review",
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.growth ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Controlled traffic growth</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Compare sessions",
                        value: report.stabilization.growth.compareSessionGrowth,
                        hint: report.stabilization.growth.compareSessionTrend,
                      },
                      {
                        label: "Repeat visitors",
                        value: report.stabilization.growth.repeatVisitorTrend,
                      },
                      {
                        label: "Compare depth",
                        value:
                          report.stabilization.growth.compareDepthTrend
                            ?.avgDepth ?? "—",
                      },
                      {
                        label: "Trust-assisted leads",
                        value:
                          report.stabilization.growth.trustAssistedLeadTrend,
                      },
                      {
                        label: "Referral quality",
                        value:
                          report.stabilization.growth.referralSourceQuality,
                      },
                    ]}
                  />
                </div>
              ) : null}

              {report.stabilization.operationalMaturity ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Operational maturity</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Safe to expand acquisition?",
                        value: report.stabilization.operationalMaturity
                          .safeToExpandAcquisition
                          ? "Yes"
                          : "Caution",
                      },
                      {
                        label: "Rec. maturity healthy?",
                        value: report.stabilization.operationalMaturity
                          .recommendationMaturityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Trust volatility acceptable?",
                        value: report.stabilization.operationalMaturity
                          .trustVolatilityAcceptable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Authority depth improving?",
                        value: report.stabilization.operationalMaturity
                          .authorityDepthImproving
                          ? "Yes"
                          : "Watch",
                      },
                      {
                        label: "Scaling readiness",
                        value:
                          report.stabilization.operationalMaturity
                            .scalingReadinessEvolution,
                      },
                      {
                        label: "Conversion trust",
                        value:
                          report.stabilization.operationalMaturity
                            .conversionTrustTrend,
                      },
                    ]}
                  />
                  <p style={{ fontSize: "0.8rem", marginTop: 12 }}>
                    <Link to="/admin/content-usefulness">Content usefulness →</Link>
                  </p>
                </div>
              ) : null}

              {report.stabilization.observation ? (
                <div style={{ ...adminCard, marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Beta observation</h3>
                  <MetricGrid
                    metrics={[
                      {
                        label: "Safe to scale traffic?",
                        value: report.stabilization.observation.safeToScaleTraffic
                          ? "Yes"
                          : "Caution",
                      },
                      {
                        label: "Trust stability healthy?",
                        value: report.stabilization.observation
                          .trustStabilityHealthy
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Rec. maturity stable?",
                        value: report.stabilization.observation
                          .recommendationMaturityStable
                          ? "Yes"
                          : "Review",
                      },
                      {
                        label: "Ownership improving?",
                        value: report.stabilization.observation
                          .ownershipRealismImproving
                          ? "Yes"
                          : "Watch",
                      },
                      {
                        label: "Growth quality",
                        value:
                          report.stabilization.observation.growthQualityTrend,
                      },
                    ]}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {report.cockpit ? (
            <div style={{ ...adminCard, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                Operational cockpit
                {report.cockpit.unresolvedAlertCount > 0 ? (
                  <span
                    style={{
                      ...adminBadge(severityTone.high),
                      marginLeft: 8,
                    }}
                  >
                    {report.cockpit.unresolvedAlertCount} unresolved
                  </span>
                ) : null}
              </h3>
              <div style={cardGrid}>
                {report.cockpit.cards.map((c) => (
                  <Link key={c.id} to={c.to} style={cockpitCard}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {c.group}
                    </div>
                    <strong style={{ display: "block", margin: "4px 0" }}>
                      {c.label}
                    </strong>
                    <span style={adminBadge(severityTone[c.severity] || "neutral")}>
                      {c.count}
                    </span>
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "#64748b",
                        margin: "8px 0 0",
                      }}
                    >
                      {c.summary}
                    </p>
                  </Link>
                ))}
              </div>
              {report.cockpit.navGroups.map((g) => (
                <div key={g.title} style={{ marginTop: 16 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
                    {g.title}
                  </h4>
                  <p style={{ fontSize: "0.8rem", margin: 0 }}>
                    {g.links.map((l, i) => (
                      <span key={l.to}>
                        {i > 0 ? " · " : null}
                        <Link to={l.to}>{l.label}</Link>
                      </span>
                    ))}
                  </p>
                </div>
              ))}
              {report.cockpit.trustDecayShortcuts?.length > 0 ? (
                <p style={{ fontSize: "0.8rem", marginTop: 12, color: "#b45309" }}>
                  Trust decay: {report.cockpit.trustDecayShortcuts.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Unified intelligence trends</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Catalog trusted: {report.catalogIntelligence?.trustedPct ?? "—"}% ·
              Behavioral engagement: {report.behavioralIntelligence?.engagementQuality ?? "—"} ·
              Media unresolved: {report.mediaStaging?.unresolvedFamilies?.length ?? "—"} ·
              Ownership trend: {report.ownershipRealismTrend} · Charging:{" "}
              {report.chargingPracticalityTrend}
            </p>
            <p style={{ fontSize: "0.8rem" }}>
              <Link to="/admin/trust-feedback">Trust feedback →</Link>
              {" · "}
              <Link to="/admin/ownership-intelligence">Ownership intelligence →</Link>
              {" · "}
              <Link to="/admin/recommendation-maturity">Recommendation maturity →</Link>
            </p>
          </div>

          {report.premiumOwnership ? (
            <div style={{ ...adminCard, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Premium ownership</h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                PREMIUM_READY: {report.premiumOwnership.premiumReadyPct}% (goal{" "}
                {report.premiumOwnership.goalMet ? "met" : "open"}) · Ownership realism{" "}
                {report.premiumOwnership.avgOwnershipRealism} · Charging{" "}
                {report.premiumOwnership.avgChargingRealism} · Authority ecosystem{" "}
                {report.ownershipAuthority?.authorityEcosystemScore ?? "—"}
              </p>
              <p style={{ fontSize: "0.8rem" }}>
                <Link to="/admin/premium-ownership-journeys">Premium ownership journeys →</Link>
                {" · "}
                <Link to="/admin/ownership-authority">Ownership authority →</Link>
              </p>
            </div>
          ) : null}

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Behavioral trust trends</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Avg behavioral trust: {report.behavioralTrust?.avgBehavioralTrust ?? "—"} ·
              Ownership realism: {report.behavioralTrust?.avgOwnershipRealism ?? "—"} ·
              Charging practicality: {report.behavioralTrust?.avgChargingPracticality ?? "—"}
            </p>
            <p style={{ fontSize: "0.8rem" }}>
              <Link to="/admin/behavioral-trust">Open behavioral trust dashboard →</Link>
            </p>
          </div>

          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Analytics maturity</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Mobile ~{report.analytics.mobileDesktopSplit.mobileSharePct}% · Desktop
              ~{report.analytics.mobileDesktopSplit.desktopSharePct}% (client buffer)
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              GA4-ready events: {report.analytics.ga4ReadyEvents.join(", ")}
            </p>
            {report.analytics.behavioralCalibration ? (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Sessions: {report.analytics.behavioralCalibration.uniqueSessions} ·
                Multi-compare sessions:{" "}
                {report.analytics.behavioralCalibration.multiSessionCompareCount}
              </p>
            ) : null}
          </div>

          <h3>Trust weekly snapshots</h3>
          <OpsTable
            columns={[
              { key: "week", label: "Week", render: (r) => r.week },
              { key: "beta", label: "Stability", render: (r) => r.betaStabilityScore },
              {
                key: "ops",
                label: "Ops conf.",
                render: (r) => r.operationalConfidence,
              },
              {
                key: "realism",
                label: "Realism %",
                render: (r) => r.trustedRealismPct,
              },
              {
                key: "premium",
                label: "Premium %",
                render: (r) => r.premiumReadyPct,
              },
              {
                key: "fresh",
                label: "Escalations",
                render: (r) => r.freshnessEscalations,
              },
            ]}
            rows={weeklyRows}
            emptyLabel="No weekly snapshots yet — refresh records today."
          />

          {report.feedback.highImpact?.length ? (
            <>
              <h3>High-impact feedback</h3>
              <ul>
                {report.feedback.highImpact.map((f) => (
                  <li key={f.id}>
                    {f.category} — impact {f.impactScore} · {f.severity}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to load public beta operations.</p>
      )}
    </PostLaunchAdminShell>
  );
}
