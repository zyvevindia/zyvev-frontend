/**
 * @typedef {'verified' | 'partial' | 'estimated'} ScoreExplanationConfidence
 */

/**
 * @typedef {Object} ScoreExplanationContext
 * @property {number|null} cityScore
 * @property {number|null} valueScore
 * @property {number|null} chargingScore
 * @property {number|null} highwayScore
 * @property {number|null} rangeScore
 * @property {number|null} safetyScore
 * @property {number|null} performanceScore
 * @property {number|null} batteryKwh
 * @property {boolean} hasScoreData
 */

/**
 * @typedef {Object} ScoreExplanationRule
 * @property {string} id
 * @property {(ctx: ScoreExplanationContext) => boolean} when
 * @property {string} label
 * @property {number} [priority]
 * @property {string} [group] Rules in the same group are mutually exclusive (highest priority wins)
 */

/**
 * @typedef {Object} ScoreExplanationResult
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {ScoreExplanationConfidence} confidence
 */

export const SCORE_EXPLANATION_CONFIDENCE = Object.freeze({
  VERIFIED: "verified",
  PARTIAL: "partial",
  ESTIMATED: "estimated",
});

export const SCORE_EXPLANATION_LIMITS = Object.freeze({
  maxStrengths: 3,
  maxWeaknesses: 2,
});
