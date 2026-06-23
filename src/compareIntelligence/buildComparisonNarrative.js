/**
 * Comparison narratives — headline, summary, and buyer-centric differences.
 */

import { DIMENSION_OUTCOMES } from "./constants.js";

/** @typedef {import("./types.js").ComparisonNarrative} ComparisonNarrative */
/** @typedef {import("./types.js").DimensionComparisonResult} DimensionComparisonResult */
/** @typedef {import("./types.js").TradeOffAnalysis} TradeOffAnalysis */

/**
 * @param {{
 *   primaryName: string,
 *   secondaryName: string,
 *   sharedStrengths: string[],
 *   dimensionComparisons: DimensionComparisonResult,
 *   tradeOffAnalysis: TradeOffAnalysis,
 *   primaryTopFitTitles?: string[],
 *   secondaryTopFitTitles?: string[],
 * }} input
 * @returns {ComparisonNarrative}
 */
export function buildComparisonNarrative({
  primaryName,
  secondaryName,
  sharedStrengths,
  dimensionComparisons,
  tradeOffAnalysis,
  primaryTopFitTitles = [],
  secondaryTopFitTitles = [],
}) {
  const headline = buildHeadline({
    sharedStrengths,
    primaryTopFitTitles,
    secondaryTopFitTitles,
  });

  const summary = buildSummary({
    primaryName,
    secondaryName,
    dimensionComparisons,
    tradeOffAnalysis,
    primaryTopFitTitles,
    secondaryTopFitTitles,
  });

  const keyDifferences = buildKeyDifferences(dimensionComparisons);
  const narrativeSharedStrengths = sharedStrengths.slice(0, 4);

  return {
    headline,
    summary,
    keyDifferences,
    sharedStrengths: narrativeSharedStrengths,
  };
}

/**
 * @param {{
 *   sharedStrengths: string[],
 *   primaryTopFitTitles: string[],
 *   secondaryTopFitTitles: string[],
 * }} input
 * @returns {string}
 */
function buildHeadline({ sharedStrengths, primaryTopFitTitles, secondaryTopFitTitles }) {
  const overlap = primaryTopFitTitles.filter((title) =>
    secondaryTopFitTitles.includes(title)
  );

  if (overlap.length) {
    const focus = overlap[0]
      .toLowerCase()
      .replace(/ buyer$/, " buyers")
      .replace(/^city commuter$/, "city commuters");
    return `Both vehicles suit ${focus}, but their strengths differ.`;
  }

  if (sharedStrengths.length >= 2) {
    return "Both vehicles share practical strengths, but their buyer fit differs.";
  }

  return "Two capable EV choices with different buyer priorities.";
}

/**
 * @param {{
 *   primaryName: string,
 *   secondaryName: string,
 *   dimensionComparisons: DimensionComparisonResult,
 *   tradeOffAnalysis: TradeOffAnalysis,
 *   primaryTopFitTitles: string[],
 *   secondaryTopFitTitles: string[],
 * }} input
 * @returns {string}
 */
function buildSummary({
  primaryName,
  secondaryName,
  dimensionComparisons,
  tradeOffAnalysis,
  primaryTopFitTitles,
  secondaryTopFitTitles,
}) {
  const secondaryAdvantages = dimensionComparisons.dimensions.filter(
    (dimension) =>
      dimension.outcome === DIMENSION_OUTCOMES.ADVANTAGE &&
      dimension.advantagedVehicleName === secondaryName
  );
  const primaryAdvantages = dimensionComparisons.dimensions.filter(
    (dimension) =>
      dimension.outcome === DIMENSION_OUTCOMES.ADVANTAGE &&
      dimension.advantagedVehicleName === primaryName
  );

  const secondaryFocus = summarizeAdvantages(secondaryAdvantages);
  const primaryFocus = summarizeAdvantages(primaryAdvantages);

  if (secondaryFocus && primaryFocus) {
    return `The ${secondaryName} is likely to appeal more to buyers prioritising ${secondaryFocus}, whereas the ${primaryName} remains attractive for ${primaryFocus}.`;
  }

  if (primaryFocus && !secondaryFocus) {
    return `The ${primaryName} remains attractive for buyers prioritising ${primaryFocus}, while the ${secondaryName} is closely matched across several priorities.`;
  }

  if (secondaryFocus && !primaryFocus) {
    return `The ${secondaryName} is likely to appeal more to buyers prioritising ${secondaryFocus}, while the ${primaryName} suits a different emphasis.`;
  }

  if (dimensionComparisons.dimensionSummary) {
    return dimensionComparisons.dimensionSummary;
  }

  if (tradeOffAnalysis.tradeOffs[0]) {
    return tradeOffAnalysis.tradeOffs[0];
  }

  return `${primaryName} and ${secondaryName} are both workable EV choices with different emphasis areas.`;
}

/**
 * @param {import("./types.js").DimensionComparison[]} advantages
 * @returns {string}
 */
function summarizeAdvantages(advantages = []) {
  if (!advantages.length) return "";

  const phrases = advantages.slice(0, 2).map((dimension) => {
    if (dimension.key === "value") return "purchase value";
    if (dimension.key === "premium") return "premium appeal";
    if (dimension.key === "highway") return "highway capability";
    if (dimension.key === "family") return "family practicality";
    if (dimension.key === "city") return "city usability";
    if (dimension.key === "ownership") return "ownership economics";
    return dimension.label.toLowerCase();
  });

  if (phrases.length === 1) return phrases[0];
  return `${phrases[0]} and ${phrases[1]}`;
}

/**
 * @param {string[]} titles
 * @returns {string}
 */
function formatTitleList(titles = []) {
  if (!titles.length) return "different buyer contexts";
  if (titles.length === 1) return titles[0].toLowerCase();
  return `${titles[0].toLowerCase()} and ${titles[1].toLowerCase()}`;
}

/**
 * @param {DimensionComparisonResult} dimensionComparisons
 * @returns {string[]}
 */
function buildKeyDifferences(dimensionComparisons) {
  const differences = dimensionComparisons.dimensions
    .filter((dimension) => dimension.outcome === DIMENSION_OUTCOMES.ADVANTAGE)
    .map((dimension) => dimension.statement.replace(/\.$/, ""))
    .slice(0, 4);

  if (differences.length) {
    return differences;
  }

  return dimensionComparisons.dimensions
    .filter((dimension) => dimension.outcome === DIMENSION_OUTCOMES.TIE)
    .slice(0, 2)
    .map((dimension) => dimension.statement.replace(/\.$/, ""));
}
