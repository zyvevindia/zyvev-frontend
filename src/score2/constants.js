/**
 * EVSavari Score 2.0 — shared constants and allowed value sets.
 *
 * Scores guide decisions; they are not ratings.
 * No stars, percentages, 10-point scales, rankings, or comparison logic here.
 */

/** @typedef {typeof SCORE_TIERS[keyof typeof SCORE_TIERS]} ScoreTier */
export const SCORE_TIERS = Object.freeze({
  EXCELLENT: "excellent",
  GOOD: "good",
  MODERATE: "moderate",
  LIMITED: "limited",
  INSUFFICIENT: "insufficient",
});

/** @typedef {typeof RECOMMENDATION_FIT[keyof typeof RECOMMENDATION_FIT]} RecommendationFit */
export const RECOMMENDATION_FIT = Object.freeze({
  STRONG_FIT: "strong-fit",
  GOOD_FIT: "good-fit",
  CONDITIONAL: "conditional",
  POOR_FIT: "poor-fit",
  UNKNOWN: "unknown",
});

/** @typedef {typeof CONFIDENCE_LEVELS[keyof typeof CONFIDENCE_LEVELS]} ConfidenceLevel */
export const CONFIDENCE_LEVELS = Object.freeze({
  VERIFIED: "verified",
  EDITORIAL: "editorial",
  ESTIMATED: "estimated",
});

/** Score dimension keys on {@link import("./types.js").EvSavariScore}. */
export const SCORE_DIMENSIONS = Object.freeze([
  "overall",
  "ownership",
  "charging",
  "highway",
  "family",
  "service",
  "value",
]);

/** Persona keys on {@link import("./types.js").RecommendationProfile}. */
export const RECOMMENDATION_PERSONAS = Object.freeze([
  "cityBuyer",
  "familyBuyer",
  "highwayBuyer",
  "budgetBuyer",
  "premiumBuyer",
]);

/** Confidence dimension keys on {@link import("./types.js").ConfidenceProfile}. */
export const CONFIDENCE_DIMENSIONS = Object.freeze([...SCORE_DIMENSIONS]);

/** Explanation list field keys on {@link import("./types.js").ScoreExplanation}. */
export const EXPLANATION_LIST_FIELDS = Object.freeze([
  "strengths",
  "weaknesses",
  "bestFor",
  "avoidIf",
]);

export const SCORE2_MODULE_VERSION = "2.0.0-alpha";

export const SCORE2_REGISTRY_STATUS = Object.freeze({
  /** Profiles materialize on first registry lookup. */
  LAZY: "lazy",
});
