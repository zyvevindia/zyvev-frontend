import { CONFIDENCE_LEVELS, FRESHNESS_THRESHOLDS } from "./constants.js";
import { FRESHNESS_STATE } from "./freshnessMetadata.js";

/**
 * Deterministic freshness score (0–100) — category only, not fake precision.
 */
export function computeFreshnessScore(freshness) {
  if (!freshness) return { score: null, category: "unknown" };

  let score = 72;

  if (freshness.reviewed) score += 12;
  if (freshness.state === FRESHNESS_STATE.FRESH) score += 16;
  else if (freshness.state === FRESHNESS_STATE.RECENTLY_VERIFIED) score += 8;
  else if (freshness.state === FRESHNESS_STATE.NEEDS_REVIEW) score -= 18;
  else if (freshness.state === FRESHNESS_STATE.POTENTIALLY_STALE) score -= 28;

  const dv = freshness.daysSinceVerified;
  if (dv != null) {
    if (dv <= FRESHNESS_THRESHOLDS.freshDays) score += 6;
    else if (dv > FRESHNESS_THRESHOLDS.potentiallyStaleDays) score -= 20;
    else if (dv > FRESHNESS_THRESHOLDS.recentlyVerifiedDays) score -= 10;
  } else if (!freshness.reviewed) {
    score -= 8;
  }

  const stalePenalty = (freshness.staleFlags?.length || 0) * 5;
  score -= stalePenalty;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let category = "moderate";
  if (score >= 85) category = "high";
  else if (score >= 65) category = "good";
  else if (score >= 45) category = "moderate";
  else category = "low";

  return { score, category };
}

const CONFIDENCE_RANK = {
  [CONFIDENCE_LEVELS.HIGH]: 3,
  [CONFIDENCE_LEVELS.MEDIUM]: 2,
  [CONFIDENCE_LEVELS.ESTIMATED]: 1,
};

const RANK_TO_LEVEL = {
  3: CONFIDENCE_LEVELS.HIGH,
  2: CONFIDENCE_LEVELS.MEDIUM,
  1: CONFIDENCE_LEVELS.ESTIMATED,
};

/**
 * Adjust base confidence using freshness (never upgrades unreviewed to high alone).
 */
export function adjustConfidenceForFreshness(baseLevel, freshness) {
  if (!freshness) return baseLevel;

  let rank = CONFIDENCE_RANK[baseLevel] ?? 1;

  if (freshness.state === FRESHNESS_STATE.FRESH && freshness.reviewed) {
    rank = Math.min(3, rank + 1);
  } else if (freshness.state === FRESHNESS_STATE.POTENTIALLY_STALE) {
    rank = Math.max(1, rank - 1);
  } else if (
    freshness.state === FRESHNESS_STATE.NEEDS_REVIEW &&
    !freshness.reviewed
  ) {
    rank = Math.max(1, rank - 1);
  }

  return RANK_TO_LEVEL[rank] || CONFIDENCE_LEVELS.ESTIMATED;
}

/**
 * Human-readable freshness impact on trust.
 */
export function buildFreshnessConfidenceExplanation(freshness, freshnessScore) {
  if (!freshness) {
    return "Freshness unknown — treat estimates as planning guidance only.";
  }

  const parts = [];

  if (freshness.reviewed && freshness.state === FRESHNESS_STATE.FRESH) {
    parts.push("Recently verified catalog data supports stronger confidence.");
  } else if (freshness.state === FRESHNESS_STATE.RECENTLY_VERIFIED) {
    parts.push("Data verified within the last few months.");
  } else if (freshness.state === FRESHNESS_STATE.NEEDS_REVIEW) {
    parts.push(
      "This model has not been editorially reviewed recently — confirm key specs with the dealer."
    );
  } else if (freshness.state === FRESHNESS_STATE.POTENTIALLY_STALE) {
    parts.push(
      "Catalog data may be outdated — we recommend re-checking price, range, and charging before you decide."
    );
  }

  if (freshnessScore?.category === "low") {
    parts.push("Freshness score is low due to age or missing verification.");
  }

  return parts.join(" ") || "Freshness assessed from review dates and catalog updates.";
}
