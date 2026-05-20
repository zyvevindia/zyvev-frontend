import { RANGE_ESTIMATE_METHODS, REVIEW_PRIORITY, VERIFICATION_STATUS } from "./constants.js";
import { isPresent, UNAVAILABLE } from "./governance.js";
import { DATA_ORIGIN } from "./trustMetadata.js";

/**
 * Lightweight manual curation / override support (no CMS).
 * Expected on catalogMeta.intelligenceCuration from backend or static enrich.
 *
 * @example
 * intelligenceCuration: {
 *   reviewed: true,
 *   reviewedAt: "2026-01-15",
 *   reviewedBy: "ops@evsavari.com",
 *   reviewPriority: "high",
 *   verificationStatus: "verified",
 *   escalation: false,
 *   reviewNotes: ["Re-check DC speed after OEM bulletin"],
 *   editorialNotes: ["Real-world range verified internally"],
 *   overrides: {
 *     realWorldRangeKm: { min: 310, max: 370 },
 *     rangeConfidenceSource: "curated_review",
 *   }
 * }
 */

export function extractCurationMetadata(car) {
  const meta = car?.catalogMeta || {};
  const block =
    meta.intelligenceCuration ||
    meta.intelligenceGovernance?.curation ||
    {};

  const priority = block.reviewPriority || REVIEW_PRIORITY.NORMAL;
  const validPriority = Object.values(REVIEW_PRIORITY).includes(priority)
    ? priority
    : REVIEW_PRIORITY.NORMAL;

  let verificationStatus =
    block.verificationStatus ||
    (block.reviewed
      ? VERIFICATION_STATUS.VERIFIED
      : VERIFICATION_STATUS.UNREVIEWED);
  if (!Object.values(VERIFICATION_STATUS).includes(verificationStatus)) {
    verificationStatus = block.reviewed
      ? VERIFICATION_STATUS.VERIFIED
      : VERIFICATION_STATUS.UNREVIEWED;
  }

  return {
    reviewed: Boolean(block.reviewed),
    reviewedAt: block.reviewedAt || null,
    reviewedBy: block.reviewedBy || block.reviewer || null,
    reviewerRole: block.reviewerRole || null,
    reviewPriority: validPriority,
    verificationStatus,
    escalation: Boolean(block.escalation || block.escalated),
    reviewNotes: Array.isArray(block.reviewNotes)
      ? block.reviewNotes
      : [],
    editorialNotes: Array.isArray(block.editorialNotes)
      ? block.editorialNotes
      : [],
    notes: Array.isArray(block.notes) ? block.notes : [],
    overrides: block.overrides || {},
    manualTrustOverrides: block.manualTrustOverrides || {},
  };
}

/**
 * Apply curated overrides to range intelligence (non-destructive).
 */
export function applyCurationToRange(rangeIntel, curation) {
  if (!rangeIntel || !curation?.overrides) return rangeIntel;

  const o = curation.overrides;
  const next = { ...rangeIntel };

  if (o.realWorldRangeKm?.min != null && o.realWorldRangeKm?.max != null) {
    next.estimatedRealWorldKm = {
      min: Number(o.realWorldRangeKm.min),
      max: Number(o.realWorldRangeKm.max),
    };
    next.mixedUsageRangeKm = { ...next.estimatedRealWorldKm };
    next.estimateMethod = RANGE_ESTIMATE_METHODS.CURATED_OVERRIDE;
    next.rangeConfidenceSource = DATA_ORIGIN.CURATED;
    next.confidenceLevel = "high";
    next.explanation =
      o.rangeExplanation ||
      "Range band updated from EVSavari editorial review.";
  }

  if (isPresent(o.claimedRangeKm)) {
    next.claimedRangeKm = Number(o.claimedRangeKm);
  }

  if (Array.isArray(o.seasonalNotes)) {
    next.seasonalNotes = o.seasonalNotes;
  }

  return next;
}

export function applyCurationToChargingPracticality(practicality, curation) {
  if (!practicality || !curation?.overrides?.chargingNotes) {
    return practicality;
  }
  return {
    ...practicality,
    curatedNotes: curation.overrides.chargingNotes,
  };
}

export function mergeCurationNotes(intel, curation) {
  if (!curation?.editorialNotes?.length) return intel;
  return {
    ...intel,
    curationNotes: curation.editorialNotes,
  };
}

/**
 * Whether vehicle needs human review attention (ops queue).
 */
export function needsHumanReview(curation, freshness) {
  if (!curation) return false;
  if (curation.escalation) return true;
  if (curation.reviewPriority === REVIEW_PRIORITY.URGENT) return true;
  if (
    curation.verificationStatus === VERIFICATION_STATUS.NEEDS_REVERIFY
  ) {
    return true;
  }
  if (!curation.reviewed && freshness?.isStale) return true;
  return false;
}
