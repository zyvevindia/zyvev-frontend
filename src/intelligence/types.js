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

/**
 * @typedef {Object} ApartmentSuitabilityContext
 * @property {number|null} batteryKwh
 * @property {number|null} acChargingHours
 * @property {number|null} cityScore
 * @property {boolean} acTimeEstimated
 * @property {boolean} cityScoreEstimated
 */

/**
 * @typedef {Object} ApartmentSuitabilityScoreResult
 * @property {number} score 0–100 apartment suitability score (higher is better)
 * @property {string} label Human-readable apartment living tier
 */

/**
 * @typedef {Object} RecommendationContext
 * @property {number|null} cityScore
 * @property {number|null} highwayScore
 * @property {number|null} highwayConfidenceScore
 * @property {number|null} highwayPersonaScore
 * @property {number|null} apartmentScore
 * @property {number|null} ownershipCostScore
 * @property {number|null} valueScore
 * @property {number|null} chargingPracticalityScore
 * @property {number|null} overallScore
 * @property {number|null} highwayPlanningRangeKm
 */

/**
 * @typedef {Object} RecommendationEngineResult
 * @property {string[]} bestFor Up to 4 persona labels
 * @property {string[]} avoidFor Up to 2 caution labels
 */

/**
 * @typedef {RecommendationContext & {
 *   premiumScore: number|null,
 *   startingPrice: number|null
 * }} PersonaContext
 */

/**
 * @typedef {Object} PersonaEngineResult
 * @property {string[]} personas Up to 5 persona labels, priority sorted
 */

/**
 * @typedef {Object} VerdictContext
 * @property {string[]} personas
 * @property {string[]} bestFor
 * @property {string[]} avoidFor
 * @property {(label: string) => boolean} hasPersona
 * @property {boolean} excellentOwnership
 * @property {boolean} goodOwnership
 * @property {boolean} strongHighway
 * @property {boolean} moderateHighway
 * @property {boolean} weakHighway
 * @property {boolean} strongApartment
 * @property {boolean} strongFamily
 * @property {boolean} strongCity
 * @property {boolean} avoidsHighway
 * @property {boolean} avoidsRemote
 */

/**
 * @typedef {Object} EvSavariVerdictResult
 * @property {string|null} headline
 * @property {string|null} summary
 */

/**
 * @typedef {'verified' | 'partial' | 'estimated' | 'directional' | 'reviewPending'} ConfidenceLabel
 */

/**
 * @typedef {Object} ConfidenceContext
 * @property {boolean} hasVehicle
 * @property {object|null} vehicle
 * @property {object} rangeIntel
 * @property {import("./types.js").OwnershipCostContext} ownershipCtx
 * @property {import("./types.js").ChargingPracticalityContext} chargingCtx
 * @property {import("./types.js").HighwayConfidenceContext} highwayCtx
 * @property {import("./types.js").ApartmentSuitabilityContext} apartmentCtx
 * @property {import("./types.js").ScoreExplanationContext} scoreCtx
 */

/**
 * @typedef {Object} ConfidenceEngineResult
 * @property {ConfidenceLabel} overall
 * @property {ConfidenceLabel} range
 * @property {ConfidenceLabel} ownership
 * @property {ConfidenceLabel} chargingPracticality
 * @property {ConfidenceLabel} highwayConfidence
 * @property {ConfidenceLabel} apartmentSuitability
 * @property {ConfidenceLabel} familySuitability
 * @property {ConfidenceLabel} serviceNetwork
 */

/**
 * @typedef {Object} FamilyScoreContext
 * @property {string|null} segment
 * @property {number|null} batteryKwh
 * @property {boolean} isMicroEv
 * @property {number|null} bootSpaceL
 * @property {boolean} bootSpaceEstimated
 * @property {number|null} realWorldRangeKmMid
 * @property {number|null} highwayScore
 * @property {number|null} overallScore
 * @property {number|null} safetyScore
 * @property {number|null} lengthMm
 * @property {number|null} widthMm
 * @property {number|null} wheelbaseMm
 */

/**
 * @typedef {Object} FamilyScoreResult
 * @property {number} score 0–100 family suitability score (higher is better)
 * @property {string} label Human-readable family suitability tier
 */

/**
 * @typedef {Object} ServiceNetworkContext
 * @property {string|null} brand Normalized OEM brand
 */

/**
 * @typedef {Object} ServiceNetworkScoreResult
 * @property {number} score 0–100 service network confidence (higher is better)
 * @property {string} label Human-readable service reach tier
 */
