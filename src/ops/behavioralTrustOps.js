/**
 * Behavioral trust calibration — merges traffic + buffer + catalog realism.
 * TRUSTED / STABLE / NEEDS_REVIEW / LOW_CONFIDENCE
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { computeRetentionSignals } from "./retentionSignals.js";
import { computeAdoptionSignals } from "./authorityDistributionOps.js";
import { buildRecommendationRealismReport, scoreRecommendationRealism } from "./recommendationRealismOps.js";
import { buildCompareQualityReport } from "./compareQualityOps.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";

export const BEHAVIORAL_TRUST_STATUS = Object.freeze({
  TRUSTED: "TRUSTED",
  STABLE: "STABLE",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
});

const BEHAVIORAL_WEEKLY_KEY = "evsavari-behavioral-trust-weekly-v1";

function readBehavioralWeekly() {
  try {
    const raw = localStorage.getItem(BEHAVIORAL_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeBehavioralWeekly(arr) {
  try {
    localStorage.setItem(
      BEHAVIORAL_WEEKLY_KEY,
      JSON.stringify(arr.slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

export function recordBehavioralTrustWeeklySnapshot(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readBehavioralWeekly().filter((s) => s.week !== week);
  writeBehavioralWeekly([
    { week, at: new Date().toISOString(), ...snapshot },
    ...filtered,
  ]);
}

export function getBehavioralTrustWeeklySnapshots() {
  return readBehavioralWeekly().slice(0, 8);
}

function pairKeyFromPath(path = "") {
  const m = String(path).match(/\/compare\/([^?#/]+)/i);
  return m ? m[1].toLowerCase() : "";
}

/** Buffer signals keyed by compare pair slug. */
export function aggregateCompareBehavior(events = listUsageLearningEvents()) {
  const byPair = {};
  const global = {
    compare_started: 0,
    compare_completed: 0,
    compare_abandoned: 0,
    trust_tooltip_opened: 0,
    ownership_tooltip_opened: 0,
    charging_practicality_opened: 0,
    compare_confidence_expanded: 0,
    suitability_guidance_opened: 0,
    recommendation_doubted: 0,
    compare_abandon_after_guidance: 0,
    lead_started: 0,
    lead_submitted: 0,
    scroll_shallow: 0,
    scroll_deep: 0,
  };

  for (const e of events) {
    const t = e.type;
    if (global[t] != null) global[t] += 1;
    if (t === "scroll_depth" && Number(e.meta?.percent) < 50) {
      global.scroll_shallow += 1;
    }
    if (t === "scroll_depth" && Number(e.meta?.percent) >= 75) {
      global.scroll_deep += 1;
    }

    const slug =
      pairKeyFromPath(e.meta?.sourcePage) ||
      String(e.meta?.pairSlug || "").toLowerCase();
    if (!slug && t !== "compare_started" && t !== "compare_abandoned") {
      continue;
    }
    const key = slug || "_global_compare";
    if (!byPair[key]) {
      byPair[key] = {
        started: 0,
        completed: 0,
        abandoned: 0,
        tooltips: 0,
        shallowScroll: 0,
        doubted: 0,
        abandonAfterGuidance: 0,
        guidanceOpened: 0,
      };
    }
    const row = byPair[key];
    if (t === "compare_started") row.started += 1;
    if (t === "compare_completed") row.completed += 1;
    if (t === "compare_abandoned") row.abandoned += 1;
    if (t === "trust_tooltip_opened") row.tooltips += 1;
    if (t === "recommendation_doubted") row.doubted += 1;
    if (t === "compare_abandon_after_guidance") row.abandonAfterGuidance += 1;
    if (
      t === "ownership_tooltip_opened" ||
      t === "compare_confidence_expanded" ||
      t === "suitability_guidance_opened"
    ) {
      row.guidanceOpened += 1;
    }
    if (t === "scroll_depth" && Number(e.meta?.percent) < 50) {
      row.shallowScroll += 1;
    }
  }

  return { byPair, global };
}

