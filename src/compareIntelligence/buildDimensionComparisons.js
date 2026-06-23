/**
 * Buyer-centric dimension comparison engine.
 *
 * Compares qualitative score and persona tiers — no numeric scores or overall winners.
 */

import { SCORE_TIERS } from "../score2/constants.js";
import { tierRank } from "../score2/scoreTierMapping.js";
import {
  COMPARISON_DIMENSIONS,
  DIMENSION_ADVANTAGE_LABELS,
  DIMENSION_OUTCOMES,
} from "./constants.js";
import { resolveVehicleName } from "./resolveVehicleName.js";

/** @typedef {import("./types.js").DimensionComparison} DimensionComparison */
/** @typedef {import("./types.js").DimensionComparisonResult} DimensionComparisonResult */

const STRONG_TIER_FLOOR = tierRank(SCORE_TIERS.GOOD);

/**
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} scoreProfile
 * @param {import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap|null|undefined} recommendationProfiles
 * @param {import("./constants.js").ComparisonDimensionDef} dimension
 * @returns {import("../score2/constants.js").ScoreTier}
 */
function readDimensionTier(scoreProfile, recommendationProfiles, dimension) {
  if (!scoreProfile) {
    return SCORE_TIERS.INSUFFICIENT;
  }

  if (dimension.key === "family" && dimension.archetypeKey) {
    const fitTier = recommendationProfiles?.[dimension.archetypeKey]?.fitTier;
    if (fitTier) return fitTier;
  }

  if (dimension.kind === "score" && dimension.scoreKey) {
    return scoreProfile.score[dimension.scoreKey] || SCORE_TIERS.INSUFFICIENT;
  }

  if (dimension.kind === "persona" && dimension.personaKey) {
    return (
      scoreProfile.recommendation[dimension.personaKey] ||
      SCORE_TIERS.INSUFFICIENT
    );
  }

  if (dimension.archetypeKey && recommendationProfiles?.[dimension.archetypeKey]) {
    return (
      recommendationProfiles[dimension.archetypeKey]?.fitTier ||
      SCORE_TIERS.INSUFFICIENT
    );
  }

  return SCORE_TIERS.INSUFFICIENT;
}

/**
 * @param {import("../score2/constants.js").ScoreTier} primaryTier
 * @param {import("../score2/constants.js").ScoreTier} secondaryTier
 * @returns {number}
 */
function compareTiers(primaryTier, secondaryTier) {
  return tierRank(primaryTier) - tierRank(secondaryTier);
}

/**
 * @param {import("../score2/constants.js").ScoreTier} tier
 * @returns {boolean}
 */
function isWeakTier(tier) {
  return tierRank(tier) <= tierRank(SCORE_TIERS.LIMITED);
}

/**
 * @param {{
 *   primarySlug: string,
 *   secondarySlug: string,
 *   primaryName: string,
 *   secondaryName: string,
 *   primaryTier: import("../score2/constants.js").ScoreTier,
 *   secondaryTier: import("../score2/constants.js").ScoreTier,
 *   dimension: import("./constants.js").ComparisonDimensionDef,
 * }} input
 * @returns {DimensionComparison}
 */
function buildDimensionComparison({
  primarySlug,
  secondarySlug,
  primaryName,
  secondaryName,
  primaryTier,
  secondaryTier,
  dimension,
}) {
  const diff = compareTiers(primaryTier, secondaryTier);

  if (diff === 0) {
    if (isWeakTier(primaryTier) && isWeakTier(secondaryTier)) {
      return {
        key: dimension.key,
        label: dimension.label,
        outcome: DIMENSION_OUTCOMES.TRADE_OFF,
        advantagedVehicleSlug: null,
        advantagedVehicleName: null,
        statement: `Both ${primaryName} and ${secondaryName} face trade-offs on ${dimension.label.toLowerCase()}.`,
      };
    }

    return {
      key: dimension.key,
      label: dimension.label,
      outcome: DIMENSION_OUTCOMES.TIE,
      advantagedVehicleSlug: null,
      advantagedVehicleName: null,
      statement: `${primaryName} and ${secondaryName} are closely matched on ${dimension.label.toLowerCase()}.`,
    };
  }

  const primaryAdvantage = diff > 0;
  const advantagedSlug = primaryAdvantage ? primarySlug : secondarySlug;
  const advantagedName = primaryAdvantage ? primaryName : secondaryName;

  return {
    key: dimension.key,
    label: dimension.label,
    outcome: DIMENSION_OUTCOMES.ADVANTAGE,
    advantagedVehicleSlug: advantagedSlug,
    advantagedVehicleName: advantagedName,
    statement: `${advantagedName} offers ${dimension.advantagePhrase}.`,
  };
}

