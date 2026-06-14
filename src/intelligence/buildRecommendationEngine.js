import { scoreVehicle } from "../scoring/scoreEngine.js";
import { buildScoreExplanationContext } from "./buildScoreExplanation.js";
import { buildOwnershipCostScore } from "./buildOwnershipCostScore.js";
import { buildChargingPracticalityScore } from "./buildChargingPracticalityScore.js";
import { buildApartmentScore } from "./buildApartmentScore.js";
import {
  buildHighwayConfidenceScore,
  buildHighwayConfidenceContext,
} from "./buildHighwayConfidenceScore.js";
import {
  RECOMMENDATION_AVOID_FOR_RULES,
  RECOMMENDATION_BEST_FOR_RULES,
  RECOMMENDATION_LIMITS,
  applyRecommendationRules,
} from "./recommendationRules.js";

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveOverallScore(vehicle) {
  const existing =
    parseNumber(vehicle?.evSavariScores?.overall?.score) ??
    parseNumber(vehicle?.evSavariScores?.composite) ??
    parseNumber(vehicle?.evScores?.composite);

  if (existing != null) return existing;

  try {
    const scored = scoreVehicle(vehicle, { variants: vehicle?.variants });
    return parseNumber(scored?.overall?.score);
  } catch {
    return null;
  }
}

function resolveHighwayScore(vehicle, explanationCtx, options = {}) {
  const override = parseNumber(options.highwayScore);
  if (override != null) return override;

  const fromExplanation = parseNumber(explanationCtx.highwayScore);
  if (fromExplanation != null) return fromExplanation;

  const legacy = parseNumber(
    vehicle?.evScores?.subScores?.highwayUsability
  );
  if (legacy != null) return legacy;

  return buildHighwayConfidenceScore(vehicle).score;
}

/**
 * Build normalized recommendation context from intelligence scores.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").RecommendationContext>} [options]
 * @returns {import("./types.js").RecommendationContext}
 */
export function buildRecommendationContext(vehicle, options = {}) {
  const explanationCtx = buildScoreExplanationContext(vehicle);
  const highwayCtx = buildHighwayConfidenceContext(vehicle);
  const highwayConfidenceScore = buildHighwayConfidenceScore(vehicle).score;
  const resolvedHighwayScore = resolveHighwayScore(vehicle, explanationCtx, options);
  const highwayPersonaScore = Math.max(
    resolvedHighwayScore ?? 0,
    parseNumber(options.highwayConfidenceScore) ?? highwayConfidenceScore ?? 0
  );

  return {
    cityScore:
      parseNumber(options.cityScore) ?? explanationCtx.cityScore ?? null,
    highwayScore: resolvedHighwayScore,
    highwayConfidenceScore:
      parseNumber(options.highwayConfidenceScore) ?? highwayConfidenceScore,
    highwayPersonaScore:
      parseNumber(options.highwayPersonaScore) ?? highwayPersonaScore,
    apartmentScore:
      parseNumber(options.apartmentScore) ??
      buildApartmentScore(vehicle).score,
    ownershipCostScore:
      parseNumber(options.ownershipCostScore) ??
      buildOwnershipCostScore(vehicle).score,
    valueScore:
      parseNumber(options.valueScore) ?? explanationCtx.valueScore ?? null,
    chargingPracticalityScore:
      parseNumber(options.chargingPracticalityScore) ??
      buildChargingPracticalityScore(vehicle).score,
    overallScore:
      parseNumber(options.overallScore) ?? resolveOverallScore(vehicle),
    highwayPlanningRangeKm:
      parseNumber(options.highwayPlanningRangeKm) ??
      highwayCtx.highwayPlanningRangeKm,
  };
}

/**
 * Deterministic persona recommendations from EV intelligence scores.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").RecommendationContext>} [options]
 * @returns {import("./types.js").RecommendationEngineResult}
 */
export function buildRecommendationEngine(vehicle, options = {}) {
  const ctx = buildRecommendationContext(vehicle, options);

  const bestFor = applyRecommendationRules(
    RECOMMENDATION_BEST_FOR_RULES,
    ctx,
    RECOMMENDATION_LIMITS.maxBestFor
  );

  const avoidFor = applyRecommendationRules(
    RECOMMENDATION_AVOID_FOR_RULES,
    ctx,
    RECOMMENDATION_LIMITS.maxAvoidFor
  );

  return {
    bestFor,
    avoidFor,
  };
}