function trustEngagementQuality(bufferRow = {}, trend = null) {
  const started = Number(trend?.started ?? bufferRow.started ?? 0);
  const completed = bufferRow.completed ?? 0;
  const abandoned = bufferRow.abandoned ?? 0;
  const tooltips = bufferRow.tooltips ?? 0;

  let score = 50;
  if (started > 0) {
    const completionRate =
      trend?.completionRate != null && !Number.isNaN(Number(trend.completionRate))
        ? Number(trend.completionRate)
        : Math.round((completed / started) * 100);
    score = Math.min(100, completionRate);
  }
  if (tooltips > 0) score += Math.min(12, tooltips * 4);
  if (bufferRow.guidanceOpened > 0) score += Math.min(8, bufferRow.guidanceOpened * 2);
  if (abandoned > completed && abandoned >= 2) score -= 20;
  if (bufferRow.shallowScroll > bufferRow.completed) score -= 8;
  if (bufferRow.doubted >= 2) score -= 15;
  if (bufferRow.abandonAfterGuidance >= 2) score -= 12;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function trustDecayRisk({
  started = 0,
  completionRate = null,
  realismScore = 50,
  engagementScore = 50,
  issues = [],
}) {
  let risk = 0;
  if (started >= 6 && completionRate != null && completionRate < 35) risk += 40;
  else if (started >= 4 && completionRate != null && completionRate < 50) risk += 22;
  if (engagementScore < 45) risk += 25;
  if (realismScore < 55) risk += 20;
  if (issues.includes("overconfident_messaging_risk")) risk += 15;
  if (issues.includes("weak_charging_practicality")) risk += 10;
  if (issues.includes("overconfident_but_distrusted")) risk += 20;
  if (issues.includes("guidance_confusion_spike")) risk += 12;
  if (issues.includes("compare_realism_disagreement")) risk += 15;
  return Math.min(100, risk);
}

/**
 * @param {object} params
 */
export function scoreBehavioralTrust({
  pairSlug = "",
  cars = [],
  trend = null,
  bufferRow = {},
  realismRow = null,
} = {}) {
  const realism =
    realismRow ||
    scoreRecommendationRealism({ pairSlug, cars, trend });

  const engagementScore = trustEngagementQuality(bufferRow, trend);
  const started = Number(trend?.started ?? bufferRow.started ?? 0);
  const completionRate =
    trend?.completionRate != null && !Number.isNaN(Number(trend.completionRate))
      ? Number(trend.completionRate)
      : bufferRow.started > 0
        ? Math.round((bufferRow.completed / bufferRow.started) * 100)
        : null;

  const behavioralTrustScore = Math.round(
    engagementScore * 0.35 +
      realism.realismScore * 0.25 +
      realism.ownershipRealismScore * 0.15 +
      realism.chargingRealismScore * 0.15 +
      realism.confidenceMaturityScore * 0.1
  );

  const compareTrustConfidence = Math.round(
    (engagementScore + realism.confidenceMaturityScore) / 2
  );

  const behavioralCalibrationScore = Math.round(
    (behavioralTrustScore +
      compareTrustConfidence +
      realism.recommendationNuanceScore) /
      3
  );

  const decayRisk = trustDecayRisk({
    started,
    completionRate,
    realismScore: realism.realismScore,
    engagementScore,
    issues: realism.issues,
  });

  const weakTrustEngagement =
    engagementScore < 45 &&
    (bufferRow.abandoned >= 2 || (completionRate != null && completionRate < 40));

  const issues = [...(realism.issues || [])];
  if (weakTrustEngagement) issues.push("weak_trust_engagement");
  if (decayRisk >= 55) issues.push("trust_decay_risk");
  if (started >= 6 && completionRate != null && completionRate < 30) {
    issues.push("high_bounce_compare");
  }
  if (bufferRow.doubted >= 2 && realism.realismScore >= 70) {
    issues.push("overconfident_but_distrusted");
  }
  if (bufferRow.doubted >= 1 && started >= 3) {
    issues.push("recommendation_doubt_signal");
  }
  if (
    bufferRow.abandonAfterGuidance >= 1 &&
    bufferRow.guidanceOpened >= 2
  ) {
    issues.push("guidance_confusion_spike");
  }
  if (realism.issues?.includes("weak_score_separation") && bufferRow.doubted) {
    issues.push("compare_realism_disagreement");
  }

  let status = BEHAVIORAL_TRUST_STATUS.STABLE;
  if (
    behavioralTrustScore >= 80 &&
    decayRisk < 30 &&
    realism.status === "TRUSTED"
  ) {
    status = BEHAVIORAL_TRUST_STATUS.TRUSTED;
  } else if (
    realism.confidenceMaturityScore < 45 ||
    issues.includes("low_confidence_outcome") ||
    (completionRate != null && completionRate < 25 && started >= 4)
  ) {
    status = BEHAVIORAL_TRUST_STATUS.LOW_CONFIDENCE;
  } else if (
    decayRisk >= 50 ||
    realism.status === "NEEDS_REVIEW" ||
    issues.includes("high_bounce_compare")
  ) {
    status = BEHAVIORAL_TRUST_STATUS.NEEDS_REVIEW;
  }

  const editorialReviewSuggested =
    status === BEHAVIORAL_TRUST_STATUS.NEEDS_REVIEW ||
    status === BEHAVIORAL_TRUST_STATUS.LOW_CONFIDENCE;
  const recommendationTuningSuggested =
    issues.includes("weak_score_separation") ||
    issues.includes("contradictory_recommendation_logic");
  const trustRefinementSuggested =
    weakTrustEngagement || issues.includes("overconfident_messaging_risk");

  const hints = [];
  if (editorialReviewSuggested) hints.push("Editorial review suggested");
  if (recommendationTuningSuggested) hints.push("Recommendation tuning suggested");
  if (trustRefinementSuggested) hints.push("Trust refinement suggested");

  return {
    pairSlug,
    status,
    issues,
    behavioralTrustScore,
    compareTrustConfidence,
    recommendationRealismScore: realism.realismScore,
    ownershipRealismScore: realism.ownershipRealismScore,
    chargingPracticalityScore: realism.chargingRealismScore,
    recommendationNuanceScore: realism.recommendationNuanceScore,
    behavioralCalibrationScore,
    trustDecayRisk: decayRisk,
    trustEngagementQuality: engagementScore,
    compareConfidenceMaturity: compareTrustConfidence,
    recommendationConfidenceMaturity: realism.confidenceMaturityScore,
    traffic: { started, completionRate },
    buffer: bufferRow,
    editorialReviewSuggested,
    recommendationTuningSuggested,
    trustRefinementSuggested,
    hints,
    trustDecayAlert: decayRisk >= 55,
  };
}

function compareTrustConfidenceFromRows(rows) {
  return rows.length
    ? Math.round(
        rows.reduce((s, r) => s + r.compareTrustConfidence, 0) / rows.length
      )
    : 0;
}

export function buildBehavioralTrustReport(ctx = {}) {
  const realismReport = buildRecommendationRealismReport(ctx);
  const realismByPair = Object.fromEntries(
    realismReport.rows.map((r) => [r.pairSlug, r])
  );
  const behavior = aggregateCompareBehavior();
  const trends = ctx.traffic?.compareTrends || [];
  const quality = buildCompareQualityReport(ctx);

  const slugsSeen = new Set();
  const rows = [];

  for (const trend of trends) {
    const slug = String(trend.slug || trend.pairSlug || "").trim();
    if (!slug || slugsSeen.has(slug)) continue;
    slugsSeen.add(slug);
    rows.push(
      scoreBehavioralTrust({
        pairSlug: slug,
        cars: ctx.cars,
        trend,
        bufferRow: behavior.byPair[slug] || {},
        realismRow: realismByPair[slug],
      })
    );
  }

  for (const q of quality.rows) {
    if (slugsSeen.has(q.pairSlug)) continue;
    slugsSeen.add(q.pairSlug);
    rows.push(
      scoreBehavioralTrust({
        pairSlug: q.pairSlug,
        cars: ctx.cars,
        trend: q.traffic,
        bufferRow: behavior.byPair[q.pairSlug] || {},
        realismRow: realismByPair[q.pairSlug],
      })
    );
  }

  rows.sort((a, b) => a.behavioralTrustScore - b.behavioralTrustScore);

  const statusCounts = {
    [BEHAVIORAL_TRUST_STATUS.TRUSTED]: 0,
    [BEHAVIORAL_TRUST_STATUS.STABLE]: 0,
    [BEHAVIORAL_TRUST_STATUS.NEEDS_REVIEW]: 0,
    [BEHAVIORAL_TRUST_STATUS.LOW_CONFIDENCE]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const trustDecayAlerts = rows.filter((r) => r.trustDecayAlert);
  const highBounceCompare = rows.filter((r) =>
    r.issues.includes("high_bounce_compare")
  );

  const weakClusters = {};
  for (const r of rows.filter(
    (x) =>
      x.status === BEHAVIORAL_TRUST_STATUS.NEEDS_REVIEW ||
      x.status === BEHAVIORAL_TRUST_STATUS.LOW_CONFIDENCE
  )) {
    const key = r.issues.find((i) =>
      [
        "weak_charging_practicality",
        "weak_ownership_realism",
        "high_bounce_compare",
        "overconfident_messaging_risk",
        "contradictory_recommendation_logic",
      ].includes(i)
    ) || "other";
    weakClusters[key] = (weakClusters[key] || 0) + 1;
  }

  const recurringWeakClusters = Object.entries(weakClusters)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count);

  const lowTrustGroups = recurringWeakClusters.filter((c) => c.count >= 2);

  const avgBehavioralTrust =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, r) => s + r.behavioralTrustScore, 0) / rows.length
        )
      : 0;

  const avgOwnership =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, r) => s + r.ownershipRealismScore, 0) / rows.length
        )
      : 0;

  const avgCharging =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, r) => s + r.chargingPracticalityScore, 0) / rows.length
        )
      : 0;

  const globalBufferRow = {
    started: behavior.global.compare_started,
    completed: behavior.global.compare_completed,
    abandoned: behavior.global.compare_abandoned,
    tooltips: behavior.global.trust_tooltip_opened,
    shallowScroll: behavior.global.scroll_shallow,
  };
  const globalTrend = {
    started: Number(ctx.traffic?.compareConversions?.started ?? 0),
    completionRate: ctx.traffic?.compareConversions?.completionRate ?? null,
  };

  const engagementGlobal = {
    ...behavior.global,
    trustEngagementQuality: trustEngagementQuality(globalBufferRow, globalTrend),
    compareConfidenceMaturity: compareTrustConfidenceFromRows(rows),
    recommendationConfidenceMaturity: Math.round(
      rows.length
        ? rows.reduce((s, r) => s + r.recommendationConfidenceMaturity, 0) /
            rows.length
        : 0
    ),
  };

  const snapshot = {
    avgBehavioralTrust,
    avgOwnershipRealism: avgOwnership,
    avgChargingPracticality: avgCharging,
    trustedPct:
      rows.length > 0
        ? Math.round(
            ((statusCounts[BEHAVIORAL_TRUST_STATUS.TRUSTED] +
              statusCounts[BEHAVIORAL_TRUST_STATUS.STABLE]) /
              rows.length) *
              100
          )
        : 0,
    decayAlertCount: trustDecayAlerts.length,
    highBounceCount: highBounceCompare.length,
  };

  recordBehavioralTrustWeeklySnapshot(snapshot);

  let compareSwitchAfterDoubt = 0;
  const bufferEvents = listUsageLearningEvents();
  const bySession = {};
  for (const e of bufferEvents) {
    const sid = e.sessionId || "default";
    if (!bySession[sid]) bySession[sid] = [];
    bySession[sid].push(e);
  }
  for (const list of Object.values(bySession)) {
    let doubted = false;
    for (const e of list) {
      if (e.type === "recommendation_doubted") doubted = true;
      if (doubted && e.type === "compare_started") {
        compareSwitchAfterDoubt += 1;
        doubted = false;
      }
    }
  }

  const retention = computeRetentionSignals(bufferEvents);
  const adoption = computeAdoptionSignals(bufferEvents);

  return {
    rows,
    statusCounts,
    ...retention,
    ...adoption,
    trustDecayAlerts: trustDecayAlerts.slice(0, 10),
    highBounceCompare: highBounceCompare.slice(0, 10),
    compareAbandonment: rankCompareDropOffHotspots(trends).slice(0, 8),
    recurringWeakClusters,
    lowTrustRecommendationGroups: lowTrustGroups,
    compareSwitchAfterDoubt,
    compareTrustRecoveryTrend:
      compareSwitchAfterDoubt <= 2 &&
      behavior.global.compare_started > 0 &&
      behavior.global.compare_completed / behavior.global.compare_started >= 0.45
        ? "recovering"
        : compareSwitchAfterDoubt >= 4
          ? "volatile"
          : "stable",
    engagement: engagementGlobal,
    bufferNote:
      behavior.global.compare_started === 0
        ? "No compare events in local buffer yet — refresh after production traffic."
        : null,
    weeklySnapshots: getBehavioralTrustWeeklySnapshots(),
    avgBehavioralTrust,
    avgOwnershipRealism: avgOwnership,
    avgChargingPracticality: avgCharging,
    recommendationPersistenceQuality:
      retention.recommendationRevisitDurability === "durable" ? "strong" : "developing",
    trustDurabilityTrend:
      compareTrustRecoveryTrend === "recovering"
        ? "strengthening"
        : compareTrustRecoveryTrend === "volatile"
          ? "declining"
          : "stable",
    recommendationRevisitTrust: retention.recommendationRevisitQuality,
    compareConfidencePersistence:
      avgBehavioralTrust >= 60 ? "stable" : "watch",
    ownershipRealismPersistence:
      avgOwnership >= 60 ? "durable" : "watch",
    recommendationFatigueTrend:
      (behavior.global.doubted || 0) >= 3 ? "elevated" : "normal",
    repeatUserRecommendationTrust: retention.repeatUserRecommendationTrust,
    revisitConfidenceQuality: retention.revisitConfidenceQuality,
    trustedReturnUserDurability: retention.trustedReturnUserDurability,
    compareRevisitPersistence: retention.compareRevisitPersistence,
    ownershipGuideRevisitDurability: retention.ownershipGuideRevisitDurability,
    recommendationHabitFormation: retention.recommendationHabitFormation,
    retentionConfidenceEvolution: retention.retentionConfidenceEvolution,
    recommendationUsefulnessPersistence:
      retention.repeatUserRecommendationTrust === "trusted" ? "strong" : "developing",
    repeatUseTrustDurability: retention.trustedReturnUserDurability,
    compareConfidenceUsefulness:
      avgBehavioralTrust >= 60 ? "useful" : "watch",
    recommendationFatiguePersistence:
      (behavior.global.doubted || 0) >= 3 ? "elevated" : "normal",
    distrustRecoveryQuality:
      compareTrustRecoveryTrend === "recovering" ? "effective" : "needs_work",
    ownershipRealismTrustPersistence:
      avgOwnership >= 60 ? "durable" : "watch",
    scalingTrustDurability:
      compareTrustRecoveryTrend !== "volatile" && avgBehavioralTrust >= 55
        ? "durable"
        : "developing",
    repeatUserStability:
      retention.returnUserTrustTrend === "stable" ||
      retention.returnUserTrustTrend === "improving"
        ? "stable"
        : "watch",
    recommendationConfidenceStability:
      compareTrustRecoveryTrend === "stable" || compareTrustRecoveryTrend === "recovering"
        ? "stable"
        : "volatile",
    compareQualityUnderLoad:
      behavior.global.compare_started > 0 &&
      behavior.global.compare_completed / behavior.global.compare_started >= 0.4
        ? "holding"
        : "review",
    authorityRetentionStability:
      retention.retentionQualityEvolution !== "declining" ? "stable" : "watch",
    trustConsistencyTrend:
      compareTrustRecoveryTrend === "stable" || compareTrustRecoveryTrend === "recovering"
        ? "stable"
        : "volatile",
    recommendationStabilityPersistence:
      retention.recommendationRevisitDurability === "durable" ? "durable" : "developing",
    compareConfidenceConsistency:
      avgBehavioralTrust >= 60 ? "consistent" : "watch",
    distrustRecurrencePersistence:
      compareTrustRecoveryTrend === "recovering" ? "low" : "persistent",
    ownershipRealismConsistency:
      avgOwnership >= 60 ? "consistent" : "watch",
    recommendationFatigueStability:
      recommendationFatiguePersistence === "elevated" ? "unstable" : "stable",
    recommendationDurabilityPersistence:
      retention.recommendationRevisitDurability === "durable" ? "durable" : "developing",
    repeatUserTrustConsistency: retention.repeatUserRecommendationTrust,
    compareConfidenceDurability:
      avgBehavioralTrust >= 60 ? "durable" : "watch",
    distrustRecurrenceTrend:
      compareTrustRecoveryTrend === "recovering" ? "low" : "watch",
    ownershipRealismPersistence: ownershipRealismPersistence,
    fatiguePersistenceQuality: recommendationFatiguePersistence,
    livePlatformHealthTrend: trustDurabilityTrend,
    recommendationStabilityUnderTraffic:
      recommendationDurabilityPersistence === "durable" ? "stable" : "watch",
    trustConsistencyUnderLoad:
      compareTrustRecoveryTrend === "stable" || compareTrustRecoveryTrend === "recovering"
        ? "consistent"
        : "volatile",
    repeatUserOperationalQuality:
      retention.repeatUserRecommendationTrust === "trusted" ? "healthy" : "watch",
    compareReliabilityUnderUsage:
      behavior.global.compare_started > 0 &&
      behavior.global.compare_completed / behavior.global.compare_started >= 0.4
        ? "reliable"
        : "review",
    trustDurabilityUnderTraffic:
      compareTrustRecoveryTrend !== "volatile" && avgBehavioralTrust >= 55
        ? "durable"
        : "developing",
    distrustRecurrenceUnderScale:
      compareTrustRecoveryTrend === "recovering" ? "low" : "watch",
    fatigueUnderTraffic: recommendationFatiguePersistence,
    operationalFreshnessQuality:
      retention.retentionQualityEvolution !== "declining" ? "fresh" : "adequate",
    trustPersistenceUnderLiveTraffic: trustDurabilityUnderTraffic,
    repeatUserOperationalStability:
      retention.repeatUserRecommendationTrust === "trusted" ? "stable" : "watch",
    compareReliabilityPersistence:
      behavior.global.compare_started > 0 &&
      behavior.global.compare_completed / behavior.global.compare_started >= 0.4
        ? "persistent"
        : "watch",
    authorityFreshnessQuality:
      retention.retentionQualityEvolution !== "declining" ? "fresh" : "adequate",
    recommendationStabilityUnderLoad:
      recommendationDurabilityPersistence === "durable" ? "stable" : "watch",
    publicPlatformHealthPersistence:
      compareTrustRecoveryTrend !== "volatile" ? "persistent" : "watch",
    recommendationTrustPersistence: recommendationDurabilityPersistence,
    compareConfidenceStability: compareConfidenceDurability,
    distrustRecurrencePersistence: distrustRecurrenceTrend,
    fatiguePersistenceUnderTraffic: recommendationFatiguePersistence,
    recommendationQualityUnderLoad:
      recommendationDurabilityPersistence === "durable" ? "strong" : "developing",
    generatedAt: new Date().toISOString(),
  };
}
