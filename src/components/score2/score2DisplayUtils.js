import { CONFIDENCE_LEVELS, SCORE_TIERS } from "../../score2/constants.js";

/** @type {Record<string, string>} */
export const SCORE_TIER_LABELS = Object.freeze({
  [SCORE_TIERS.EXCELLENT]: "Excellent",
  [SCORE_TIERS.GOOD]: "Good",
  [SCORE_TIERS.MODERATE]: "Moderate",
  [SCORE_TIERS.LIMITED]: "Limited",
  [SCORE_TIERS.INSUFFICIENT]: "Insufficient",
});

/** @type {Record<string, string>} */
export const CONFIDENCE_LEVEL_LABELS = Object.freeze({
  [CONFIDENCE_LEVELS.VERIFIED]: "Verified",
  [CONFIDENCE_LEVELS.EDITORIAL]: "Editorial",
  [CONFIDENCE_LEVELS.ESTIMATED]: "Estimated",
});

/** @type {Record<string, string>} */
export const PERSONA_FIELD_LABELS = Object.freeze({
  cityBuyer: "City Buyer",
  familyBuyer: "Family Buyer",
  highwayBuyer: "Highway Buyer",
  budgetBuyer: "Budget Buyer",
  premiumBuyer: "Premium Buyer",
});

/** @type {Record<string, string>} */
export const CONFIDENCE_DIMENSION_LABELS = Object.freeze({
  ownership: "Ownership",
  charging: "Charging",
  highway: "Highway",
  family: "Family",
  service: "Service",
  value: "Value",
});

/**
 * @param {string|null|undefined} tier
 * @returns {string}
 */
export function formatScoreTierLabel(tier) {
  if (!tier) return "Unknown";
  return SCORE_TIER_LABELS[tier] || tier;
}

/**
 * @param {string|null|undefined} level
 * @returns {string}
 */
export function formatConfidenceLevelLabel(level) {
  if (!level) return "Unknown";
  return CONFIDENCE_LEVEL_LABELS[level] || level;
}

/**
 * @param {string|null|undefined} slug
 * @returns {string}
 */
export function formatVehicleSlugLabel(slug) {
  if (!slug) return "Vehicle";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
