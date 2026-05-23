/**
 * Retention signals — shared session buffer metrics (no circular imports).
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";

const RETENTION_WEEKLY_KEY = "evsavari-retention-authority-weekly-v1";

function readRetentionWeekly() {
  try {
    const raw = localStorage.getItem(RETENTION_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRetentionWeekly(arr) {
  try {
    localStorage.setItem(RETENTION_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordRetentionAuthorityWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readRetentionWeekly().filter((s) => s.week !== week);
  writeRetentionWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getRetentionAuthorityWeeklySnapshots() {
  return readRetentionWeekly().slice(0, 8);
}

function pairFromPath(path = "") {
  const m = String(path).match(/\/compare\/([^?#/]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function isGuidePath(path = "") {
  const p = String(path).toLowerCase();
  return ["/guides/", "/charging-guides/", "/discover/", "/ownership/"].some((x) =>
    p.startsWith(x)
  );
}

/**
 * @param {object[]} [events]
 */
export function computeRetentionSignals(events = listUsageLearningEvents()) {
  const sessions = {};
  for (const e of events) {
    const sid = e.sessionId || e.meta?.sessionId || "default";
    if (!sessions[sid]) {
      sessions[sid] = {
        compareStarted: 0,
        compareCompleted: 0,
        doubted: false,
        repeat: false,
        confidenceExpanded: false,
        leadSubmitted: false,
        pairs: new Set(),
        guideViews: 0,
      };
    }
    const s = sessions[sid];
    if (e.type === "compare_started") {
      s.compareStarted += 1;
      const p = pairFromPath(e.meta?.sourcePage || "");
      if (p) s.pairs.add(p);
    }
    if (e.type === "compare_completed") s.compareCompleted += 1;
    if (e.type === "recommendation_doubted") s.doubted = true;
    if (
      e.type === "repeated_ev_interest" ||
      e.type === "multi_session_compare"
    ) {
      s.repeat = true;
    }
    if (e.type === "compare_confidence_expanded") s.confidenceExpanded = true;
    if (e.type === "lead_submitted") s.leadSubmitted = true;
    if (
      e.type === "ownership_guide_opened" ||
      e.type === "charging_guide_opened" ||
      e.type === "charging_practicality_viewed"
    ) {
      s.guideViews += 1;
    }
  }

  const sessionList = Object.values(sessions);
  const repeatSessions = sessionList.filter((s) => s.repeat || s.compareStarted >= 2);
  const trustedSessions = sessionList.filter(
    (s) => s.compareCompleted > 0 && !s.doubted
  );
  const weakRetention = sessionList.filter(
    (s) => s.compareStarted >= 1 && s.compareCompleted === 0 && s.doubted
  );

  const totalStarted = events.filter((e) => e.type === "compare_started").length;
  const totalCompleted = events.filter((e) => e.type === "compare_completed").length;
  const repeatCompareCount = repeatSessions.length;

  const trustedSessionRatio =
    sessionList.length > 0
      ? Math.round((trustedSessions.length / sessionList.length) * 100)
      : null;

  const compareCompletionRetention =
    totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : null;

  const repeatCompareRetention =
    sessionList.length > 0
      ? Math.round((repeatCompareCount / sessionList.length) * 100)
      : null;

  const repeatCompareConfidence =
    repeatSessions.filter((s) => s.confidenceExpanded).length >= 1
      ? repeatSessions.filter((s) => s.confidenceExpanded).length >=
        Math.max(1, repeatSessions.length * 0.4)
        ? "strong"
        : "developing"
      : "early";

  const returnUserConversionQuality =
    repeatSessions.filter((s) => s.leadSubmitted).length >= 1
      ? "engaged"
      : repeatSessions.length >= 2
        ? "researching"
        : "early";

  const returnUserTrustTrend =
    trustedSessionRatio != null && trustedSessionRatio >= 55 && repeatCompareRetention >= 25
      ? "improving"
      : trustedSessionRatio != null && trustedSessionRatio < 40
        ? "watch"
        : "stable";

  const recommendationReturnEngagement = events.filter(
    (e) =>
      e.type === "repeated_ev_interest" ||
      (e.type === "compare_started" && e.meta?.returnVisitor)
  ).length;

  const byPair = {};
  for (const e of events) {
    const p = pairFromPath(e.meta?.sourcePage || "");
    if (!p) continue;
    if (!byPair[p]) byPair[p] = { started: 0, completed: 0 };
    if (e.type === "compare_started") byPair[p].started += 1;
    if (e.type === "compare_completed") byPair[p].completed += 1;
  }
  const highReturnComparePairs = Object.entries(byPair)
    .filter(([, row]) => row.started >= 2)
    .map(([pairSlug, row]) => ({
      pairSlug,
      started: row.started,
      completed: row.completed,
      revisitQuality: row.completed >= row.started * 0.5 ? "strong" : "weak",
    }))
    .sort((a, b) => b.started - a.started)
    .slice(0, 8);

  const compareRevisitQuality =
    highReturnComparePairs.filter((p) => p.revisitQuality === "strong").length >=
    Math.max(1, highReturnComparePairs.length * 0.5)
      ? "healthy"
      : highReturnComparePairs.length > 0
        ? "mixed"
        : "early";

  const weakRetentionJourneys = weakRetention.slice(0, 8).map((s, i) => ({
    id: `weak-${i}`,
    compareStarted: s.compareStarted,
    doubted: s.doubted,
  }));

  const trustedRepeatVisitors = repeatSessions.filter(
    (s) => !s.doubted && s.compareCompleted > 0
  ).length;

  const guidePathCounts = {};
  for (const e of events) {
    const page = e.meta?.sourcePage || "";
    if (isGuidePath(page)) {
      guidePathCounts[page] = (guidePathCounts[page] || 0) + 1;
    }
  }
  const repeatGuideUsefulness =
    Object.values(guidePathCounts).filter((c) => c >= 2).length >= 2
      ? "strong"
      : Object.values(guidePathCounts).some((c) => c >= 2)
        ? "developing"
        : "early";

  const depths = events
    .filter((e) => e.type === "compare_started" && e.meta?.depth)
    .map((e) => Number(e.meta.depth));
  const compareRevisitDepth =
    depths.length > 0
      ? Math.round(depths.reduce((n, d) => n + d, 0) / depths.length)
      : null;

  const ownershipGuideRevisitQuality =
    events.filter((e) => e.type === "ownership_guide_opened").length >= 2
      ? "trusted"
      : events.some((e) => e.type === "ownership_guide_opened")
        ? "building"
        : "early";

  const prev = getRetentionAuthorityWeeklySnapshots()[1];
  const retentionQualityEvolution =
    prev?.trustedSessionRatio != null &&
    trustedSessionRatio != null &&
    trustedSessionRatio > prev.trustedSessionRatio + 4
      ? "improving"
      : prev?.trustedSessionRatio != null &&
          trustedSessionRatio != null &&
          trustedSessionRatio < prev.trustedSessionRatio - 4
        ? "declining"
        : "stable";

  const retentionConfidenceTrend =
    trustedSessionRatio != null && trustedSessionRatio >= 55
      ? "confident"
      : trustedSessionRatio != null && trustedSessionRatio >= 40
        ? "building"
        : "early";

  const repeatCompareDurability =
    compareRevisitQuality === "healthy" && repeatCompareConfidence !== "early"
      ? "durable"
      : "developing";

  const trustedReturnUserPersistence =
    trustedRepeatVisitors >= 2 && returnUserTrustTrend !== "watch"
      ? "persistent"
      : trustedRepeatVisitors >= 1
        ? "emerging"
        : "early";

  const recommendationRevisitDurability =
    recommendationReturnEngagement >= 2 && compareRevisitQuality === "healthy"
      ? "durable"
      : "developing";

  const trustedReturnUserQuality =
    trustedReturnUserPersistence === "persistent" ? "healthy" : trustedReturnUserPersistence;

  const mostDurableCompareJourneys = highReturnComparePairs.filter(
    (p) => p.revisitQuality === "strong"
  );

  const highestRepeatUseRecommendations = highReturnComparePairs
    .filter((p) => p.started >= 2)
    .slice(0, 6);

  const mostRevisitedOwnershipGuides = Object.entries(guidePathCounts)
    .filter(([path]) => path.includes("ownership") || path.includes("guide"))
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const trustedReturnUserSummary = {
    trustedVisitors: trustedRepeatVisitors,
    trustedSessionRatio,
    persistence: trustedReturnUserPersistence,
  };

  const repeatUserRecommendationTrust =
    recommendationReturnEngagement >= 2 && repeatCompareConfidence !== "early"
      ? "trusted"
      : recommendationReturnEngagement >= 1
        ? "building"
        : "early";

  const revisitConfidenceQuality = repeatCompareConfidence;
  const trustedReturnUserDurability = trustedReturnUserPersistence;
  const compareRevisitPersistence =
    compareRevisitQuality === "healthy" ? "persistent" : compareRevisitQuality;
  const ownershipGuideRevisitDurability = ownershipGuideRevisitQuality;
  const recommendationHabitFormation =
    repeatCompareRetention != null && repeatCompareRetention >= 25
      ? "forming"
      : repeatCompareRetention != null && repeatCompareRetention >= 15
        ? "emerging"
        : "early";

  const retentionConfidenceEvolution = retentionQualityEvolution;

  const usersReturningBecauseRecommendationsHelp =
    recommendationReturnEngagement >= 2 && returnUserTrustTrend !== "watch";

  const mostRevisitedCompareJourneys = highReturnComparePairs;
  const strongRecommendationRevisitTrust =
    recommendationRevisitDurability === "durable" ? "strong" : "developing";
  const weakRepeatUseFlows = weakRetentionJourneys;
  const mostDurableOwnershipGuidance = mostRevisitedOwnershipGuides;

  recordRetentionAuthorityWeekly({
    trustedSessionRatio,
    repeatCompareRetention,
    retentionConfidenceTrend,
    recommendationHabitFormation,
  });

  return {
    returnUserTrustTrend,
    repeatCompareRetention,
    repeatCompareConfidence,
    returnUserConversionQuality,
    trustedSessionRatio,
    compareCompletionRetention,
    recommendationReturnEngagement,
    compareRevisitQuality,
    returnUserTrustHealth:
      returnUserTrustTrend === "improving" ? "healthy" : returnUserTrustTrend,
    repeatCompareQuality: repeatCompareConfidence,
    trustedRepeatVisitors,
    weakRetentionJourneys,
    recommendationRevisitQuality: compareRevisitQuality,
    highReturnComparePairs,
    retentionQualitySnapshot: {
      trustedSessionRatio,
      compareCompletionRetention,
      repeatCompareRetention,
      repeatSessions: repeatCompareCount,
    },
    recommendationRetentionSummary: {
      returnEngagement: recommendationReturnEngagement,
      revisitQuality: compareRevisitQuality,
      highReturnPairs: highReturnComparePairs.length,
    },
    returnUserTrustEvolution: returnUserTrustTrend,
    retentionQualityHealthy:
      trustedSessionRatio != null && trustedSessionRatio >= 50,
    retentionConfidenceTrend,
    repeatCompareDurability,
    repeatGuideUsefulness,
    trustedReturnUserPersistence,
    compareRevisitDepth,
    ownershipGuideRevisitQuality,
    recommendationRevisitDurability,
    retentionQualityEvolution,
    trustedReturnUserQuality,
    mostDurableCompareJourneys,
    highestRepeatUseRecommendations,
    mostRevisitedOwnershipGuides,
    trustedReturnUserSummary,
    weeklyRetentionSnapshots: getRetentionAuthorityWeeklySnapshots(),
    repeatUserRecommendationTrust,
    revisitConfidenceQuality,
    trustedReturnUserDurability,
    compareRevisitPersistence,
    ownershipGuideRevisitDurability,
    recommendationHabitFormation,
    retentionConfidenceEvolution,
    usersReturningBecauseRecommendationsHelp,
    mostRevisitedCompareJourneys,
    strongRecommendationRevisitTrust,
    weakRepeatUseFlows,
    mostDurableOwnershipGuidance,
  };
}
