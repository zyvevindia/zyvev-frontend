import { buildApartmentContext } from "./buildApartmentScore.js";
import { buildChargingPracticalityContext } from "./buildChargingPracticalityScore.js";
import { buildHighwayConfidenceContext } from "./buildHighwayConfidenceScore.js";
import { buildOwnershipCostContext } from "./buildOwnershipCostScore.js";
import { buildScoreExplanationContext } from "./buildScoreExplanation.js";
import {
  applyConfidenceRules,
  CONFIDENCE_LABELS,
} from "./confidenceRules.js";
import { buildRangeConfidence } from "./rangeConfidence.js";

/**
 * Build normalized confidence context from intelligence engines.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").ConfidenceContext>} [options]
 * @returns {import("./types.js").ConfidenceContext}
 */
export function buildConfidenceContext(vehicle, options = {}) {
  const hasVehicle = Boolean(vehicle && typeof vehicle === "object");

  return {
    hasVehicle,
    vehicle: hasVehicle ? vehicle : null,
    rangeIntel: options.rangeIntel ?? buildRangeConfidence(vehicle || {}),
    ownershipCtx:
      options.ownershipCtx ?? buildOwnershipCostContext(vehicle, options),
    chargingCtx:
      options.chargingCtx ??
      buildChargingPracticalityContext(vehicle, options),
    highwayCtx:
      options.highwayCtx ?? buildHighwayConfidenceContext(vehicle, options),
    apartmentCtx:
      options.apartmentCtx ?? buildApartmentContext(vehicle, options),
    scoreCtx:
      options.scoreCtx ?? buildScoreExplanationContext(vehicle),
  };
}

/**
 * Resolve confidence labels across the intelligence layer.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").ConfidenceContext>} [options]
 * @returns {import("./types.js").ConfidenceEngineResult}
 */
export function buildConfidenceLabels(vehicle, options = {}) {
  const ctx = buildConfidenceContext(vehicle, options);
  return applyConfidenceRules(ctx);
}

export { CONFIDENCE_LABELS };
