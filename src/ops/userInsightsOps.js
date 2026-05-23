/**
 * Real user observability — deterministic traffic heuristics.
 */

import {
  rankCompareDropOffHotspots,
  rankLowConvertingHighTrafficLandings,
} from "./trafficObservationOps.js";
import { rankWeakEngagementByTrafficClass } from "./seoTractionOps.js";

export function buildUserInsightsReport(traffic = {}, liveOps = {}) {
  const compareTrends = traffic.compareTrends || [];
  const abandon = rankCompareDropOffHotspots(compareTrends);
  const lowConvert = rankLowConvertingHighTrafficLandings(
    traffic.topLandingPages,
    traffic.topConvertingPages
  );
  const weakEngagement = rankWeakEngagementByTrafficClass(
    traffic.topLandingPages,
    traffic.topConvertingPages
  );

  const editorialHints = [];

  for (const row of abandon.slice(0, 5)) {
    editorialHints.push({
      key: `abandon-${row.slug}`,
      path: `/compare/${row.slug}`,
      hint: `High compare abandonment (${row.completionRate}% completion) — review editorial + trust on this pair.`,
      severity: "high",
    });
  }

  for (const row of lowConvert.slice(0, 5)) {
    editorialHints.push({
      key: `low-convert-${row.label}`,
      path: row.label,
      hint: "High traffic with weak lead match — strengthen CTA and trust copy.",
      severity: "medium",
    });
  }

  const topComparePairs = (traffic.topComparePages || []).slice(0, 10).map((r) => ({
    slug: r.label,
    views: r.count,
  }));

  const topViewedEvs = (traffic.topViewedEvs || liveOps?.topViewed || []).slice(0, 10);

  const leadFunnel = {
    compareStarted: traffic.compareConversions?.started ?? 0,
    compareCompleted: traffic.compareConversions?.total ?? 0,
    completionRate: traffic.compareConversions?.completionRate ?? null,
    leadsTotal: traffic.leadConversions?.total ?? 0,
  };

  return {
    topComparePairs,
    topCompareJourneys: compareTrends.slice(0, 10),
    topViewedEvs,
    compareAbandonment: abandon,
    highExitCompare: abandon,
    lowConvertHighTraffic: lowConvert,
    weakEngagementPages: weakEngagement.slice(0, 10),
    leadFunnel,
    editorialHints: editorialHints.slice(0, 12),
    mobileNote:
      "Device split requires GA4/behavioral backend — use Traffic intelligence when behavioral flag is on.",
  };
}
