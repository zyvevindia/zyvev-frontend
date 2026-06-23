/**
 * Archetype-level comparison — which vehicle suits each buyer context.
 *
 * Tie is acceptable. No rankings or numeric scores.
 */

import { tierRank } from "../score2/scoreTierMapping.js";
import { ARCHETYPE_COMPARISON_DEFS } from "./constants.js";
import { resolveVehicleName } from "./resolveVehicleName.js";

/** @typedef {import("./types.js").ArchetypeComparisonOutcome} ArchetypeComparisonOutcome */

/**
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} scoreProfile
 * @param {{ kind: "score"|"persona", key: string }|undefined} emphasis
 * @returns {import("../score2/constants.js").ScoreTier|null}
 */
function readEmphasisTier(scoreProfile, emphasis) {
  if (!scoreProfile || !emphasis) return null;

  if (emphasis.kind === "score") {
    return scoreProfile.score[emphasis.key] || null;
  }

  return scoreProfile.recommendation[emphasis.key] || null;
}

/**
 * @param {{
 *   primarySlug: string,
 *   secondarySlug: string,
 *   primaryScoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   secondaryScoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   primaryProfiles: import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap|null|undefined,
 *   secondaryProfiles: import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap|null|undefined,
 *   primaryIntelligenceCar?: object|null,
 *   secondaryIntelligenceCar?: object|null,
 * }} input
 * @returns {ArchetypeComparisonOutcome[]}
 */
export function buildArchetypeComparison({
  primarySlug,
  secondarySlug,
  primaryScoreProfile,
  secondaryScoreProfile,
  primaryProfiles,
  secondaryProfiles,
  primaryIntelligenceCar = null,
  secondaryIntelligenceCar = null,
}) {
  const primaryName = resolveVehicleName(
    primarySlug,
    primaryScoreProfile,
    primaryIntelligenceCar
  );
  const secondaryName = resolveVehicleName(
    secondarySlug,
    secondaryScoreProfile,
    secondaryIntelligenceCar
  );

  return ARCHETYPE_COMPARISON_DEFS.map((definition) => {
    const primaryProfile = primaryProfiles?.[definition.profileKey] || null;
    const secondaryProfile = secondaryProfiles?.[definition.profileKey] || null;

    const primaryEmphasis = readEmphasisTier(
      primaryScoreProfile,
      definition.emphasis
    );
    const secondaryEmphasis = readEmphasisTier(
      secondaryScoreProfile,
      definition.emphasis
    );

    const emphasisDiff =
      primaryEmphasis && secondaryEmphasis
        ? tierRank(primaryEmphasis) - tierRank(secondaryEmphasis)
        : 0;

    const fitDiff =
      primaryProfile && secondaryProfile
        ? tierRank(primaryProfile.fitTier) - tierRank(secondaryProfile.fitTier)
        : 0;

    const combinedDiff =
      definition.emphasis && emphasisDiff !== 0
        ? emphasisDiff
        : fitDiff !== 0
          ? fitDiff
          : emphasisDiff;

    if (combinedDiff === 0) {
      return {
        archetypeId: definition.archetypeId,
        title: definition.title,
        preferredVehicle: "tie",
        rationale: buildTieRationale(
          definition.title,
          primaryName,
          secondaryName,
          primaryProfile,
          secondaryProfile
        ),
      };
    }

    const preferredIsPrimary = combinedDiff > 0;
    const preferredName = preferredIsPrimary ? primaryName : secondaryName;
    const preferredProfile = preferredIsPrimary
      ? primaryProfile
      : secondaryProfile;

    return {
      archetypeId: definition.archetypeId,
      title: definition.title,
      preferredVehicle: preferredName,
      rationale: buildPreferredRationale(
        definition.title,
        preferredName,
        preferredProfile
      ),
    };
  });
}

/**
 * @param {string} title
 * @param {string} primaryName
 * @param {string} secondaryName
 * @param {import("../recommendations/buildBuyerRecommendationProfile.js").BuyerRecommendationProfile|null} primaryProfile
 * @param {import("../recommendations/buildBuyerRecommendationProfile.js").BuyerRecommendationProfile|null} secondaryProfile
 * @returns {string}
 */
function buildTieRationale(
  title,
  primaryName,
  secondaryName,
  primaryProfile,
  secondaryProfile
) {
  if (primaryProfile?.headline && secondaryProfile?.headline) {
    return `${primaryName} and ${secondaryName} both offer workable fit for ${title.toLowerCase()} buyers.`;
  }

  return `Neither vehicle clearly outpaces the other for ${title.toLowerCase()} priorities.`;
}

/**
 * @param {string} title
 * @param {string} preferredName
 * @param {import("../recommendations/buildBuyerRecommendationProfile.js").BuyerRecommendationProfile|null} preferredProfile
 * @returns {string}
 */
function buildPreferredRationale(title, preferredName, preferredProfile) {
  const reason = preferredProfile?.whyItFits?.[0];
  if (reason) {
    return `${preferredName} aligns better for ${title.toLowerCase()} buyers because ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`;
  }

  const headline = preferredProfile?.headline;
  if (headline) {
    return `${preferredName} is the stronger match for ${title.toLowerCase()} buyers — ${headline.charAt(0).toLowerCase()}${headline.slice(1)}`;
  }

  return `${preferredName} shows stronger alignment with ${title.toLowerCase()} priorities.`;
}
