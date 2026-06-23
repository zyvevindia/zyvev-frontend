/**
 * Multi-sentence editorial summaries for Score 2.0 profiles.
 */

import { isMicroEv } from "./calibrationRules.js";
import { SCORE_TIERS } from "./constants.js";
import { isTierAtLeast } from "./scoreTierMapping.js";

/**
 * @param {object|null|undefined} intelligenceCar
 * @returns {string}
 */
function resolveVehicleLabel(intelligenceCar) {
  return (
    intelligenceCar?.displayName ||
    intelligenceCar?.name ||
    intelligenceCar?.familyName ||
    intelligenceCar?.familySlug ||
    "This EV"
  );
}

/**
 * @param {string} label
 * @returns {string}
 */
function resolveShortVehicleLabel(label) {
  return String(label || "This EV")
    .replace(/^Tata\s+/i, "")
    .replace(/^MG\s+/i, "")
    .replace(/^Mahindra\s+/i, "")
    .replace(/^BYD\s+/i, "BYD ")
    .trim();
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string}
 */
export function buildNarrativeSummary(profile, intelligenceCar) {
  const label = resolveVehicleLabel(intelligenceCar);
  const shortLabel = resolveShortVehicleLabel(label);
  const { score, recommendation } = profile;

  if (isMicroEv(intelligenceCar)) {
    return `Designed primarily for city commuting, the ${shortLabel} offers excellent running costs and easy ownership. Its compact dimensions and affordability make it attractive for urban buyers, although long-distance usability remains limited.`;
  }

  if (
    isTierAtLeast(recommendation.premiumBuyer, SCORE_TIERS.EXCELLENT) &&
    isTierAtLeast(score.highway, SCORE_TIERS.GOOD)
  ) {
    return `The ${shortLabel} delivers premium comfort, strong range, and confident long-distance capability. Buyers prioritizing luxury and performance may find it especially appealing.`;
  }

  if (
    isTierAtLeast(score.highway, SCORE_TIERS.GOOD) &&
    isTierAtLeast(score.family, SCORE_TIERS.GOOD) &&
    isTierAtLeast(score.overall, SCORE_TIERS.GOOD)
  ) {
    return `The ${shortLabel} balances everyday practicality with strong highway capability. Low operating costs and broad service support make it one of the most versatile mainstream EV choices.`;
  }

  if (isTierAtLeast(recommendation.cityBuyer, SCORE_TIERS.EXCELLENT)) {
    return `Built with urban buyers in mind, the ${shortLabel} combines low running costs with easy everyday usability. It suits city-focused ownership well, though long-distance buyers should weigh range and charging carefully.`;
  }

  if (isTierAtLeast(score.overall, SCORE_TIERS.GOOD)) {
    return `${shortLabel} offers balanced EV ownership with clear strengths for everyday Indian use. Buyers should match its strongest dimensions to their daily driving pattern.`;
  }

  if (score.overall === SCORE_TIERS.MODERATE) {
    return `${shortLabel} suits focused use cases more than all-round ownership. Urban buyers who accept its trade-offs may still find it a practical and economical choice.`;
  }

  return `${shortLabel} works best for buyers with specific needs that align with its strengths. Consider daily usage, budget, and charging access before shortlisting.`;
}
