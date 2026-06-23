/**
 * Constructive trade-off analysis from dimension comparisons.
 *
 * No overall winner — only relative advantages and balanced trade-off language.
 */

import { DIMENSION_ADVANTAGE_LABELS, DIMENSION_OUTCOMES } from "./constants.js";

/** @typedef {import("./types.js").TradeOffAnalysis} TradeOffAnalysis */
/** @typedef {import("./types.js").DimensionComparisonResult} DimensionComparisonResult */

/**
 * @param {string} vehicleName
 * @param {string} phrase
 * @returns {string}
 */
function formatAdvantage(vehicleName, phrase) {
  const cleaned = String(phrase || "").trim();
  if (!cleaned) return vehicleName;
  return `${vehicleName}: ${capitalizeFirst(cleaned)}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function capitalizeFirst(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * @param {{
 *   primaryName: string,
 *   secondaryName: string,
 *   dimensionComparisons: DimensionComparisonResult,
 *   primaryExplanation?: import("../score2/types.js").ScoreExplanation|null,
 *   secondaryExplanation?: import("../score2/types.js").ScoreExplanation|null,
 * }} input
 * @returns {TradeOffAnalysis}
 */
export function buildTradeOffAnalysis({
  primaryName,
  secondaryName,
  dimensionComparisons,
  primaryExplanation = null,
  secondaryExplanation = null,
}) {
  /** @type {string[]} */
  const advantagesPrimary = [];
  /** @type {string[]} */
  const advantagesSecondary = [];
  /** @type {string[]} */
  const tradeOffs = [];

  for (const dimension of dimensionComparisons.dimensions) {
    if (dimension.outcome !== DIMENSION_OUTCOMES.ADVANTAGE) continue;

    const phrase =
      DIMENSION_ADVANTAGE_LABELS[dimension.key] || dimension.label.toLowerCase();

    if (dimension.advantagedVehicleName === primaryName) {
      advantagesPrimary.push(formatAdvantage(primaryName, phrase));
    } else if (dimension.advantagedVehicleName === secondaryName) {
      advantagesSecondary.push(formatAdvantage(secondaryName, phrase));
    }
  }

  const primaryHasValue = advantagesPrimary.some((line) =>
    line.toLowerCase().includes("purchase value")
  );
  const secondaryHasHighway = advantagesSecondary.some((line) =>
    line.toLowerCase().includes("highway")
  );
  const secondaryHasPremium = advantagesSecondary.some((line) =>
    line.toLowerCase().includes("premium")
  );
  const primaryHasValueOnly =
    primaryHasValue &&
    !advantagesPrimary.some((line) => line.toLowerCase().includes("highway"));

  if (
    (secondaryHasHighway || secondaryHasPremium) &&
    primaryHasValueOnly
  ) {
    tradeOffs.push(
      "Higher capability and positioning often come with a higher purchase cost."
    );
  }

  if (
    advantagesPrimary.length &&
    advantagesSecondary.length &&
    !tradeOffs.length
  ) {
    tradeOffs.push(
      `${primaryName} and ${secondaryName} excel in different buyer priorities — choose based on daily usage rather than a single headline strength.`
    );
  }

  const primaryWeakness = primaryExplanation?.weaknesses?.[0];
  const secondaryWeakness = secondaryExplanation?.weaknesses?.[0];

  if (primaryWeakness && secondaryWeakness && primaryWeakness !== secondaryWeakness) {
    tradeOffs.push(
      `${primaryName} buyers may notice ${primaryWeakness.toLowerCase()}, while ${secondaryName} buyers may weigh ${secondaryWeakness.toLowerCase()}.`
    );
  }

  if (!tradeOffs.length && dimensionComparisons.dimensions.some(
    (dimension) => dimension.outcome === DIMENSION_OUTCOMES.TRADE_OFF
  )) {
    tradeOffs.push(
      "Both vehicles involve compromises in some areas — match the choice to your charging setup and daily routes."
    );
  }

  return {
    advantagesPrimary: dedupeLines(advantagesPrimary),
    advantagesSecondary: dedupeLines(advantagesSecondary),
    tradeOffs: dedupeLines(tradeOffs).slice(0, 3),
  };
}

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
