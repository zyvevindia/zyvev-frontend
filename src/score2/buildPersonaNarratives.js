/**
 * Persona-fit narrative lines for Score 2.0 recommendation tiers.
 */

import { SCORE_TIERS } from "./constants.js";

/** @type {Record<import("./constants.js").ScoreTier, string>} */
const CITY_NARRATIVES = Object.freeze({
  [SCORE_TIERS.EXCELLENT]:
    "Particularly well suited for dense urban usage.",
  [SCORE_TIERS.GOOD]:
    "Well suited to regular city commuting and local errands.",
  [SCORE_TIERS.MODERATE]:
    "Capable for city use, though not its only strength.",
  [SCORE_TIERS.LIMITED]:
    "City use is possible, but buyers should weigh the trade-offs.",
  [SCORE_TIERS.INSUFFICIENT]:
    "Dense urban commuting is not a natural fit.",
});

/** @type {Record<import("./constants.js").ScoreTier, string>} */
const FAMILY_NARRATIVES = Object.freeze({
  [SCORE_TIERS.EXCELLENT]:
    "Family practicality is one of this vehicle's strongest appeals.",
  [SCORE_TIERS.GOOD]:
    "Offers sensible space and usability for small to mid-size families.",
  [SCORE_TIERS.MODERATE]:
    "Family use is workable, though space may feel tight for some buyers.",
  [SCORE_TIERS.LIMITED]:
    "Best suited to singles, couples, or very small families.",
  [SCORE_TIERS.INSUFFICIENT]:
    "Family buyers will likely find better alternatives elsewhere.",
});

/** @type {Record<import("./constants.js").ScoreTier, string>} */
const HIGHWAY_NARRATIVES = Object.freeze({
  [SCORE_TIERS.EXCELLENT]:
    "Confident choice for regular inter-city and highway travel.",
  [SCORE_TIERS.GOOD]:
    "Highway usability is a clear strength for mixed-use buyers.",
  [SCORE_TIERS.MODERATE]:
    "Occasional highway trips are feasible with sensible planning.",
  [SCORE_TIERS.LIMITED]:
    "Frequent inter-city travel may require careful charging planning.",
  [SCORE_TIERS.INSUFFICIENT]:
    "Long-distance highway use is not recommended as a primary use case.",
});

/** @type {Record<import("./constants.js").ScoreTier, string>} */
const BUDGET_NARRATIVES = Object.freeze({
  [SCORE_TIERS.EXCELLENT]:
    "Running costs and purchase economics are especially attractive.",
  [SCORE_TIERS.GOOD]:
    "Offers sensible value for buyers watching ownership costs.",
  [SCORE_TIERS.MODERATE]:
    "Value is acceptable, though not the primary reason to choose it.",
  [SCORE_TIERS.LIMITED]:
    "Purchase and ownership costs may feel steep for budget-focused buyers.",
  [SCORE_TIERS.INSUFFICIENT]:
    "Not a natural fit for buyers prioritising the lowest outlay.",
});

/** @type {Record<import("./constants.js").ScoreTier, string>} */
const PREMIUM_NARRATIVES = Object.freeze({
  [SCORE_TIERS.EXCELLENT]:
    "Premium positioning and refinement are among this vehicle's strengths.",
  [SCORE_TIERS.GOOD]:
    "Delivers a noticeably upmarket ownership experience.",
  [SCORE_TIERS.MODERATE]:
    "Premium appeal exists, but it is not the headline story.",
  [SCORE_TIERS.LIMITED]:
    "Buyers seeking luxury cues may want to look at more premium options.",
  [SCORE_TIERS.INSUFFICIENT]:
    "Premium positioning is not a meaningful part of its appeal.",
});

/**
 * @param {import("./constants.js").ScoreTier} tier
 * @param {Record<import("./constants.js").ScoreTier, string>} narratives
 * @returns {string}
 */
function narrativeForTier(tier, narratives) {
  return narratives[tier] || narratives[SCORE_TIERS.MODERATE];
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @returns {{
 *   cityBuyer: string,
 *   familyBuyer: string,
 *   highwayBuyer: string,
 *   budgetBuyer: string,
 *   premiumBuyer: string,
 * }}
 */
export function buildPersonaNarratives(profile) {
  const { recommendation } = profile;

  return {
    cityBuyer: narrativeForTier(recommendation.cityBuyer, CITY_NARRATIVES),
    familyBuyer: narrativeForTier(recommendation.familyBuyer, FAMILY_NARRATIVES),
    highwayBuyer: narrativeForTier(
      recommendation.highwayBuyer,
      HIGHWAY_NARRATIVES
    ),
    budgetBuyer: narrativeForTier(recommendation.budgetBuyer, BUDGET_NARRATIVES),
    premiumBuyer: narrativeForTier(
      recommendation.premiumBuyer,
      PREMIUM_NARRATIVES
    ),
  };
}
