/**
 * Normalized buyer recommendation profile for one archetype ↔ vehicle pairing.
 */

import { FIT_TIERS } from "./fitConstants.js";

/**
 * @typedef {import("./fitConstants.js").FitConfidence} FitConfidence
 * @typedef {import("./fitConstants.js").FitTier} FitTier
 * @typedef {import("./buildRecommendationNarrative.js").RecommendationNarrative} RecommendationNarrative
 * @typedef {import("./buildArchetypeFit.js").ArchetypeFitResult} ArchetypeFitResult
 *
 * @typedef {{
 *   archetypeId: string,
 *   fitTier: FitTier,
 *   headline: string,
 *   summary: string,
 *   whyItFits: string[],
 *   considerations: string[],
 *   confidence: FitConfidence,
 * }} BuyerRecommendationProfile
 */

/**
 * @param {{
 *   archetype: import("./types.js").BuyerArchetype|null|undefined,
 *   fitResult: ArchetypeFitResult|null|undefined,
 *   recommendationNarrative: RecommendationNarrative|null|undefined,
 *   scoreProfile?: import("../score2/types.js").VehicleScoreProfile|null,
 *   intelligenceCar?: object|null,
 * }} input
 * @returns {BuyerRecommendationProfile|null}
 */
export function buildBuyerRecommendationProfile({
  archetype,
  fitResult,
  recommendationNarrative,
  scoreProfile = null,
  intelligenceCar = null,
}) {
  if (!archetype?.id || !fitResult || !recommendationNarrative) {
    return null;
  }

  void scoreProfile;
  void intelligenceCar;

  return {
    archetypeId: archetype.id,
    fitTier: fitResult.fitTier,
    headline: recommendationNarrative.headline,
    summary: recommendationNarrative.summary,
    whyItFits: [...recommendationNarrative.whyItFits],
    considerations: [...recommendationNarrative.considerations],
    confidence: fitResult.confidence,
  };
}

export { FIT_TIERS };
