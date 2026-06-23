/**
 * Materialize a full buyer journey from input.
 */

import { buildBuyerRecommendationExplanations } from "./buildBuyerRecommendationExplanation.js";
import {
  buildBuyerRecommendations,
} from "./buildBuyerRecommendations.js";
import { buildBuyerJourneyGuidance } from "./buildBuyerJourneyGuidance.js";
import {
  resolveAnchorArchetype,
  resolveBuyerArchetypes,
} from "./resolveBuyerArchetypes.js";

/** @typedef {import("./types.js").BuyerJourneyInput} BuyerJourneyInput */
/** @typedef {import("./types.js").BuyerJourneyResult} BuyerJourneyResult */

/**
 * @param {Partial<BuyerJourneyInput>|null|undefined} input
 * @returns {BuyerJourneyInput|null}
 */
export function normalizeBuyerJourneyInput(input) {
  if (!input) return null;

  const normalized = {
    budgetRange: String(input.budgetRange || "").trim(),
    dailyDistanceRange: String(input.dailyDistanceRange || "").trim(),
    familySize: String(input.familySize || "").trim(),
    chargingAccess: String(input.chargingAccess || "").trim(),
    usagePattern: String(input.usagePattern || "").trim(),
    priority: String(input.priority || "").trim(),
  };

  if (
    !normalized.budgetRange ||
    !normalized.dailyDistanceRange ||
    !normalized.familySize ||
    !normalized.chargingAccess ||
    !normalized.usagePattern ||
    !normalized.priority
  ) {
    return null;
  }

  return normalized;
}

/**
 * @param {BuyerJourneyInput} input
 * @returns {string}
 */
export function buyerJourneyCacheKey(input) {
  return [
    input.budgetRange,
    input.dailyDistanceRange,
    input.familySize,
    input.chargingAccess,
    input.usagePattern,
    input.priority,
  ].join("|");
}

/**
 * @param {BuyerJourneyInput} input
 * @returns {BuyerJourneyResult|null}
 */
export function buildBuyerJourney(input) {
  const normalized = normalizeBuyerJourneyInput(input);
  if (!normalized) return null;

  const resolvedArchetypes = resolveBuyerArchetypes(normalized);
  const recommendations = buildBuyerRecommendations(normalized);

  const explainedMatches = [
    ...recommendations.strongMatches,
    ...recommendations.goodAlternatives,
    ...recommendations.worthConsidering,
  ];

  const explanations = buildBuyerRecommendationExplanations({
    input: normalized,
    matches: explainedMatches,
    primaryArchetypes: resolvedArchetypes.primaryArchetypes,
  });

  const guidance = buildBuyerJourneyGuidance({
    input: normalized,
    recommendations,
  });

  return {
    input: normalized,
    resolvedArchetypes,
    recommendations,
    explanations,
    guidance,
  };
}

export { resolveAnchorArchetype };
