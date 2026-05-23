/**
 * Recommendation refinement queues — aggregates existing maturity/trust ops.
 * Threshold tuning views only; no new scoring engines.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { buildRecommendationMaturityReport, RECOMMENDATION_MATURITY_STATUS } from "./recommendationMaturityOps.js";
import { buildOwnershipRealismReport } from "./ownershipRealismOps.js";
import { buildChargingPracticalityReport } from "./chargingPracticalityOps.js";
import { buildTrustFeedbackReport } from "./trustFeedbackOps.js";
import {
  buildBehavioralTrustReport,
  BEHAVIORAL_TRUST_STATUS,
  aggregateCompareBehavior,
} from "./behavioralTrustOps.js";
import { getRecommendationMaturityWeeklySnapshots } from "./recommendationMaturityOps.js";
import { getOwnershipRealismWeeklySnapshots } from "./ownershipRealismOps.js";

function countCompareSwitchAfterDoubt(events) {
  let switches = 0;
  const bySession = {};
  for (const e of events) {
    const sid = e.sessionId || "default";
    if (!bySession[sid]) bySession[sid] = [];
    bySession[sid].push(e);
  }
  for (const list of Object.values(bySession)) {
    let doubted = false;
    for (const e of list) {
      if (e.type === "recommendation_doubted") doubted = true;
      if (doubted && e.type === "compare_started") {
        switches += 1;
        doubted = false;
      }
    }
  }
  return switches;
}

function refinementPriorityScore(row = {}) {
  return Math.round(
    (row.trustVolatility ?? 0) * 0.35 +
      (row.doubtCount ?? 0) * 12 +
      (row.flags?.length ?? 0) * 8 +
      (100 - (row.avgMaturity ?? 50)) * 0.25
  );
}

/**
 * @param {object} ctx
 */
