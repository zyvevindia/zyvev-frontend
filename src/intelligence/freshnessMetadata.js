import {
  FRESHNESS_THRESHOLDS,
  VERIFICATION_STATUS,
} from "./constants.js";
import { isPresent } from "./governance.js";
import { extractCurationMetadata } from "./curationMetadata.js";

/**
 * Freshness states for catalog intelligence transparency.
 */
export const FRESHNESS_STATE = Object.freeze({
  FRESH: "fresh",
  RECENTLY_VERIFIED: "recently_verified",
  NEEDS_REVIEW: "needs_review",
  POTENTIALLY_STALE: "potentially_stale",
});

export const FRESHNESS_STATE_LABELS = Object.freeze({
  [FRESHNESS_STATE.FRESH]: "Fresh",
  [FRESHNESS_STATE.RECENTLY_VERIFIED]: "Recently verified",
  [FRESHNESS_STATE.NEEDS_REVIEW]: "Needs review",
  [FRESHNESS_STATE.POTENTIALLY_STALE]: "Potentially stale",
});

export function parseIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysSince(value) {
  const d = parseIsoDate(value);
  if (!d) return null;
  const ms = Date.now() - d.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Raw freshness fields from catalogMeta + curation.
 */
export function extractFreshnessSources(car) {
  const meta = car?.catalogMeta || {};
  const curation = extractCurationMetadata(car);
  const block =
    meta.intelligenceFreshness ||
    meta.intelligenceGovernance?.freshness ||
    {};

  return {
    lastReviewedAt:
      block.lastReviewedAt ||
      curation.reviewedAt ||
      meta.lastReviewedAt ||
      null,
    lastVerifiedAt:
      block.lastVerifiedAt ||
      meta.lastVerifiedAt ||
      curation.reviewedAt ||
      null,
    catalogUpdatedAt:
      block.catalogUpdatedAt ||
      meta.catalogUpdatedAt ||
      meta.lastUpdatedAt ||
      meta.priceLastUpdated ||
      null,
    verificationStatus:
      block.verificationStatus ||
      curation.verificationStatus ||
      (curation.reviewed
        ? VERIFICATION_STATUS.VERIFIED
        : VERIFICATION_STATUS.UNREVIEWED),
    staleFlags: Array.isArray(block.staleFlags) ? block.staleFlags : [],
    reviewed: curation.reviewed,
    reviewPriority: curation.reviewPriority,
  };
}

/**
 * Classify freshness state from timestamps (deterministic).
 */
export function classifyFreshnessState(sources) {
  const daysVerified = daysSince(sources.lastVerifiedAt);
  const daysReviewed = daysSince(sources.lastReviewedAt);
  const daysCatalog = daysSince(sources.catalogUpdatedAt);

  if (sources.staleFlags?.includes("force_stale")) {
    return FRESHNESS_STATE.POTENTIALLY_STALE;
  }

  if (
    sources.reviewed &&
    daysVerified != null &&
    daysVerified <= FRESHNESS_THRESHOLDS.freshDays
  ) {
    return FRESHNESS_STATE.FRESH;
  }

  if (
    sources.reviewed &&
    daysVerified != null &&
    daysVerified <= FRESHNESS_THRESHOLDS.recentlyVerifiedDays
  ) {
    return FRESHNESS_STATE.RECENTLY_VERIFIED;
  }

  if (
    !sources.reviewed &&
    daysCatalog != null &&
    daysCatalog >= FRESHNESS_THRESHOLDS.needsReviewDays
  ) {
    return FRESHNESS_STATE.NEEDS_REVIEW;
  }

  if (
    daysReviewed != null &&
    daysReviewed >= FRESHNESS_THRESHOLDS.potentiallyStaleDays
  ) {
    return FRESHNESS_STATE.POTENTIALLY_STALE;
  }

  if (
    daysVerified != null &&
    daysVerified >= FRESHNESS_THRESHOLDS.potentiallyStaleDays
  ) {
    return FRESHNESS_STATE.POTENTIALLY_STALE;
  }

  if (!sources.reviewed) {
    return FRESHNESS_STATE.NEEDS_REVIEW;
  }

  return FRESHNESS_STATE.RECENTLY_VERIFIED;
}

/**
 * @param {object} car
 */
export function buildFreshnessMetadata(car) {
  const sources = extractFreshnessSources(car);
  const state = classifyFreshnessState(sources);
  const daysVerified = daysSince(sources.lastVerifiedAt);
  const daysReviewed = daysSince(sources.lastReviewedAt);
  const daysCatalog = daysSince(sources.catalogUpdatedAt);

  const isStale =
    state === FRESHNESS_STATE.POTENTIALLY_STALE ||
    state === FRESHNESS_STATE.NEEDS_REVIEW;

  return {
    ...sources,
    state,
    stateLabel: FRESHNESS_STATE_LABELS[state] || "Unknown",
    daysSinceVerified: daysVerified,
    daysSinceReviewed: daysReviewed,
    daysSinceCatalogUpdate: daysCatalog,
    isStale,
    showStaleIndicator: isStale,
    hasTimestamps:
      isPresent(sources.lastVerifiedAt) ||
      isPresent(sources.lastReviewedAt) ||
      isPresent(sources.catalogUpdatedAt),
  };
}

export function formatFreshnessLabel(freshness) {
  if (!freshness) return null;
  return freshness.stateLabel || FRESHNESS_STATE_LABELS[freshness.state];
}
