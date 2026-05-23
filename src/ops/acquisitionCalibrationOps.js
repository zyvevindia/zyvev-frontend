/**
 * Acquisition calibration — session-level channel quality (no fingerprinting).
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { classifyAcquisitionLabel } from "../utils/acquisitionContext.js";
import { computeRetentionSignals } from "./retentionSignals.js";
import { computeAuthorityDistributionSignals } from "./authorityDistributionOps.js";

const ACQ_WEEKLY_KEY = "evsavari-acquisition-calibration-weekly-v1";

function readWeekly() {
  try {
    const raw = localStorage.getItem(ACQ_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(ACQ_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordAcquisitionCalibrationWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getAcquisitionCalibrationWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function channelFromEvent(e) {
  return (
    e.meta?.acquisitionChannel ||
    classifyAcquisitionLabel(e.meta?.utmSource || e.meta?.referrerHost) ||
    "unknown"
  );
}

function aggregateByChannel(events = []) {
  const channels = {};
  const sessions = {};

  for (const e of events) {
    const ch = channelFromEvent(e);
    if (!channels[ch]) {
      channels[ch] = {
        channel: ch,
        events: 0,
        compareStarted: 0,
        compareCompleted: 0,
        doubted: 0,
        abandonAfterGuidance: 0,
        leadsStarted: 0,
        leadsSubmitted: 0,
        confidenceExpanded: 0,
        depths: [],
        sessionIds: new Set(),
      };
    }
    const row = channels[ch];
    row.events += 1;
    const sid = e.sessionId || e.meta?.sessionId || "default";
    row.sessionIds.add(sid);
    if (!sessions[sid]) sessions[sid] = { channel: ch, completed: false, doubted: false, repeat: false };
    if (sessions[sid].channel === ch && e.type === "compare_completed") {
      sessions[sid].completed = true;
    }
    if (e.type === "recommendation_doubted") sessions[sid].doubted = true;
    if (e.type === "repeated_ev_interest" || e.type === "multi_session_compare") {
      sessions[sid].repeat = true;
    }

    if (e.type === "compare_started") {
      row.compareStarted += 1;
      if (e.meta?.depth) row.depths.push(Number(e.meta.depth));
    }
    if (e.type === "compare_completed") row.compareCompleted += 1;
    if (e.type === "recommendation_doubted") row.doubted += 1;
    if (e.type === "compare_abandon_after_guidance") row.abandonAfterGuidance += 1;
    if (e.type === "lead_started") row.leadsStarted += 1;
    if (e.type === "lead_submitted") row.leadsSubmitted += 1;
    if (e.type === "compare_confidence_expanded") row.confidenceExpanded += 1;
  }

  const repeatByChannel = {};
  for (const s of Object.values(sessions)) {
    if (s.repeat) repeatByChannel[s.channel] = (repeatByChannel[s.channel] || 0) + 1;
  }

  return Object.values(channels).map((row) => {
    const started = row.compareStarted || 0;
    const completed = row.compareCompleted || 0;
    const completionPct =
      started > 0 ? Math.round((completed / started) * 100) : null;
    const doubtRate =
      started > 0 ? Math.round((row.doubted / started) * 100) : null;
    const avgDepth =
      row.depths.length > 0
        ? Math.round(row.depths.reduce((n, d) => n + d, 0) / row.depths.length)
        : null;
    const leadConfidencePct =
      row.leadsStarted > 0
        ? Math.round((row.leadsSubmitted / row.leadsStarted) * 100)
        : null;
    const trustAssistedPct =
      row.confidenceExpanded > 0 && row.leadsSubmitted > 0
        ? Math.round((row.leadsSubmitted / row.confidenceExpanded) * 100)
        : null;

    const trustedSessions = [...row.sessionIds].filter((id) => {
      const s = sessions[id];
      return s?.channel === row.channel && s.completed && !s.doubted;
    }).length;
    const trustedVisitorRatio =
      row.sessionIds.size > 0
        ? Math.round((trustedSessions / row.sessionIds.size) * 100)
        : null;

    const acquisitionQualityScore = Math.round(
      (completionPct ?? 40) * 0.35 +
        (100 - (doubtRate ?? 30)) * 0.25 +
        (avgDepth != null ? Math.min(100, avgDepth * 35) : 45) * 0.2 +
        (leadConfidencePct ?? 40) * 0.2
    );

    return {
      channel: row.channel,
      compareStarted: started,
      compareCompleted: completed,
      completionPct,
      avgCompareDepth: avgDepth,
      doubtRate,
      trustedVisitorRatio,
      acquisitionQualityScore,
      bounceAfterGuidance: row.abandonAfterGuidance,
      leadConfidencePct,
      trustAssistedConversionPct: trustAssistedPct,
      repeatUserQuality: repeatByChannel[row.channel] || 0,
      sessions: row.sessionIds.size,
    };
  });
}

/**
 * @param {object} ctx
 */
export function buildAcquisitionCalibrationReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const byChannel = aggregateByChannel(events);

  const bestAcquisitionSources = [...byChannel]
    .filter((r) => r.compareStarted >= 1)
    .sort((a, b) => b.acquisitionQualityScore - a.acquisitionQualityScore)
    .slice(0, 6);

  const weakAcquisitionSources = [...byChannel]
    .filter((r) => r.compareStarted >= 1)
    .sort((a, b) => a.acquisitionQualityScore - b.acquisitionQualityScore)
    .slice(0, 6);

  const mostTrustedTraffic = [...byChannel]
    .filter((r) => r.trustedVisitorRatio != null)
    .sort((a, b) => (b.trustedVisitorRatio ?? 0) - (a.trustedVisitorRatio ?? 0))
    .slice(0, 6);

  const lowQualityTrafficClusters = weakAcquisitionSources.filter(
    (r) => r.acquisitionQualityScore < 50 || (r.doubtRate ?? 0) >= 40
  );

  const highDepthCompareSessions = [...byChannel]
    .filter((r) => r.avgCompareDepth != null && r.avgCompareDepth >= 2)
    .sort((a, b) => (b.avgCompareDepth ?? 0) - (a.avgCompareDepth ?? 0))
    .slice(0, 6);

  const highestReturnVisitorQuality = [...byChannel]
    .filter((r) => r.repeatUserQuality > 0)
    .sort((a, b) => b.repeatUserQuality - a.repeatUserQuality)
    .slice(0, 6);

  const prevAcq = getAcquisitionCalibrationWeeklySnapshots()[1];
  const avgQuality =
    byChannel.length > 0
      ? Math.round(
          byChannel.reduce((s, r) => s + r.acquisitionQualityScore, 0) /
            byChannel.length
        )
      : null;

  const trustedSourceTrend =
    prevAcq?.avgAcquisitionQuality != null &&
    avgQuality != null &&
    avgQuality > prevAcq.avgAcquisitionQuality + 5
      ? "improving"
      : prevAcq?.avgAcquisitionQuality != null &&
          avgQuality != null &&
          avgQuality < prevAcq.avgAcquisitionQuality - 5
        ? "declining"
        : "stable";

  const unstableTrafficTrend =
    lowQualityTrafficClusters.length >= 3 ? "volatile" : "stable";

  const acquisitionMaturity =
    avgQuality != null && avgQuality >= 65
      ? "mature"
      : avgQuality != null && avgQuality >= 50
        ? "developing"
        : "early";

  const compareStartedNow = events.filter((e) => e.type === "compare_started").length;
  const acquisitionVolatility =
    unstableTrafficTrend === "volatile" ||
    (prevAcq?.channelCount != null &&
      compareStartedNow > (prevAcq.channelCount ?? 0) * 3 &&
      avgQuality != null &&
      avgQuality < 55)
      ? "high"
      : "low";

  const retention = computeRetentionSignals(events);
  const authorityDistribution = computeAuthorityDistributionSignals(events);

  recordAcquisitionCalibrationWeekly({
    avgAcquisitionQuality: avgQuality,
    channelCount: byChannel.length,
    lowQualityCount: lowQualityTrafficClusters.length,
    trustedSessionRatio: retention.trustedSessionRatio,
  });

  return {
    ...retention,
    ...authorityDistribution,
    byChannel,
    acquisitionQualityScore: avgQuality,
    trustedVisitorRatio:
      byChannel.length > 0
        ? Math.round(
            byChannel.reduce(
              (s, r) => s + (r.trustedVisitorRatio ?? 0),
              0
            ) / byChannel.length
          )
        : null,
    compareDepthBySource: highDepthCompareSessions,
    repeatUserQualityBySource: highestReturnVisitorQuality,
    lowTrustAcquisitionClusters: lowQualityTrafficClusters,
    bounceAfterGuidanceBySource: byChannel
      .filter((r) => r.bounceAfterGuidance > 0)
      .map((r) => ({
        channel: r.channel,
        count: r.bounceAfterGuidance,
      })),
    leadConfidenceBySource: byChannel
      .filter((r) => r.leadConfidencePct != null)
      .map((r) => ({
        channel: r.channel,
        leadConfidencePct: r.leadConfidencePct,
      })),
    trustAssistedConversionBySource: byChannel
      .filter((r) => r.trustAssistedConversionPct != null)
      .map((r) => ({
        channel: r.channel,
        pct: r.trustAssistedConversionPct,
      })),
    bestAcquisitionSources,
    weakAcquisitionSources,
    mostTrustedTraffic,
    lowQualityTrafficClusters,
    highDepthCompareSessions,
    highestReturnVisitorQuality,
    trustedSourceTrend,
    unstableTrafficTrend,
    acquisitionMaturity,
    acquisitionVolatility,
    weeklySnapshots: getAcquisitionCalibrationWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "acquisition-calibration",
      version: 1,
      generatedAt: new Date().toISOString(),
      reviewOwner: "growth-ops",
      privacyNote: "Session-level channel labels only — no fingerprinting",
    },
  };
}
