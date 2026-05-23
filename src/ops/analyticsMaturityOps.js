/**
 * Analytics maturity — device split, funnel proxies, compare exits (buffer + traffic).
 */

import {
  listUsageLearningEvents,
  summarizeUsageLearningBuffer,
} from "./usageLearningBuffer.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";
import { getPostLaunchMetrics, summarizePostLaunchMetrics } from "./postLaunchMetrics.js";

function detectDeviceFromMeta(meta = {}) {
  if (meta.device) return String(meta.device);
  if (meta.mobile === true || meta.isMobile === true) return "mobile";
  if (meta.mobile === false) return "desktop";
  return "unknown";
}

function inferDeviceFromUa() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
}

export function getClientDeviceClass() {
  return inferDeviceFromUa();
}

/**
 * Summarize buffered events with mobile/desktop approximation.
 */
export function summarizeBehavioralBuffer(events = listUsageLearningEvents()) {
  const byType = {};
  const byDevice = { mobile: 0, desktop: 0, unknown: 0 };
  const scrollBuckets = { shallow: 0, mid: 0, deep: 0 };

  for (const e of events) {
    const t = e.type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
    const device =
      detectDeviceFromMeta(e.meta) === "unknown"
        ? inferDeviceFromUa()
        : detectDeviceFromMeta(e.meta);
    byDevice[device] = (byDevice[device] || 0) + 1;

    if (e.type === "scroll_depth") {
      const pct = Number(e.meta?.percent ?? 0);
      if (pct < 35) scrollBuckets.shallow += 1;
      else if (pct < 70) scrollBuckets.mid += 1;
      else scrollBuckets.deep += 1;
    }
  }

  const total = events.length || 1;
  return {
    byType,
    byDevice,
    mobileSharePct: Math.round((byDevice.mobile / total) * 100),
    desktopSharePct: Math.round((byDevice.desktop / total) * 100),
    scrollDepthApproximation: scrollBuckets,
    funnelCounts: {
      compare_started: byType.compare_started || 0,
      compare_completed: byType.compare_completed || 0,
      compare_abandoned: byType.compare_abandoned || 0,
      lead_started: byType.lead_started || 0,
      lead_submitted: byType.lead_submitted || 0,
      trust_tooltip_opened: byType.trust_tooltip_opened || 0,
    },
  };
}

export function buildAnalyticsMaturityReport(ctx = {}) {
  const traffic = ctx.traffic || {};
  const events = listUsageLearningEvents();
  const buffer = summarizeBehavioralBuffer(events);
  const usageSummary = summarizeUsageLearningBuffer(events);
  const metrics = summarizePostLaunchMetrics(getPostLaunchMetrics());

  const started = Number(traffic.compareConversions?.started ?? 0);
  const completed = Number(traffic.compareConversions?.total ?? 0);
  const serverCompareCompletion =
    traffic.compareConversions?.completionRate ??
    (started > 0 ? Math.round((completed / started) * 100) : null);

  const bufferCompareCompletion =
    buffer.funnelCounts.compare_started > 0
      ? Math.round(
          (buffer.funnelCounts.compare_completed /
            buffer.funnelCounts.compare_started) *
            100
        )
      : null;

  const compareExitPages = rankCompareDropOffHotspots(
    traffic.compareTrends
  ).slice(0, 8);

  const highBounceCompare = (traffic.compareTrends || [])
    .filter((t) => {
      const rate = Number(t.completionRate);
      return !Number.isNaN(rate) && rate < 30 && Number(t.started) >= 4;
    })
    .slice(0, 8);

  const sessions = new Set(events.map((e) => e.sessionId).filter(Boolean));
  const compareBySession = {};
  const evInterest = {};
  for (const e of events) {
    const sid = e.sessionId || "unknown";
    if (e.type === "compare_started" || e.type === "compare_completed") {
      compareBySession[sid] = (compareBySession[sid] || 0) + 1;
    }
    if (e.type === "ev_viewed" || e.meta?.familySlug) {
      const fam = e.meta?.familySlug || e.meta?.slug || "";
      if (fam) evInterest[fam] = (evInterest[fam] || 0) + 1;
    }
  }
  const multiSessionCompare = Object.values(compareBySession).filter(
    (n) => n >= 2
  ).length;
  const repeatEvInterest = Object.entries(evInterest)
    .filter(([, n]) => n >= 2)
    .map(([family, views]) => ({ family, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const mobileFrictionJourneys = events.filter(
    (e) =>
      e.meta?.device === "mobile" &&
      (e.type === "compare_abandoned" || e.type === "lead_form_abandoned")
  ).length;

  const highConfidenceConversions = events.filter(
    (e) =>
      e.type === "lead_submitted" &&
      (e.meta?.formType === "callback" || e.meta?.formType === "test_drive")
  ).length;

  const ga4ReadyEvents = [
    "compare_started",
    "compare_completed",
    "compare_abandoned",
    "lead_started",
    "lead_submitted",
    "trust_tooltip_opened",
    "ev_viewed",
  ];

  const configured = Boolean(
    import.meta.env.VITE_GA_ID || import.meta.env.VITE_POSTHOG_KEY
  );

  const maturityScore = Math.max(
    0,
    Math.min(
      100,
      (configured ? 25 : 5) +
        (serverCompareCompletion != null ? 20 : 5) +
        (buffer.total > 20 ? 20 : buffer.total) +
        (metrics.routeSlowCount < 5 ? 15 : 5) +
        (compareExitPages.length > 0 ? 10 : 0)
    )
  );

  const behavioralCalibration = {
    multiSessionCompareCount: multiSessionCompare,
    repeatEvInterest,
    mobileFrictionJourneys,
    highConfidenceConversions,
    uniqueSessions: sessions.size,
    note: "Long-term calibration layer — buffer + traffic-ops merge in future sprints.",
  };

  return {
    maturityScore,
    behavioralCalibration,
    ga4ReadyEvents,
    analyticsConfigured: configured,
    mobileDesktopSplit: {
      fromBuffer: buffer.byDevice,
      mobileSharePct: buffer.mobileSharePct,
      desktopSharePct: buffer.desktopSharePct,
      note: "Server-side GA4 device split requires admin traffic-ops; buffer uses client UA + event meta.",
    },
    compareCompletionRate: serverCompareCompletion ?? bufferCompareCompletion,
    scrollDepthApproximation: buffer.scrollDepthApproximation,
    leadFunnel: {
      started: buffer.funnelCounts.lead_started,
      submitted: buffer.funnelCounts.lead_submitted,
      serverLeads: traffic.leadConversions?.total ?? null,
    },
    compareExitPages,
    highBounceCompare,
    usageBuffer: usageSummary,
    postLaunchMetrics: metrics,
    generatedAt: new Date().toISOString(),
  };
}
