/**
 * Vehicle comparison profile builder.
 *
 * Loads recommendation profiles, score profiles, and intelligence cars read-only.
 * Materializes buyer-centric comparison context — lazy generation only.
 */

import { loadIntelligenceCarForSlug } from "../score2/loadIntelligenceCar.js";
import { getVehicleScoreProfile } from "../score2/scoreRegistry.js";
import { getVehicleRecommendationProfiles } from "../recommendations/recommendationProfileRegistry.js";
import { tierRank } from "../score2/scoreTierMapping.js";
import { SCORE_TIERS } from "../score2/constants.js";
import { buildArchetypeComparison } from "./buildArchetypeComparison.js";
import { buildComparisonNarrative } from "./buildComparisonNarrative.js";
import { buildDimensionComparisons } from "./buildDimensionComparisons.js";
import { buildTradeOffAnalysis } from "./buildTradeOffAnalysis.js";
import { DIMENSION_OUTCOMES } from "./constants.js";
import { resolveVehicleName } from "./resolveVehicleName.js";

/** @typedef {import("./types.js").VehicleComparisonProfile} VehicleComparisonProfile */
/** @typedef {import("./types.js").RecommendationDifference} RecommendationDifference */

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function dedupeLines(lines = []) {
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const cleaned = String(line || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} primaryScore
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} secondaryScore
 * @returns {string[]}
 */
function buildSharedStrengths(primaryScore, secondaryScore) {
  const primaryStrengths = primaryScore?.explanation?.strengths || [];
  const secondaryStrengths = secondaryScore?.explanation?.strengths || [];

  const shared = primaryStrengths.filter((strength) =>
    secondaryStrengths.some(
      (other) => other.toLowerCase() === strength.toLowerCase()
    )
  );

  if (shared.length) {
    return dedupeLines(shared);
  }

  /** @type {string[]} */
  const inferred = [];

  const scoreKeys = [
    ["ownership", "Low running costs and sensible ownership economics"],
    ["highway", "Strong highway capability"],
    ["family", "Good family practicality"],
    ["service", "Broad service support"],
    ["value", "Sensible purchase value"],
  ];

  for (const [key, label] of scoreKeys) {
    const primaryTier = primaryScore?.score?.[key];
    const secondaryTier = secondaryScore?.score?.[key];
    if (
      primaryTier &&
      secondaryTier &&
      tierRank(primaryTier) >= tierRank(SCORE_TIERS.GOOD) &&
      tierRank(secondaryTier) >= tierRank(SCORE_TIERS.GOOD)
    ) {
      inferred.push(label);
    }
  }

  return dedupeLines(inferred).slice(0, 4);
}

/**
 * @param {import("./types.js").DimensionComparisonResult} dimensionComparisons
 * @returns {string[]}
 */
function buildDifferentiators(dimensionComparisons) {
  return dimensionComparisons.dimensions
    .filter((dimension) => dimension.outcome === DIMENSION_OUTCOMES.ADVANTAGE)
    .map((dimension) => dimension.statement.replace(/\.$/, ""))
    .slice(0, 5);
}

/**
 * @param {import("../recommendations/recommendationProfileRegistry.js").VehicleRecommendationBundle|null} primaryBundle
 * @param {import("../recommendations/recommendationProfileRegistry.js").VehicleRecommendationBundle|null} secondaryBundle
 * @param {string} primaryName
 * @param {string} secondaryName
 * @returns {RecommendationDifference[]}
 */
function buildRecommendationDifferences(
  primaryBundle,
  secondaryBundle,
  primaryName,
  secondaryName
) {
  /** @type {RecommendationDifference[]} */
  const differences = [];

  if (!primaryBundle || !secondaryBundle) {
    return differences;
  }

  const primaryTop = primaryBundle.topFits.map((fit) => fit.title);
  const secondaryTop = secondaryBundle.topFits.map((fit) => fit.title);

  const primaryOnly = primaryTop.filter((title) => !secondaryTop.includes(title));
  const secondaryOnly = secondaryTop.filter((title) => !primaryTop.includes(title));

  if (primaryOnly.length || secondaryOnly.length) {
    differences.push({
      label: "Strongest buyer matches",
      primaryNote: primaryOnly.length
        ? `${primaryName} stands out for ${primaryOnly.join(" and ")}.`
        : `${primaryName} shares its strongest matches with ${secondaryName}.`,
      secondaryNote: secondaryOnly.length
        ? `${secondaryName} stands out for ${secondaryOnly.join(" and ")}.`
        : `${secondaryName} shares its strongest matches with ${primaryName}.`,
    });
  }

  const primaryWeak = primaryBundle.weakFits.map((fit) => fit.title);
  const secondaryWeak = secondaryBundle.weakFits.map((fit) => fit.title);

  if (primaryWeak.length || secondaryWeak.length) {
    differences.push({
      label: "Weaker buyer matches",
      primaryNote: primaryWeak.length
        ? `${primaryName} is less compelling for ${primaryWeak.join(" and ")}.`
        : `${primaryName} has fewer clear weak spots in this pairing.`,
      secondaryNote: secondaryWeak.length
        ? `${secondaryName} is less compelling for ${secondaryWeak.join(" and ")}.`
        : `${secondaryName} has fewer clear weak spots in this pairing.`,
    });
  }

  if (
    primaryBundle.explanation.primaryRecommendation !==
    secondaryBundle.explanation.primaryRecommendation
  ) {
    differences.push({
      label: "Primary recommendation",
      primaryNote: primaryBundle.explanation.primaryRecommendation,
      secondaryNote: secondaryBundle.explanation.primaryRecommendation,
    });
  }

  return differences.slice(0, 4);
}