/**
 * @param {DimensionComparison[]} dimensions
 * @param {string} primaryName
 * @param {string} secondaryName
 * @returns {string}
 */
function buildDimensionSummary(dimensions, primaryName, secondaryName) {
  const advantages = dimensions.filter(
    (dimension) => dimension.outcome === DIMENSION_OUTCOMES.ADVANTAGE
  );

  if (!advantages.length) {
    const ties = dimensions.filter(
      (dimension) => dimension.outcome === DIMENSION_OUTCOMES.TIE
    );
    if (ties.length === dimensions.length) {
      return `${primaryName} and ${secondaryName} are broadly matched across everyday buyer priorities.`;
    }

    return `${primaryName} and ${secondaryName} show mixed trade-offs rather than a single clear pattern.`;
  }

  const primaryAdvantages = advantages.filter(
    (dimension) => dimension.advantagedVehicleName === primaryName
  );
  const secondaryAdvantages = advantages.filter(
    (dimension) => dimension.advantagedVehicleName === secondaryName
  );

  const phrases = [];

  if (secondaryAdvantages.length) {
    const labels = secondaryAdvantages
      .slice(0, 2)
      .map((dimension) => DIMENSION_ADVANTAGE_LABELS[dimension.key]);
    phrases.push(
      `${secondaryName} offers ${formatPhraseList(labels)}`
    );
  }

  if (primaryAdvantages.length) {
    const labels = primaryAdvantages
      .slice(0, 2)
      .map((dimension) => DIMENSION_ADVANTAGE_LABELS[dimension.key]);
    phrases.push(
      `${primaryName} delivers ${formatPhraseList(labels)}`
    );
  }

  if (phrases.length === 1) {
    return `${phrases[0]}.`;
  }

  if (phrases.length >= 2) {
    return `${phrases[0]}, while ${phrases[1]}.`;
  }

  return `${primaryName} and ${secondaryName} differ on several buyer priorities.`;
}

/**
 * @param {string[]} phrases
 * @returns {string}
 */
function formatPhraseList(phrases = []) {
  if (!phrases.length) return "";
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

/**
 * @param {{
 *   primarySlug: string,
 *   secondarySlug: string,
 *   primaryScoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   secondaryScoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   primaryRecommendationProfiles?: import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap|null,
 *   secondaryRecommendationProfiles?: import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap|null,
 *   primaryIntelligenceCar?: object|null,
 *   secondaryIntelligenceCar?: object|null,
 * }} input
 * @returns {DimensionComparisonResult}
 */
export function buildDimensionComparisons({
  primarySlug,
  secondarySlug,
  primaryScoreProfile,
  secondaryScoreProfile,
  primaryRecommendationProfiles = null,
  secondaryRecommendationProfiles = null,
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

  /** @type {DimensionComparison[]} */
  const dimensions = COMPARISON_DIMENSIONS.map((dimension) => {
    const primaryTier = readDimensionTier(
      primaryScoreProfile,
      primaryRecommendationProfiles,
      dimension
    );
    const secondaryTier = readDimensionTier(
      secondaryScoreProfile,
      secondaryRecommendationProfiles,
      dimension
    );

    return buildDimensionComparison({
      primarySlug,
      secondarySlug,
      primaryName,
      secondaryName,
      primaryTier,
      secondaryTier,
      dimension,
    });
  });

  return {
    dimensions,
    dimensionSummary: buildDimensionSummary(dimensions, primaryName, secondaryName),
  };
}

export { STRONG_TIER_FLOOR };
