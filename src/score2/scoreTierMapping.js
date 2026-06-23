import { SCORE_TIERS } from "./constants.js";

/** @type {ReadonlyArray<{ min: number, tier: import("./constants.js").ScoreTier }>} */
export const SCORE_TIER_THRESHOLDS = Object.freeze([
  { min: 80, tier: SCORE_TIERS.EXCELLENT },
  { min: 65, tier: SCORE_TIERS.GOOD },
  { min: 50, tier: SCORE_TIERS.MODERATE },
  { min: 35, tier: SCORE_TIERS.LIMITED },
  { min: 0, tier: SCORE_TIERS.INSUFFICIENT },
]);

/**
 * @param {number|null|undefined} score
 * @returns {import("./constants.js").ScoreTier}
 */
export function numericScoreToTier(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return SCORE_TIERS.INSUFFICIENT;
  }

  const value = Number(score);
  for (const threshold of SCORE_TIER_THRESHOLDS) {
    if (value >= threshold.min) {
      return threshold.tier;
    }
  }

  return SCORE_TIERS.INSUFFICIENT;
}

/**
 * @param {Array<number|null|undefined>} scores
 * @returns {import("./constants.js").ScoreTier}
 */
export function averageScoreToTier(scores = []) {
  const valid = scores
    .filter((score) => score != null && Number.isFinite(Number(score)))
    .map((score) => Number(score));

  if (!valid.length) {
    return SCORE_TIERS.INSUFFICIENT;
  }

  const average = valid.reduce((sum, score) => sum + score, 0) / valid.length;
  return numericScoreToTier(average);
}

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {number} [steps=1]
 * @returns {import("./constants.js").ScoreTier}
 */
export function bumpScoreTier(tier, steps = 1) {
  const order = [
    SCORE_TIERS.INSUFFICIENT,
    SCORE_TIERS.LIMITED,
    SCORE_TIERS.MODERATE,
    SCORE_TIERS.GOOD,
    SCORE_TIERS.EXCELLENT,
  ];
  const index = order.indexOf(tier);
  if (index < 0) return SCORE_TIERS.INSUFFICIENT;
  return order[Math.min(order.length - 1, index + steps)];
}

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {number} [steps=1]
 * @returns {import("./constants.js").ScoreTier}
 */
export function lowerScoreTier(tier, steps = 1) {
  const order = [
    SCORE_TIERS.INSUFFICIENT,
    SCORE_TIERS.LIMITED,
    SCORE_TIERS.MODERATE,
    SCORE_TIERS.GOOD,
    SCORE_TIERS.EXCELLENT,
  ];
  const index = order.indexOf(tier);
  if (index < 0) return SCORE_TIERS.INSUFFICIENT;
  return order[Math.max(0, index - steps)];
}

/** @type {ReadonlyArray<import("./constants.js").ScoreTier>} */
const TIER_ORDER = Object.freeze([
  SCORE_TIERS.INSUFFICIENT,
  SCORE_TIERS.LIMITED,
  SCORE_TIERS.MODERATE,
  SCORE_TIERS.GOOD,
  SCORE_TIERS.EXCELLENT,
]);

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @returns {number}
 */
export function tierRank(tier) {
  const index = TIER_ORDER.indexOf(tier);
  return index < 0 ? 0 : index;
}

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {import("./constants.js").ScoreTier} floor
 * @returns {boolean}
 */
export function isTierAtLeast(tier, floor) {
  return tierRank(tier) >= tierRank(floor);
}

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {import("./constants.js").ScoreTier} ceiling
 * @returns {boolean}
 */
export function isTierAtMost(tier, ceiling) {
  return tierRank(tier) <= tierRank(ceiling);
}

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {import("./constants.js").ScoreTier} floor
 * @returns {import("./constants.js").ScoreTier}
 */
export function tierAtLeast(tier, floor) {
  return isTierAtLeast(tier, floor) ? tier : floor;
}

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {import("./constants.js").ScoreTier} ceiling
 * @returns {import("./constants.js").ScoreTier}
 */
export function tierAtMost(tier, ceiling) {
  return isTierAtMost(tier, ceiling) ? tier : ceiling;
}

/**
 * @param {import("./constants.js").ScoreTier} a
 * @param {import("./constants.js").ScoreTier} b
 * @returns {import("./constants.js").ScoreTier}
 */
export function maxTier(a, b) {
  return tierRank(a) >= tierRank(b) ? a : b;
}