export function buildRecommendationRefinementReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const maturity = buildRecommendationMaturityReport(ctx);
  const ownership = buildOwnershipRealismReport(ctx);
  const charging = buildChargingPracticalityReport(ctx);
  const trustFeedback = buildTrustFeedbackReport(ctx);
  const behavioralTrust = buildBehavioralTrustReport(ctx);
  const { global: compareGlobal } = aggregateCompareBehavior(events);
  const compareCompletionPct =
    compareGlobal.compare_started > 0
      ? Math.round(
          (compareGlobal.compare_completed / compareGlobal.compare_started) * 100
        )
      : 0;

  const unstableComparePairs = maturity.comparePairs
    .filter(
      (p) =>
        p.trustVolatility >= 42 ||
        p.status === RECOMMENDATION_MATURITY_STATUS.NEEDS_REVIEW ||
        p.flags?.length >= 1
    )
    .map((p) => {
      const doubtCount = trustFeedback.mostDoubtedComparePairs.find(
        (d) => d.pairSlug === p.pairSlug
      )?.count;
      return {
        ...p,
        doubtCount: doubtCount || 0,
        refinementPriorityScore: refinementPriorityScore({
          trustVolatility: p.trustVolatility,
          doubtCount,
          flags: p.flags,
          avgMaturity: p.avgMaturity,
        }),
      };
    })
    .sort((a, b) => b.refinementPriorityScore - a.refinementPriorityScore);

  const highDoubtOwnershipJourneys = ownership.rows
    .filter((r) =>
      trustFeedback.weakOwnershipRealismGroups?.some((w) => w.slug === r.slug)
    )
    .slice(0, 10);

  const weakChargingLogic = charging.rows
    .filter((r) => r.flags?.length >= 2)
    .slice(0, 10);

  const compareRealismDisagreements = maturity.comparePairs.filter((p) =>
    p.flags?.some((f) =>
      [
        "unrealistic_compare_separation",
        "contradictory_ownership_suggestions",
        "compare_realism_disagreement",
      ].includes(f)
    )
  );

  const lowTrustClusters = behavioralTrust.rows
    .filter(
      (r) =>
        r.status === BEHAVIORAL_TRUST_STATUS.NEEDS_REVIEW ||
        r.status === BEHAVIORAL_TRUST_STATUS.LOW_CONFIDENCE
    )
    .slice(0, 10);

  const humanCalibrationQueue = [
    ...unstableComparePairs.filter((p) => p.refinementPriorityScore >= 45),
    ...maturity.rows
      .filter((r) => r.humanReviewSuggested)
      .map((r) => ({
        pairSlug: r.slug,
        type: "vehicle",
        refinementPriorityScore: 100 - r.recommendationMaturityScore,
        reason: "human_review_suggested",
      })),
  ]
    .slice(0, 15);

  const maturityWeekly = getRecommendationMaturityWeeklySnapshots();
  const ownershipWeekly = getOwnershipRealismWeeklySnapshots();
  const prevM = maturityWeekly[1];
  const curM = maturityWeekly[0];
  const recommendationVolatilityTrend =
    curM?.needsReview != null &&
    prevM?.needsReview != null &&
    curM.needsReview > prevM.needsReview + 2
      ? "rising"
      : "stable";

  const compareStabilityEvolution =
    maturity.maturityTrend === "realism_regression"
      ? "unstable"
      : maturity.maturityTrend === "improving"
        ? "improving"
        : "stable";

  const ownershipRealismDrift =
    ownershipWeekly[0]?.avgOwnership != null &&
    ownershipWeekly[1]?.avgOwnership != null &&
    ownershipWeekly[0].avgOwnership < ownershipWeekly[1].avgOwnership - 5
      ? "declining"
      : "stable";

  const abandonAfterGuidance = events.filter(
    (e) => e.type === "compare_abandon_after_guidance"
  ).length;

  const highConfidenceButDistrusted = maturity.rows
    .filter((r) => r.recommendationMaturityScore >= 70)
    .map((r) => {
      const doubted = trustFeedback.mostDoubtedComparePairs.some((d) =>
        String(d.pairSlug || "").includes(String(r.slug || ""))
      );
      return doubted ? { ...r, distrusted: true } : null;
    })
    .filter(Boolean)
    .slice(0, 8);

  const repeatedSwitchJourneys = countCompareSwitchAfterDoubt(events);

  const weakRealismHotspots = [
    ...ownership.weakApartmentPracticality?.slice(0, 4).map((r) => ({
      type: "apartment",
      slug: r.slug,
      name: r.name,
    })),
    ...ownership.weakHighwayPracticality?.slice(0, 4).map((r) => ({
      type: "highway",
      slug: r.slug,
      name: r.name,
    })),
  ];

  const weakOwnershipFitClusters = ownership.rows
    .filter((r) => r.status === "CONDITIONAL" || r.flags?.length >= 1)
    .slice(0, 8);

  const weakApartmentRecommendations = charging.rows
    .filter((r) => r.flags?.includes("apartment_charging_risk"))
    .slice(0, 8);

  const weakHighwayRecommendations = ownership.rows
    .filter((r) => r.flags?.includes("weak_highway_practicality"))
    .slice(0, 8);

  const highDoubtComparePairs = trustFeedback.mostDoubtedComparePairs.slice(0, 8);
  const lowConfidenceHighTraffic = maturity.weakConfidenceHighTraffic || [];

  const recommendationConfidenceDrift =
    recommendationVolatilityTrend === "rising" ||
    ownershipRealismDrift === "declining"
      ? "drifting"
      : compareStabilityEvolution === "improving"
        ? "improving"
        : "stable";

  const compareTrustRecoveryTrend =
    compareCompletionPct >= 45 &&
    abandonAfterGuidance < (events.filter((e) => e.type === "compare_started").length || 1) * 0.4
      ? "recovering"
      : "needs_attention";

  const volatilitySpikes = unstableComparePairs.filter(
    (p) => p.trustVolatility >= 55
  ).slice(0, 6);

  const requiresEditorialCalibration = humanCalibrationQueue.filter(
    (q) => q.refinementPriorityScore >= 50
  );

  const trustRecoveryQuality =
    compareTrustRecoveryTrend === "recovering" &&
    compareCompletionPct >= 50
      ? "strong"
      : compareTrustRecoveryTrend === "recovering"
        ? "developing"
        : "needs_work";

  const recommendationResilienceTrend =
    recommendationConfidenceDrift === "improving" &&
    compareStabilityEvolution !== "unstable"
      ? "strengthening"
      : recommendationConfidenceDrift === "drifting"
        ? "fragile"
        : "stable";

  const compareConfidenceStabilization =
    volatilitySpikes.length <= 2 && compareStabilityEvolution === "improving"
      ? "stabilizing"
      : volatilitySpikes.length >= 4
        ? "unstable"
        : "watch";

  const weakRealismPersistence = ownership.weakRealismPersistence || "watch";

  const recurringDistrustClusters = trustFeedback.mostDoubtedComparePairs
    .filter((d) => (d.count ?? 0) >= 2)
    .slice(0, 8);

  const mostPersistentDistrustClusters = recurringDistrustClusters;
  const weakRealismSurvivesCalibration = ownership.persistentWeakRealismSlugs || [];
  const highTrafficUnstableCompares = lowConfidenceHighTraffic;
  const repeatedSwitchOwnershipJourneys = highDoubtOwnershipJourneys;
  const weakChargingPracticalityTrust = weakChargingLogic.filter(
    (r) => r.flags?.includes("apartment_charging_risk")
  );

  const highBounceRecommendationFlows = behavioralTrust.highBounceCompare?.slice(
    0,
    6
  ) || [];

  const recommendationsTrustedRepeatedly =
    maturity.repeatUsageTrustPersistence === "persistent" &&
    maturity.recommendationDurabilityConfidence === "confident";

  const weakTrustPersistence =
    maturity.recurringDistrustPersistence === "persistent" ||
    maturity.longTermTrustVolatility === "elevated"
      ? "weak"
      : "adequate";

  const mostDurableRecommendationJourneys =
    maturity.mostDurableCompareRecommendations || [];

  const distrustRecurringAfterRevisit =
    maturity.distrustRecurringAfterRevisit || recurringDistrustClusters;

  const ownershipRealismDurability = maturity.ownershipRealismDurability;

  const recommendationPersistenceQuality = maturity.recommendationPersistenceQuality;
  const trustDurabilityTrend = maturity.trustDurabilityTrend;
  const recommendationRevisitTrust = maturity.recommendationRevisitTrust;
  const compareConfidencePersistence = maturity.compareConfidencePersistence;
  const ownershipRealismPersistence = maturity.ownershipRealismPersistence;
  const recommendationFatigueTrend = maturity.recommendationFatigueTrend;
  const mostTrustedDurableRecommendations = maturity.mostTrustedDurableRecommendations;
  const weakRecommendationPersistence =
    maturity.weakRecommendationPersistence === "persistent" ? "weak" : "adequate";
  const trustDecayAfterRevisit = maturity.trustDecayAfterRevisit;
  const highConfidenceDistrustClusters = maturity.highConfidenceDistrustClusters;
  const recommendationFatigueHotspots = maturity.recommendationFatigueHotspots;

  const repeatUsageRecommendationDurability =
    maturity.repeatUsageRecommendationDurability;
  const distrustRecoveryDurability = maturity.distrustRecoveryDurability;
  const recommendationFatigueEvolution = maturity.recommendationFatigueEvolution;
  const mostTrustedLongTermRecommendations = maturity.mostTrustedLongTermRecommendations;
  const distrustReturningAfterRevisit = maturity.distrustReturningAfterRevisit;

  const recommendationUsefulnessPersistence = maturity.recommendationUsefulnessPersistence;
  const repeatUseTrustDurability = maturity.repeatUseTrustDurability;
  const compareConfidenceUsefulness = maturity.compareConfidenceUsefulness;
  const recommendationFatiguePersistence = maturity.recommendationFatiguePersistence;
  const distrustRecoveryQuality = maturity.distrustRecoveryQuality;
  const ownershipRealismTrustPersistence = maturity.ownershipRealismTrustPersistence;
  const mostUsefulLongTermRecommendations = maturity.mostUsefulLongTermRecommendations;
  const weakUsefulnessPersistence = maturity.weakUsefulnessPersistence;
  const strongOwnershipRealismTrust = ownership.strongOwnershipRealismTrust;

  const recommendationReadabilityPersistence =
    ctx.contentUsefulness?.recommendationReadabilityPersistence;
  const mostDurableUsefulRecommendations = mostUsefulLongTermRecommendations;
  const weakRecommendationUsefulness = weakUsefulnessPersistence;

  const recommendationClarityQuality =
    recommendationReadabilityPersistence === "persistent" ? "clear" : "developing";

  const trustConsistencyTrend =
    trustDurabilityTrend === "strengthening" || trustDurabilityTrend === "stable"
      ? "stable"
      : "volatile";

  const weakTrustConsistency = weakTrustPersistence;
  const mostConsistentlyTrustedRecommendations =
    mostTrustedDurableRecommendations || mostUsefulLongTermRecommendations;

  const recommendationClarityPersistence =
    recommendationClarityQuality === "clear" ? "persistent" : "building";

  const weakRecommendationDurability = weakRecommendationUsefulness;

  const recommendationDurabilityUnderTraffic = maturity.recommendationStabilityPersistence;

  const trustDurabilityUnderTraffic =
    recommendationDurabilityUnderTraffic === "durable" ? "durable" : "developing";

  const recommendationsStableUnderScale =
    trustConsistencyTrend === "stable" && recommendationDurabilityUnderTraffic === "durable";

  const weakTrustDurabilityUnderTraffic = weakTrustConsistency;
  const distrustRecurringUnderGrowth =
    distrustRecurrenceTrend === "recurring" || distrustRecurrenceQuality === "recurring";
  const recommendationFatigueUnderUsage =
    recommendationFatiguePersistence === "elevated" ? "elevated" : "normal";

  const recommendationTrustPersistence = maturity.recommendationStabilityPersistence;
  const compareConfidenceStability = compareConfidencePersistence;
  const recommendationQualityUnderLoad =
    recommendationDurabilityUnderTraffic === "durable" ? "strong" : "developing";
  const recommendationsStableUnderTraffic = recommendationsStableUnderScale;

  return {
    mostUnstableComparePairs: unstableComparePairs.slice(0, 8),
    unstableComparePairs: unstableComparePairs.slice(0, 12),
    highConfidenceButDistrusted,
    repeatedSwitchCompareJourneys: repeatedSwitchJourneys,
    weakRealismHotspots,
    requiresEditorialCalibration,
    highDoubtOwnershipJourneys,
    weakChargingPracticalityLogic: weakChargingLogic,
    compareRealismDisagreements: compareRealismDisagreements.slice(0, 10),
    lowTrustRecommendationClusters: lowTrustClusters,
    humanCalibrationQueue,
    recommendationVolatilityTrend,
    compareStabilityEvolution,
    ownershipRealismDrift,
    abandonmentAfterGuidance,
    highDoubtComparePairs,
    lowConfidenceHighTraffic,
    recommendationConfidenceDrift,
    compareTrustRecoveryTrend,
    weakOwnershipFitClusters,
    weakApartmentChargingRecommendations: weakApartmentRecommendations,
    weakHighwayPracticalityRecommendations: weakHighwayRecommendations,
    volatilitySpikes,
    trustRecoveryQuality,
    recommendationResilienceTrend,
    compareConfidenceStabilization,
    weakRealismPersistence,
    recurringDistrustClusters,
    mostPersistentDistrustClusters,
    weakRealismSurvivesCalibration,
    highTrafficUnstableCompares,
    repeatedSwitchOwnershipJourneys,
    weakChargingPracticalityTrust,
    highBounceRecommendationFlows,
    recommendationsTrustedRepeatedly,
    weakTrustPersistence,
    mostDurableRecommendationJourneys,
    distrustRecurringAfterRevisit,
    ownershipRealismDurability,
    recommendationDurabilityConfidence: maturity.recommendationDurabilityConfidence,
    repeatUsageTrustPersistence: maturity.repeatUsageTrustPersistence,
    compareTrustStability: maturity.compareTrustStability,
    distrustRecoveryPersistence: maturity.distrustRecoveryPersistence,
    recommendationFatigueDetection: maturity.recommendationFatigueDetection,
    recommendationPersistenceQuality,
    trustDurabilityTrend,
    recommendationRevisitTrust,
    compareConfidencePersistence,
    ownershipRealismPersistence,
    recommendationFatigueTrend,
    mostTrustedDurableRecommendations,
    weakRecommendationPersistence,
    trustDecayAfterRevisit,
    highConfidenceDistrustClusters,
    recommendationFatigueHotspots,
    recommendationTrustPersistence,
    repeatUsageRecommendationDurability,
    distrustRecoveryDurability,
    recommendationFatigueEvolution,
    mostTrustedLongTermRecommendations,
    distrustReturningAfterRevisit,
    recommendationUsefulnessPersistence,
    repeatUseTrustDurability,
    compareConfidenceUsefulness,
    recommendationFatiguePersistence,
    distrustRecoveryQuality,
    ownershipRealismTrustPersistence,
    mostUsefulLongTermRecommendations,
    weakUsefulnessPersistence,
    strongOwnershipRealismTrust,
    recommendationReadabilityPersistence,
    mostDurableUsefulRecommendations,
    weakRecommendationUsefulness,
    recommendationUsefulnessEvolution: maturity.recommendationUsefulnessEvolution,
    longTermTrustDurability: maturity.longTermTrustDurability,
    distrustRecurrenceQuality: maturity.distrustRecurrenceQuality,
    ownershipRealismDurability: maturity.ownershipRealismDurability,
    recommendationClarityQuality,
    trustConsistencyTrend,
    weakTrustConsistency,
    mostConsistentlyTrustedRecommendations,
    compareConfidenceConsistency: compareConfidencePersistence,
    distrustRecurrencePersistence:
      maturity.distrustRecurrenceQuality === "recurring" ? "persistent" : "low",
    ownershipRealismConsistency: ownershipRealismPersistence,
    recommendationFatigueStability:
      recommendationFatiguePersistence === "elevated" ? "unstable" : "stable",
    recommendationDurabilityPersistence: maturity.recommendationStabilityPersistence,
    repeatUserTrustConsistency: maturity.repeatUseTrustDurability,
    compareConfidenceDurability: maturity.compareConfidenceDurability,
    distrustRecurrenceTrend: maturity.distrustRecurrenceQuality,
    ownershipRealismPersistenceQuality: ownershipRealismPersistence,
    fatiguePersistenceQuality: recommendationFatiguePersistence,
    recommendationClarityPersistence,
    weakRecommendationDurability,
    trustDurabilityUnderTraffic,
    recommendationsStableUnderScale,
    weakTrustDurabilityUnderTraffic,
    distrustRecurringUnderGrowth,
    recommendationFatigueUnderUsage,
    compareConfidenceStability,
    recommendationQualityUnderLoad,
    recommendationsStableUnderTraffic,
    recommendationsImprovingOverTime: maturity.recommendationsImprovingOverTime,
    persistentDistrustDespiteCalibration:
      maturity.persistentDistrustDespiteCalibration,
    mostDurableCompareRecommendations:
      maturity.mostDurableCompareRecommendations,
    weakRecommendationRecovery: maturity.weakRecommendationRecovery,
    longTermTrustVolatility: maturity.longTermTrustVolatility,
    recommendationStabilityPersistence: maturity.recommendationStabilityPersistence,
    trustRecoveryEffectiveness: maturity.trustRecoveryEffectiveness,
    compareConfidenceDurability: maturity.compareConfidenceDurability,
    weakRecommendationPersistence: maturity.weakRecommendationPersistence,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "recommendation-refinement",
      version: 3,
      calibrationReviewAt: new Date().toISOString(),
      reviewOwner: "editorial-trust",
    },
  };
}
