/**
 * Recommendation maturity — trust volatility, realism regressions, compare maturity.
 */

import { ensureArray } from "../utils/compareArrayUtils.js";
import { buildCompareScoreInsight, auditCompareSetCredibility } from "../utils/compareConfidence.js";
import { scoreOwnershipRealism } from "./ownershipRealismOps.js";
import { scoreChargingPracticality } from "./chargingPracticalityOps.js";
import { buildCompareSuitabilityInsights } from "./userSuitabilityOps.js";
import { aggregateCompareBehavior } from "./behavioralTrustOps.js";
import { listUsageLearningEvents } from "./usageLearningBuffer.js";

export const RECOMMENDATION_MATURITY_STATUS = Object.freeze({
  TRUSTED: "TRUSTED",
  MATURE: "MATURE",
  DEVELOPING: "DEVELOPING",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
});

const WEEKLY_KEY = "evsavari-recommendation-maturity-weekly-v1";

function readWeekly() {
  try {
    const raw = localStorage.getItem(WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordRecommendationMaturityWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getRecommendationMaturityWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function maturityVolatility(insight, own, chg, feedbackPenalty = 0) {
  let v = feedbackPenalty;
  if (insight.confidence === "low") v += 25;
  if (own.flags?.length >= 2) v += 20;
  if (chg.flags?.length >= 2) v += 15;
  if (own.status === "LOW_CONFIDENCE" || own.status === "NEEDS_REVIEW") v += 15;
  return Math.min(100, v);
}

function doubtPenaltyForPair(pairSlug, events = []) {
  const slug = String(pairSlug || "").toLowerCase();
  if (!slug) return 0;
  const doubted = events.filter(
    (e) =>
      e.type === "recommendation_doubted" &&
      (e.meta?.pairSlug === slug ||
        String(e.meta?.sourcePage || "").includes(slug))
  ).length;
  const abandonGuidance = events.filter(
    (e) =>
      e.type === "compare_abandon_after_guidance" &&
      (e.meta?.pairSlug === slug ||
        String(e.meta?.sourcePage || "").includes(slug))
  ).length;
  return Math.min(35, doubted * 10 + abandonGuidance * 8);
}

/**
 * @param {object} car
 */
export function scoreRecommendationMaturity(car = {}) {
  const insight = buildCompareScoreInsight(car);
  const own = scoreOwnershipRealism(car);
  const chg = scoreChargingPracticality(car);

  const ownershipMaturity = own.ownershipRealismScore;
  const chargingMaturity = chg.composite;
  const compareMaturity = Math.round(
    (ownershipMaturity + chargingMaturity + (insight.score ?? 50)) / 3
  );

  const volatility = maturityVolatility(insight, own, chg);
  const flags = [...(own.flags || []), ...(chg.flags || [])];

  let status = RECOMMENDATION_MATURITY_STATUS.DEVELOPING;
  const matureBand =
    compareMaturity >= 72 &&
    insight.confidence !== "low" &&
    flags.length === 0;

  if (
    matureBand &&
    insight.recommendationMaturity === "mature" &&
    volatility < 38
  ) {
    status = RECOMMENDATION_MATURITY_STATUS.TRUSTED;
  } else if (compareMaturity >= 68 && flags.length <= 1 && volatility < 45) {
    status = RECOMMENDATION_MATURITY_STATUS.MATURE;
  } else if (compareMaturity < 50 || flags.length >= 3 || volatility >= 65) {
    status = RECOMMENDATION_MATURITY_STATUS.LOW_CONFIDENCE;
  } else if (
    flags.length >= 2 ||
    insight.confidence === "low" ||
    volatility >= 48
  ) {
    status = RECOMMENDATION_MATURITY_STATUS.NEEDS_REVIEW;
  }

  return {
    slug: car.slug,
    name: car.name,
    status,
    recommendationMaturityScore: compareMaturity,
    ownershipConfidenceMaturity: ownershipMaturity,
    chargingRealismMaturity: chargingMaturity,
    compareRealismMaturity: compareMaturity,
    trustVolatility: volatility,
    flags: [...new Set(flags)],
    humanReviewSuggested:
      status === RECOMMENDATION_MATURITY_STATUS.NEEDS_REVIEW ||
      status === RECOMMENDATION_MATURITY_STATUS.LOW_CONFIDENCE,
    auditAt: new Date().toISOString(),
  };
}

/**
 * @param {object} pair — { pairSlug, cars }
 */
export function scoreComparePairMaturity(pair = {}, events = []) {
  const cars = pair.cars || [];
  const insight = auditCompareSetCredibility(cars);
  const suitability = buildCompareSuitabilityInsights(cars);
  const rows = cars.map((c) => scoreRecommendationMaturity(c));
  const feedbackPenalty = doubtPenaltyForPair(pair.pairSlug, events);
  const avg = Math.round(
    rows.reduce((n, r) => n + r.recommendationMaturityScore, 0) /
      Math.max(1, rows.length) -
      feedbackPenalty * 0.3
  );

  const flags = [];
  if (insight.warnings?.some((w) => w.code === "large_score_gap")) {
    flags.push("unrealistic_compare_separation");
  }
  if (insight.warnings?.some((w) => w.code === "duplicate_strengths")) {
    flags.push("contradictory_ownership_suggestions");
  }
  if (suitability.length === 0 && cars.length >= 2) {
    flags.push("weak_suitability_logic");
  }
  if (feedbackPenalty >= 18) flags.push("overconfident_but_distrusted");
  if (feedbackPenalty >= 10) flags.push("guidance_confusion_spike");

  let status = RECOMMENDATION_MATURITY_STATUS.DEVELOPING;
  if (avg >= 78 && flags.length === 0) {
    status = RECOMMENDATION_MATURITY_STATUS.TRUSTED;
  } else if (avg >= 70 && flags.length <= 1) {
    status = RECOMMENDATION_MATURITY_STATUS.MATURE;
  } else if (avg < 52 || flags.length >= 2) {
    status = RECOMMENDATION_MATURITY_STATUS.NEEDS_REVIEW;
  }

  return {
    pairSlug: pair.pairSlug,
    status,
    avgMaturity: avg,
    flags,
    vehicles: rows,
    suitabilityInsights: suitability,
    recommendationStabilityScore: Math.max(0, avg - feedbackPenalty),
    recommendationConfidenceGap: feedbackPenalty,
    trustVolatility: Math.min(100, feedbackPenalty + (flags.length * 8)),
  };
}

export function buildRecommendationMaturityReport(ctx = {}) {
  const cars = ctx.cars || [];
  const events = listUsageLearningEvents();
  const { global } = aggregateCompareBehavior(events);

  const rows = cars.map((car) => scoreRecommendationMaturity(car));
  const statusCounts = Object.fromEntries(
    Object.values(RECOMMENDATION_MATURITY_STATUS).map((s) => [s, 0])
  );
  for (const r of rows) statusCounts[r.status] += 1;

  const comparePairs = ensureArray(ctx.comparePairs)
    .slice(0, 20)
    .map((p) => {
      const slug = p.slug || p.pairSlug || "";
      const pairCars = cars.filter((c) => {
        const s = String(c.slug || "").toLowerCase();
        return slug.split("-vs-").some((part) => s.startsWith(part));
      });
      return scoreComparePairMaturity(
        {
          pairSlug: slug,
          cars: pairCars,
        },
        events
      );
    })
    .filter((p) => p.vehicles?.length >= 2);

  const immaturePairs = comparePairs.filter(
    (p) =>
      p.status === RECOMMENDATION_MATURITY_STATUS.NEEDS_REVIEW ||
      p.flags.includes("unrealistic_compare_separation")
  );

  const highTrafficWeak = comparePairs.filter((p) => {
    const trend = (ctx.compareTrends || []).find(
      (t) => t.slug === p.pairSlug
    );
    return (
      (trend?.started ?? 0) >= 5 &&
      p.status !== RECOMMENDATION_MATURITY_STATUS.MATURE &&
      p.status !== RECOMMENDATION_MATURITY_STATUS.TRUSTED
    );
  });

  const trustedPct =
    rows.length > 0
      ? Math.round(
          ((statusCounts.TRUSTED + statusCounts.MATURE) / rows.length) * 100
        )
      : 0;

  recordRecommendationMaturityWeekly({
    trustedPct,
    avgMaturity: Math.round(
      rows.reduce((n, r) => n + r.recommendationMaturityScore, 0) /
        Math.max(1, rows.length)
    ),
    needsReview: statusCounts.NEEDS_REVIEW + statusCounts.LOW_CONFIDENCE,
  });

  const prev = getRecommendationMaturityWeeklySnapshots()[1];
  const currentAvg =
    rows.reduce((n, r) => n + r.recommendationMaturityScore, 0) /
    Math.max(1, rows.length);
  const maturityTrend =
    prev?.avgMaturity != null && currentAvg < prev.avgMaturity - 6
      ? "realism_regression"
      : prev?.avgMaturity != null && currentAvg > prev.avgMaturity + 5
        ? "improving"
        : "stable";

  const trustDecayAlerts = [];
  if (global.compare_abandoned > global.compare_completed) {
    trustDecayAlerts.push("compare_abandon_exceeds_completion");
  }
  if (
    countEvents(events, "recommendation_doubted") >
    countEvents(events, "compare_completed") * 0.3
  ) {
    trustDecayAlerts.push("elevated_recommendation_doubt");
  }
  if (countEvents(events, "compare_abandon_after_guidance") >= 3) {
    trustDecayAlerts.push("guidance_confusion_spike");
  }
  const overconfidentDistrusted = comparePairs.filter((p) =>
    p.flags?.includes("overconfident_but_distrusted")
  );

  const weeklySnaps = getRecommendationMaturityWeeklySnapshots();
  const prevSnap = weeklySnaps[1];
  const recommendationStabilityPersistence =
    maturityTrend === "stable" || maturityTrend === "improving"
      ? "durable"
      : "fragile";

  const trustRecoveryEffectiveness =
    countEvents(events, "compare_completed") >
    countEvents(events, "recommendation_doubted")
      ? "effective"
      : "needs_calibration";

  const recurringDistrustPersistence =
    countEvents(events, "recommendation_doubted") >= 3 ? "persistent" : "low";

  const compareConfidenceDurability =
    (statusCounts.TRUSTED ?? 0) + (statusCounts.STABLE ?? 0) >=
    (statusCounts.NEEDS_REVIEW ?? 0) + (statusCounts.LOW_CONFIDENCE ?? 0)
      ? "stable"
      : "watch";

  const weakRecommendationPersistence =
    prevSnap?.needsReview != null &&
    (statusCounts.NEEDS_REVIEW ?? 0) >= prevSnap.needsReview
      ? "persistent"
      : "improving";

  const recommendationsImprovingOverTime = maturityTrend === "improving";

  const mostDurableCompareRecommendations = comparePairs
    .filter((p) => p.status === "TRUSTED" || p.trustVolatility < 35)
    .slice(0, 8);

  const weakRecommendationRecovery = comparePairs
    .filter((p) => p.trustVolatility >= 50)
    .slice(0, 6);

  const longTermTrustVolatility =
    comparePairs.filter((p) => p.trustVolatility >= 45).length >= 4
      ? "elevated"
      : "acceptable";

  const recommendationDurabilityConfidence =
    recommendationStabilityPersistence === "durable" &&
    trustRecoveryEffectiveness === "effective"
      ? "confident"
      : "building";

  const repeatUsageTrustPersistence =
    countEvents(events, "repeated_ev_interest") >= 2 &&
    recurringDistrustPersistence === "low"
      ? "persistent"
      : "emerging";

  const compareTrustStability = compareConfidenceDurability;

  const distrustRecoveryPersistence =
    trustRecoveryEffectiveness === "effective" ? "recovering" : "fragile";

  const ownershipRealismDurability =
    maturityTrend === "improving" || maturityTrend === "stable"
      ? "durable"
      : "watch";

  const recommendationFatigueDetection =
    countEvents(events, "recommendation_doubted") >= 4 &&
    countEvents(events, "compare_completed") <
      countEvents(events, "compare_started") * 0.5
      ? "elevated"
      : "normal";

  const distrustRecurringAfterRevisit = comparePairs
    .filter((p) => p.trustVolatility >= 48)
    .slice(0, 6);

  const recommendationPersistenceQuality =
    recommendationStabilityPersistence === "durable" ? "strong" : "developing";

  const trustDurabilityTrend =
    maturityTrend === "improving"
      ? "strengthening"
      : maturityTrend === "realism_regression"
        ? "declining"
        : "stable";

  const recommendationRevisitTrust =
    repeatUsageTrustPersistence === "persistent" ? "trusted" : "building";

  const compareConfidencePersistence = compareConfidenceDurability;

  const ownershipRealismPersistence = ownershipRealismDurability;

  const recommendationFatigueTrend =
    recommendationFatigueDetection === "elevated" ? "elevated" : "normal";

  const mostTrustedDurableRecommendations = mostDurableCompareRecommendations;
  const weakRecommendationPersistenceClusters = weakRecommendationRecovery;
  const trustDecayAfterRevisit = distrustRecurringAfterRevisit;
  const highConfidenceDistrustClusters = overconfidentDistrusted;
  const recommendationFatigueHotspots = comparePairs
    .filter((p) => p.trustVolatility >= 52)
    .slice(0, 6);

  const repeatUsageRecommendationDurability =
    repeatUsageTrustPersistence === "persistent" ? "durable" : "developing";
  const distrustRecoveryDurability = distrustRecoveryPersistence;
  const recommendationFatigueEvolution = recommendationFatigueTrend;

  const mostTrustedLongTermRecommendations = mostTrustedDurableRecommendations;
  const weakRecommendationPersistenceClustersAlias = weakRecommendationPersistenceClusters;

  const recommendationUsefulnessPersistence = recommendationPersistenceQuality;
  const repeatUseTrustDurability = repeatUsageRecommendationDurability;
  const compareConfidenceUsefulness = compareConfidencePersistence;
  const recommendationFatiguePersistence = recommendationFatigueTrend;
  const distrustRecoveryQuality = distrustRecoveryDurability;
  const ownershipRealismTrustPersistence = ownershipRealismPersistence;

  const mostUsefulLongTermRecommendations = mostTrustedLongTermRecommendations;
  const weakUsefulnessPersistence =
    weakRecommendationPersistence === "persistent" ? "weak" : "adequate";

  const recommendationUsefulnessEvolution =
    maturityTrend === "improving" ? "improving" : "stable";

  const longTermTrustDurability = repeatUseTrustDurability;
  const distrustRecurrenceQuality =
    distrustRecurringAfterRevisit.length >= 2 ? "recurring" : "low";

  const mostDurableUsefulRecommendations = mostUsefulLongTermRecommendations;
  const weakRecommendationUsefulness = weakUsefulnessPersistence;

  const trustConsistencyTrend =
    trustDurabilityTrend === "strengthening" || trustDurabilityTrend === "stable"
      ? "stable"
      : "volatile";

  const compareConfidenceConsistency = compareConfidencePersistence;
  const distrustRecurrencePersistence =
    distrustRecurrenceQuality === "recurring" ? "persistent" : "low";
  const ownershipRealismConsistency = ownershipRealismDurability;
  const recommendationFatigueStability =
    recommendationFatiguePersistence === "elevated" ? "unstable" : "stable";

  const recommendationDurabilityPersistence = recommendationStabilityPersistence;
  const repeatUserTrustConsistency = repeatUseTrustDurability;
  const distrustRecurrenceTrend = distrustRecurrenceQuality;
  const fatiguePersistenceQuality = recommendationFatiguePersistence;
  const weakRecommendationDurability = weakRecommendationUsefulness;

  const trustDurabilityUnderTraffic =
    recommendationDurabilityPersistence === "durable" ? "durable" : "developing";
  const recommendationsStableUnderScale =
    trustConsistencyTrend === "stable" && recommendationDurabilityPersistence === "durable";
  const distrustRecurringUnderGrowth = distrustRecurrenceTrend === "recurring";
  const recommendationFatigueUnderUsage =
    fatiguePersistenceQuality === "elevated" ? "elevated" : "normal";

  const recommendationTrustPersistence = recommendationStabilityPersistence;
  const compareConfidenceStability = compareConfidencePersistence;
  const recommendationQualityUnderLoad =
    recommendationDurabilityPersistence === "durable" ? "strong" : "developing";
  const recommendationsStableUnderTraffic = recommendationsStableUnderScale;

  return {
    rows: rows.sort(
      (a, b) => a.recommendationMaturityScore - b.recommendationMaturityScore
    ),
    comparePairs,
    statusCounts,
    trustedPct,
    immatureRecommendationPairs: immaturePairs.slice(0, 10),
    weakConfidenceHighTraffic: highTrafficWeak.slice(0, 8),
    trustDecayAlerts,
    overconfidentButDistrusted: overconfidentDistrusted.slice(0, 8),
    guidanceConfusionSpike: countEvents(events, "compare_abandon_after_guidance"),
    maturityTrend,
    recommendationStabilityPersistence,
    trustRecoveryEffectiveness,
    recurringDistrustPersistence,
    ownershipRealismRetention: maturityTrend,
    compareConfidenceDurability,
    weakRecommendationPersistence,
    recommendationsImprovingOverTime,
    persistentDistrustDespiteCalibration: overconfidentDistrusted.slice(0, 6),
    mostDurableCompareRecommendations,
    weakRecommendationRecovery,
    longTermTrustVolatility,
    recommendationDurabilityConfidence,
    repeatUsageTrustPersistence,
    compareTrustStability,
    distrustRecoveryPersistence,
    ownershipRealismDurability,
    recommendationFatigueDetection,
    distrustRecurringAfterRevisit,
    recommendationPersistenceQuality,
    trustDurabilityTrend,
    recommendationRevisitTrust,
    compareConfidencePersistence,
    ownershipRealismPersistence,
    recommendationFatigueTrend,
    mostTrustedDurableRecommendations,
    weakRecommendationPersistenceClusters,
    trustDecayAfterRevisit,
    highConfidenceDistrustClusters,
    recommendationFatigueHotspots,
    recommendationTrustPersistence,
    repeatUsageRecommendationDurability,
    distrustRecoveryDurability,
    recommendationFatigueEvolution,
    mostTrustedLongTermRecommendations,
    weakRecommendationPersistenceClusters: weakRecommendationPersistenceClustersAlias,
    distrustReturningAfterRevisit: trustDecayAfterRevisit,
    recommendationUsefulnessPersistence,
    repeatUseTrustDurability,
    compareConfidenceUsefulness,
    recommendationFatiguePersistence,
    distrustRecoveryQuality,
    ownershipRealismTrustPersistence,
    mostUsefulLongTermRecommendations,
    weakUsefulnessPersistence,
    recommendationUsefulnessEvolution,
    longTermTrustDurability,
    distrustRecurrenceQuality,
    ownershipRealismDurability,
    mostDurableUsefulRecommendations,
    weakRecommendationUsefulness,
    trustConsistencyTrend,
    compareConfidenceConsistency,
    distrustRecurrencePersistence,
    ownershipRealismConsistency,
    recommendationFatigueStability,
    recommendationDurabilityPersistence,
    repeatUserTrustConsistency,
    distrustRecurrenceTrend,
    fatiguePersistenceQuality,
    weakRecommendationDurability,
    trustDurabilityUnderTraffic,
    recommendationsStableUnderScale,
    distrustRecurringUnderGrowth,
    recommendationFatigueUnderUsage,
    compareConfidenceStability,
    recommendationQualityUnderLoad,
    recommendationsStableUnderTraffic,
    weeklySnapshots: getRecommendationMaturityWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "recommendation-maturity",
      version: 1,
      generatedAt: new Date().toISOString(),
    },
  };
}

function countEvents(events, type) {
  return events.filter((e) => e.type === type).length;
}