/**
 * @param {{
 *   primaryVehicleSlug: string,
 *   secondaryVehicleSlug: string,
 * }} input
 * @returns {VehicleComparisonProfile|null}
 */
export function buildVehicleComparisonProfile({
  primaryVehicleSlug,
  secondaryVehicleSlug,
}) {
  const primarySlug = String(primaryVehicleSlug || "").trim().toLowerCase();
  const secondarySlug = String(secondaryVehicleSlug || "").trim().toLowerCase();

  if (!primarySlug || !secondarySlug || primarySlug === secondarySlug) {
    return null;
  }

  const primaryScoreProfile = getVehicleScoreProfile(primarySlug);
  const secondaryScoreProfile = getVehicleScoreProfile(secondarySlug);

  if (!primaryScoreProfile || !secondaryScoreProfile) {
    return null;
  }

  const primaryBundle = getVehicleRecommendationProfiles(primarySlug);
  const secondaryBundle = getVehicleRecommendationProfiles(secondarySlug);

  const primaryIntelligence = loadIntelligenceCarForSlug(primarySlug);
  const secondaryIntelligence = loadIntelligenceCarForSlug(secondarySlug);
  const primaryIntelligenceCar = primaryIntelligence?.intelligenceCar || null;
  const secondaryIntelligenceCar = secondaryIntelligence?.intelligenceCar || null;

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

  const dimensionComparisons = buildDimensionComparisons({
    primarySlug,
    secondarySlug,
    primaryScoreProfile,
    secondaryScoreProfile,
    primaryRecommendationProfiles: primaryBundle?.profiles || null,
    secondaryRecommendationProfiles: secondaryBundle?.profiles || null,
    primaryIntelligenceCar,
    secondaryIntelligenceCar,
  });

  const tradeOffAnalysis = buildTradeOffAnalysis({
    primaryName,
    secondaryName,
    dimensionComparisons,
    primaryExplanation: primaryScoreProfile.explanation,
    secondaryExplanation: secondaryScoreProfile.explanation,
  });

  const sharedStrengths = buildSharedStrengths(
    primaryScoreProfile,
    secondaryScoreProfile
  );

  const differentiators = buildDifferentiators(dimensionComparisons);

  const narrative = buildComparisonNarrative({
    primaryName,
    secondaryName,
    sharedStrengths,
    dimensionComparisons,
    tradeOffAnalysis,
    primaryTopFitTitles: primaryBundle?.topFits?.map((fit) => fit.title) || [],
    secondaryTopFitTitles:
      secondaryBundle?.topFits?.map((fit) => fit.title) || [],
  });

  const archetypeComparisons = buildArchetypeComparison({
    primarySlug,
    secondarySlug,
    primaryScoreProfile,
    secondaryScoreProfile,
    primaryProfiles: primaryBundle?.profiles || null,
    secondaryProfiles: secondaryBundle?.profiles || null,
    primaryIntelligenceCar,
    secondaryIntelligenceCar,
  });

  return {
    primaryVehicle: {
      slug: primarySlug,
      name: primaryName,
    },
    secondaryVehicle: {
      slug: secondarySlug,
      name: secondaryName,
    },
    sharedStrengths,
    differentiators,
    recommendationDifferences: buildRecommendationDifferences(
      primaryBundle,
      secondaryBundle,
      primaryName,
      secondaryName
    ),
    topFitsPrimary: primaryBundle?.topFits || [],
    topFitsSecondary: secondaryBundle?.topFits || [],
    weakFitsPrimary: primaryBundle?.weakFits || [],
    weakFitsSecondary: secondaryBundle?.weakFits || [],
    dimensionComparisons,
    tradeOffAnalysis,
    narrative,
    archetypeComparisons,
  };
}
