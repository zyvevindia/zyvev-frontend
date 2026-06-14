/**
 * @typedef {'verified' | 'partial' | 'estimated'} ScoreExplanationConfidence
 */

/**
 * @typedef {Object} ScoreExplanationContext
 * @property {number|null} cityScore
 * @property {number|null} valueScore
 * @property {number|null} chargingScore
 * @property {number|null} highwayScore
 * @property {number|null} rangeScore
 * @property {number|null} safetyScore
 * @property {number|null} performanceScore
 * @property {number|null} batteryKwh
 * @property {boolean} hasScoreData
 */

/**
 * @typedef {Object} ScoreExplanationRule
 * @property {string} id
 * @property {(ctx: ScoreExplanationContext) => boolean} when
 * @property {string} label
 * @property {number} [priority]
 * @property {string} [group] Rules in the same group are mutually exclusive (highest priority wins)
 */

/**
 * @typedef {Object} ScoreExplanationResult
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {ScoreExplanationConfidence} confidence
 */

export const SCORE_EXPLANATION_CONFIDENCE = Object.freeze({
  VERIFIED: "verified",
  PARTIAL: "partial",
  ESTIMATED: "estimated",
});

export const SCORE_EXPLANATION_LIMITS = Object.freeze({
  maxStrengths: 3,
  maxWeaknesses: 2,
});

/**
 * @typedef {Object} OwnershipCostElectricityAssumptions
 * @property {number} [homeRateInr] Home AC tariff (₹/kWh)
 * @property {number} [blendedRateInr] Blended home + public tariff (₹/kWh)
 * @property {number} [petrolCostPerKmInr] Petrol reference (₹/km) for score calibration
 */

/**
 * @typedef {Object} OwnershipCostContext
 * @property {number} efficiencyKmPerKwh
 * @property {boolean} efficiencyEstimated
 * @property {OwnershipCostElectricityAssumptions} electricityAssumptions
 */

/**
 * @typedef {Object} OwnershipCostScoreResult
 * @property {number} score 0–100 ownership cost score (higher is better)
 * @property {number} costPerKmMin Optimistic ₹/km (home tariff, claimed efficiency)
 * @property {number} costPerKmMax Planning ₹/km (blended tariff, conservative efficiency)
 * @property {string} label Human-readable ownership cost tier
 */

/**
 * @typedef {Object} ChargingPracticalityContext
 * @property {number|null} batteryKwh
 * @property {number|null} acChargingHours
 * @property {number|null} dcChargingMinutes
 * @property {number|null} acChargingKw
 * @property {number|null} dcChargingKw
 * @property {boolean} acTimeEstimated
 * @property {boolean} dcTimeEstimated
 */

/**
 * @typedef {Object} ChargingPracticalityScoreResult
 * @property {number} score 0–100 charging practicality score (higher is better)
 * @property {string} label Human-readable charging tier
 * @property {string} acChargingExperience Overnight / home AC summary
 * @property {string} dcChargingExperience Highway / fast DC summary
 */

/**
 * @typedef {Object} HighwayConfidenceContext
 * @property {number|null} highwayPlanningRangeKm Conservative highway range for trip planning
 * @property {number|null} realWorldRangeKmMid Midpoint of mixed real-world range when available
 * @property {number|null} dcChargingMinutes
 * @property {number|null} batteryKwh
 * @property {boolean} rangeEstimated
 * @property {boolean} dcTimeEstimated
 */

/**
 * @typedef {Object} HighwayConfidenceScoreResult
 * @property {number} score 0–100 highway confidence score (higher is better)
 * @property {string} label Human-readable highway travel tier
 */
