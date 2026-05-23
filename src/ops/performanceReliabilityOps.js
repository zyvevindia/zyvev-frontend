/**
 * Production reliability signals — compare latency, media payload, fallbacks.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { getTrustedBetaWeeklySnapshots } from "./trustedBetaOps.js";

export function buildPerformanceReliabilityReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const slowCompare = events.filter(
    (e) => e.type === "compare_slow" || e.type === "api_slow_client"
  ).length;
  const imageFallback = events.filter(
    (e) => e.type === "image_fallback_used"
  ).length;
  const routePaint = events.filter((e) => e.type === "route_paint_slow").length;

  const cars = ctx.cars || [];
  const heavyMedia = cars.filter((c) => {
    const hero = c.heroImage || c.listingThumbnail;
    return hero && !hero.includes("res.cloudinary.com");
  }).length;

  const trustRenderEvents = events.filter((e) =>
    [
      "compare_confidence_expanded",
      "ownership_tooltip_opened",
      "suitability_guidance_opened",
    ].includes(e.type)
  ).length;

  const recommendationPayloadEstimate = cars.length * 2.4;

  const ownershipIntelligenceWarnings = [];
  if (recommendationPayloadEstimate > 120) {
    ownershipIntelligenceWarnings.push("recommendation_payload_growth");
  }
  if (trustRenderEvents > 50) {
    ownershipIntelligenceWarnings.push("trust_render_volume_high");
  }

  const weekly = getTrustedBetaWeeklySnapshots();
  const prev = weekly[1];
  const current = weekly[0];
  const betaStabilityTrend =
    prev?.betaStabilityScore != null &&
    current?.betaStabilityScore != null &&
    current.betaStabilityScore < prev.betaStabilityScore - 8
      ? "declining"
      : prev?.betaStabilityScore != null &&
          current.betaStabilityScore > prev.betaStabilityScore + 5
        ? "improving"
        : "stable";
  const operationalConfidenceTrend =
    prev?.operationalConfidence != null &&
    current?.operationalConfidence != null &&
    current.operationalConfidence < prev.operationalConfidence - 6
      ? "watch"
      : "stable";

  const regressionEarlyWarning = [];
  if (imageFallback >= 5) regressionEarlyWarning.push("media_fallback_regression");
  if (slowCompare >= 3) regressionEarlyWarning.push("compare_latency");
  if (ownershipIntelligenceWarnings.length) {
    regressionEarlyWarning.push(...ownershipIntelligenceWarnings);
  }

  const compareStabilityTrend =
    slowCompare >= 3 ? "degraded" : slowCompare >= 1 ? "watch" : "stable";

  const trustRenderEfficiencyTrend =
    trustRenderEvents > 80
      ? "heavy"
      : trustRenderEvents > 30
        ? "moderate"
        : "efficient";

  const mediaReliabilityTrend =
    imageFallback >= 5 ? "regression" : imageFallback >= 2 ? "watch" : "stable";

  const repeatVisits = events.filter(
    (e) => e.type === "repeated_ev_interest" || e.meta?.repeatSession === true
  ).length;

  const compareRenderStability =
    compareStabilityTrend === "stable" ? "stable" : compareStabilityTrend;

  const routeTransitionSmoothness =
    routePaint < 2 ? "smooth" : routePaint < 5 ? "watch" : "rough";

  const imageLoadReliability =
    mediaReliabilityTrend === "stable" ? "reliable" : mediaReliabilityTrend;

  const trustRenderStability =
    trustRenderEfficiencyTrend === "efficient" || trustRenderEfficiencyTrend === "moderate"
      ? "stable"
      : "watch";

  const mediaConsistency = mediaReliabilityTrend;

  const repeatVisitPerformance =
    repeatVisits >= 2 && slowCompare === 0 ? "healthy" : repeatVisits >= 1 ? "watch" : "early";

  const perceivedSpeedQuality =
    slowCompare === 0 && routePaint < 3 && imageFallback < 3
      ? "fast"
      : slowCompare < 3
        ? "adequate"
        : "slow";

  const productionStabilityHealthy =
    compareReliabilityTrend === "stable" &&
    mediaReliabilityTrend === "stable" &&
    regressionEarlyWarning.length === 0;

  const performanceStableUnderGrowth =
    betaStabilityTrend !== "declining" && operationalConfidenceTrend === "stable";

  const compareRenderingReliable = compareReliabilityTrend === "stable";
  const mediaDeliveryHealthy = mediaReliabilityTrend === "stable";
  const routeTransitionsSmooth = routeTransitionSmoothness === "smooth";

  const livePlatformHealthTrend = betaStabilityTrend;
  const recommendationStabilityUnderTraffic =
    ctx.refinement?.recommendationDurabilityPersistence === "durable" ||
    ctx.refinement?.recommendationStabilityPersistence === "durable"
      ? "stable"
      : "watch";

  const trustConsistencyUnderLoad = trustRenderStability;
  const repeatUserOperationalQuality = repeatVisitPerformance;
  const compareReliabilityUnderUsage = compareReliabilityTrend;
  const authorityContentFreshnessQuality =
    ctx.contentUsefulness?.guideUsefulnessTrend === "improving" ||
    ctx.contentUsefulness?.authorityRetentionTrend === "improving"
      ? "fresh"
      : "adequate";

  const operationalStabilityPersistence = productionStabilityHealthy
    ? "persistent"
    : "watch";

  const mediaReliabilityUnderTraffic = mediaReliabilityTrend;
  const perceivedSpeedPersistence =
    perceivedSpeedQuality === "fast" || perceivedSpeedQuality === "adequate"
      ? "persistent"
      : "watch";

  const operationalFreshnessQuality = authorityContentFreshnessQuality;
  const trustPersistenceUnderLiveTraffic = trustConsistencyUnderLoad;
  const repeatUserOperationalStability = repeatUserOperationalQuality;
  const compareReliabilityPersistence =
    compareReliabilityUnderUsage === "stable" ? "persistent" : "watch";
  const authorityFreshnessQuality = authorityContentFreshnessQuality;
  const recommendationStabilityUnderLoad = recommendationStabilityUnderTraffic;
  const publicPlatformHealthPersistence = operationalStabilityPersistence;
  const mediaStabilityUnderTraffic = mediaReliabilityUnderTraffic;
  const perceivedSpeedConsistency = perceivedSpeedPersistence;

  return {
    slowCompareEvents: slowCompare,
    imageFallbackEvents: imageFallback,
    routePaintSlowEvents: routePaint,
    nonCloudinaryHeroCount: heavyMedia,
    mediaRegressionAlert: imageFallback >= 5,
    compareLatencyAlert: slowCompare >= 3,
    catalogStaleAlert: (ctx.freshnessEscalations ?? 0) > 2,
    trustRenderTimingEstimate: trustRenderEvents,
    recommendationPayloadDiagnostics: {
      catalogVehicleCount: cars.length,
      estimatedKbPerCompare: Math.round(recommendationPayloadEstimate),
    },
    ownershipIntelligencePerformanceWarnings: ownershipIntelligenceWarnings,
    betaStabilityTrend,
    operationalConfidenceTrend,
    regressionEarlyWarning,
    compareStabilityTrend,
    trustRenderEfficiencyTrend,
    mediaReliabilityTrend,
    learningSystemOverheadTrend:
      trustRenderEvents > 60 || recommendationPayloadEstimate > 140
        ? "elevated"
        : "normal",
    trustRenderEfficiencyEvolution: trustRenderEfficiencyTrend,
    operationalStabilityTrend: betaStabilityTrend,
    compareReliabilityTrend: compareStabilityTrend,
    compareRenderStability,
    routeTransitionSmoothness,
    imageLoadReliability,
    trustRenderStability,
    mediaConsistency,
    repeatVisitPerformance,
    perceivedSpeedQuality,
    productionStabilityHealthy,
    performanceStableUnderGrowth,
    compareRenderingReliable,
    mediaDeliveryHealthy,
    routeTransitionsSmooth,
    livePlatformHealthTrend,
    recommendationStabilityUnderTraffic,
    trustConsistencyUnderLoad,
    repeatUserOperationalQuality,
    compareReliabilityUnderUsage,
    authorityContentFreshnessQuality,
    operationalStabilityPersistence,
    mediaReliabilityUnderTraffic,
    perceivedSpeedPersistence,
    operationalFreshnessQuality,
    trustPersistenceUnderLiveTraffic,
    repeatUserOperationalStability,
    compareReliabilityPersistence,
    authorityFreshnessQuality,
    recommendationStabilityUnderLoad,
    publicPlatformHealthPersistence,
    mediaStabilityUnderTraffic,
    perceivedSpeedConsistency,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "performance-reliability",
      version: 2,
      generatedAt: new Date().toISOString(),
      reviewOwner: "platform-ops",
      performanceReviewAt: new Date().toISOString(),
    },
  };
}
