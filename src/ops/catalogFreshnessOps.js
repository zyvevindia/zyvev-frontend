/**
 * Catalog freshness monitoring queue.
 */

import {
  buildFreshnessMetadata,
  daysSince,
  FRESHNESS_STATE,
} from "../intelligence/freshnessMetadata.js";
import { auditVehicleMedia } from "../utils/mediaAudit.js";
import { findStaleHighTrafficFamilies } from "./staleHighTrafficOps.js";

export const FRESHNESS_RISK = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
});

function riskFromState(state, daysSinceVerified) {
  if (
    state === FRESHNESS_STATE.POTENTIALLY_STALE ||
    state === FRESHNESS_STATE.NEEDS_REVIEW
  ) {
    return FRESHNESS_RISK.HIGH;
  }
  if (daysSinceVerified != null && daysSinceVerified > 120) {
    return FRESHNESS_RISK.HIGH;
  }
  if (daysSinceVerified != null && daysSinceVerified > 60) {
    return FRESHNESS_RISK.MEDIUM;
  }
  return FRESHNESS_RISK.LOW;
}

/**
 * @param {object} car
 */
export function auditCatalogFreshnessRow(car = {}) {
  const meta = car?.catalogMeta || {};
  const freshness = buildFreshnessMetadata(car);
  const verifiedDays = daysSince(
    freshness.lastVerifiedAt || meta.lastVerifiedAt
  );
  const priceDays = daysSince(meta.priceLastUpdated);
  const media = auditVehicleMedia(car);

  const flags = [];
  if (freshness.isStale || freshness.state === FRESHNESS_STATE.POTENTIALLY_STALE) {
    flags.push("stale_trust");
  }
  if (!meta.lastVerifiedAt && !freshness.lastVerifiedAt) {
    flags.push("missing_verification");
  }
  if (priceDays != null && priceDays > 90) {
    flags.push("old_pricing");
  }
  if (!car?.specifications?.chargingTime && !car?.evIntelligence?.charging?.hasData) {
    flags.push("outdated_charging");
  }
  if (media.issues?.some((i) => i.code === "placeholder_url")) {
    flags.push("stale_media");
  }
  if (!meta.confidence || meta.confidence === "legacy") {
    flags.push("missing_confidence");
  }

  const risk = riskFromState(freshness.state, verifiedDays);
  const reviewPriority =
    risk === FRESHNESS_RISK.HIGH
      ? 1
      : risk === FRESHNESS_RISK.MEDIUM
        ? 2
        : 3;

  return {
    slug: car?.slug,
    name: car?.name || car?.slug,
    freshnessState: freshness.state,
    freshnessLabel: freshness.stateLabel,
    daysSinceVerified: verifiedDays,
    daysSincePriceUpdate: priceDays,
    flags,
    risk,
    reviewPriority,
    unreviewed: !freshness.reviewed,
  };
}

export function buildCatalogFreshnessReport(ctx = {}) {
  const cars = ctx.cars || [];
  const rows = cars
    .map(auditCatalogFreshnessRow)
    .filter((r) => r.flags.length > 0 || r.risk !== FRESHNESS_RISK.LOW)
    .sort((a, b) => a.reviewPriority - b.reviewPriority);

  const staleHighTraffic = findStaleHighTrafficFamilies(
    ctx.catalogSummary?.vehicles || [],
    ctx.liveOps || {}
  );

  return {
    rows: rows.slice(0, 40),
    staleHighTraffic,
    summary: {
      total: cars.length,
      flagged: rows.length,
      highRisk: rows.filter((r) => r.risk === FRESHNESS_RISK.HIGH).length,
      missingVerification: rows.filter((r) =>
        r.flags.includes("missing_verification")
      ).length,
    },
    generatedAt: new Date().toISOString(),
  };
}
