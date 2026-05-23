/**
 * Catalog freshness automation — priority queue without AI agents.
 */

import { buildCatalogFreshnessReport } from "./catalogFreshnessOps.js";
import { findStaleHighTrafficFamilies } from "./staleHighTrafficOps.js";
import { daysSince } from "../intelligence/freshnessMetadata.js";

export const REVIEW_URGENCY = Object.freeze({
  IMMEDIATE: "immediate",
  THIS_WEEK: "this_week",
  SCHEDULED: "scheduled",
});

function urgencyFromRow(row) {
  if (row.risk === "high" && row.flags.includes("stale_trust")) {
    return REVIEW_URGENCY.IMMEDIATE;
  }
  if (row.risk === "high" || row.daysSinceVerified > 120) {
    return REVIEW_URGENCY.THIS_WEEK;
  }
  return REVIEW_URGENCY.SCHEDULED;
}

function freshnessConfidence(row) {
  if (row.daysSinceVerified != null && row.daysSinceVerified <= 30) {
    return "high";
  }
  if (row.daysSinceVerified != null && row.daysSinceVerified <= 90) {
    return "medium";
  }
  return "low";
}

/**
 * Automated alerts from catalog audit.
 */
export function buildFreshnessAutomationReport(ctx = {}) {
  const base = buildCatalogFreshnessReport(ctx);
  const staleHighTraffic = findStaleHighTrafficFamilies(
    ctx.catalogSummary?.vehicles || [],
    ctx.liveOps || {}
  );

  const alerts = {
    stalePrice: [],
    missingVerification: [],
    outdatedCharging: [],
    staleMedia: [],
  };

  const queue = base.rows.map((row) => {
    if (row.flags.includes("old_pricing")) alerts.stalePrice.push(row.slug);
    if (row.flags.includes("missing_verification")) {
      alerts.missingVerification.push(row.slug);
    }
    if (row.flags.includes("outdated_charging")) {
      alerts.outdatedCharging.push(row.slug);
    }
    if (row.flags.includes("stale_media")) alerts.staleMedia.push(row.slug);

    const reviewUrgency = urgencyFromRow(row);
    const escalated = staleHighTraffic.some((s) => s.slug === row.slug);

    return {
      ...row,
      reviewUrgency,
      freshnessConfidence: freshnessConfidence(row),
      lastVerifiedAgeDays: row.daysSinceVerified,
      escalated,
      automated: true,
    };
  });

  queue.sort((a, b) => {
    const order = {
      [REVIEW_URGENCY.IMMEDIATE]: 0,
      [REVIEW_URGENCY.THIS_WEEK]: 1,
      [REVIEW_URGENCY.SCHEDULED]: 2,
    };
    if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
    return (order[a.reviewUrgency] ?? 9) - (order[b.reviewUrgency] ?? 9);
  });

  return {
    queue: queue.slice(0, 50),
    alerts: {
      stalePriceCount: alerts.stalePrice.length,
      missingVerificationCount: alerts.missingVerification.length,
      outdatedChargingCount: alerts.outdatedCharging.length,
      staleMediaCount: alerts.staleMedia.length,
    },
    staleHighTraffic,
    summary: base.summary,
    generatedAt: new Date().toISOString(),
  };
}
