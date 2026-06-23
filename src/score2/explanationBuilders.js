/**
 * Score 2.0 explanation phrase builders.
 *
 * Derives short editorial phrases from calibrated profiles — no intelligence edits.
 */

import { SCORE_TIERS } from "./constants.js";
import { isTierAtLeast } from "./scoreTierMapping.js";

const MAX_PHRASES = 4;

/**
 * @param {string[]} phrases
 * @returns {string[]}
 */
function dedupePhrases(phrases = []) {
  const seen = new Set();
  const result = [];

  for (const phrase of phrases) {
    const cleaned = String(phrase || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string[]}
 */
export function buildStrengths(profile, intelligenceCar) {
  const { score, recommendation } = profile;
  const phrases = [];

  if (isTierAtLeast(score.ownership, SCORE_TIERS.GOOD)) {
    phrases.push("Low running costs");
  }

  if (isTierAtLeast(score.highway, SCORE_TIERS.GOOD)) {
    phrases.push("Strong highway capability");
  }

  if (isTierAtLeast(score.family, SCORE_TIERS.GOOD)) {
    phrases.push("Good family practicality");
  }

  if (isTierAtLeast(score.service, SCORE_TIERS.GOOD)) {
    phrases.push("Broad service support");
  }

  if (isTierAtLeast(score.value, SCORE_TIERS.GOOD)) {
    phrases.push("Strong purchase value");
  }

  if (isTierAtLeast(score.charging, SCORE_TIERS.GOOD)) {
    phrases.push("Practical charging experience");
  }

  if (isTierAtLeast(recommendation.cityBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Strong city usability");
  }

  if (isTierAtLeast(recommendation.budgetBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Excellent ownership economics");
  }

  if (isTierAtLeast(recommendation.premiumBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Premium comfort and refinement");
  }

  if (
    isTierAtLeast(score.highway, SCORE_TIERS.GOOD) &&
    isTierAtLeast(score.family, SCORE_TIERS.GOOD) &&
    phrases.length < 2
  ) {
    phrases.push("Versatile everyday usability");
  }

  void intelligenceCar;
  return dedupePhrases(phrases).slice(0, MAX_PHRASES);
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string[]}
 */
export function buildWeaknesses(profile, intelligenceCar) {
  const { score, recommendation } = profile;
  const phrases = [];

  if (
    score.charging === SCORE_TIERS.INSUFFICIENT ||
    score.charging === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Charging infrastructure dependency");
  }

  if (
    score.highway === SCORE_TIERS.INSUFFICIENT ||
    score.highway === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Limited long-distance usability");
  }

  if (
    recommendation.highwayBuyer === SCORE_TIERS.INSUFFICIENT ||
    recommendation.highwayBuyer === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Highway travel needs careful planning");
  }

  if (
    score.value === SCORE_TIERS.LIMITED ||
    score.value === SCORE_TIERS.INSUFFICIENT ||
    recommendation.budgetBuyer === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Premium purchase price");
  }

  if (
    score.family === SCORE_TIERS.LIMITED ||
    score.family === SCORE_TIERS.INSUFFICIENT
  ) {
    phrases.push("Limited family space");
  }

  if (
    recommendation.familyBuyer === SCORE_TIERS.LIMITED ||
    recommendation.familyBuyer === SCORE_TIERS.INSUFFICIENT
  ) {
    phrases.push("Not ideal for larger families");
  }

  if (
    recommendation.premiumBuyer === SCORE_TIERS.INSUFFICIENT ||
    recommendation.premiumBuyer === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Limited premium appeal");
  }

  void intelligenceCar;
  return dedupePhrases(phrases).slice(0, 3);
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string[]}
 */
export function buildBestFor(profile, intelligenceCar) {
  const { score, recommendation } = profile;
  const phrases = [];

  if (isTierAtLeast(recommendation.familyBuyer, SCORE_TIERS.GOOD)) {
    phrases.push("Families");
  }

  if (
    isTierAtLeast(recommendation.highwayBuyer, SCORE_TIERS.GOOD) &&
    isTierAtLeast(recommendation.cityBuyer, SCORE_TIERS.MODERATE)
  ) {
    phrases.push("Mixed city and highway usage");
  }

  if (isTierAtLeast(recommendation.cityBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Urban commuters");
  } else if (isTierAtLeast(recommendation.cityBuyer, SCORE_TIERS.GOOD)) {
    phrases.push("Daily city drivers");
  }

  if (isTierAtLeast(recommendation.budgetBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Budget-conscious buyers");
  }

  if (isTierAtLeast(recommendation.highwayBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Regular highway travel");
  }

  if (isTierAtLeast(recommendation.premiumBuyer, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Premium buyers");
  }

  if (
    isTierAtLeast(score.overall, SCORE_TIERS.GOOD) &&
    phrases.length === 0
  ) {
    phrases.push("Everyday Indian EV ownership");
  }

  void intelligenceCar;
  return dedupePhrases(phrases).slice(0, MAX_PHRASES);
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string[]}
 */
export function buildAvoidIf(profile, intelligenceCar) {
  const { recommendation } = profile;
  const phrases = [];

  if (
    recommendation.budgetBuyer === SCORE_TIERS.LIMITED ||
    recommendation.budgetBuyer === SCORE_TIERS.INSUFFICIENT
  ) {
    phrases.push("Buyers seeking ultra-low purchase prices");
  }

  if (
    recommendation.highwayBuyer === SCORE_TIERS.INSUFFICIENT ||
    recommendation.highwayBuyer === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Frequent inter-city travel");
  }

  if (
    recommendation.familyBuyer === SCORE_TIERS.LIMITED ||
    recommendation.familyBuyer === SCORE_TIERS.INSUFFICIENT
  ) {
    phrases.push("Large families needing maximum space");
  }

  if (
    recommendation.cityBuyer === SCORE_TIERS.LIMITED ||
    recommendation.cityBuyer === SCORE_TIERS.INSUFFICIENT
  ) {
    phrases.push("Primarily urban commuting");
  }

  if (
    recommendation.premiumBuyer === SCORE_TIERS.INSUFFICIENT ||
    recommendation.premiumBuyer === SCORE_TIERS.LIMITED
  ) {
    phrases.push("Buyers expecting luxury positioning");
  }

  void intelligenceCar;
  return dedupePhrases(phrases).slice(0, 3);
}

/**
 * Short headline phrases summarising the profile.
 *
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string[]}
 */
export function buildSummary(profile, intelligenceCar) {
  const { score } = profile;
  const phrases = [];

  if (isTierAtLeast(score.overall, SCORE_TIERS.EXCELLENT)) {
    phrases.push("Standout all-round EV choice");
  } else if (isTierAtLeast(score.overall, SCORE_TIERS.GOOD)) {
    phrases.push("Strong mainstream EV choice");
  } else if (score.overall === SCORE_TIERS.MODERATE) {
    phrases.push("Focused urban EV choice");
  }

  phrases.push(...buildStrengths(profile, intelligenceCar).slice(0, 2));

  return dedupePhrases(phrases).slice(0, 3);
}
