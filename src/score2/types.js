/**
 * EVSavari Score 2.0 — type definitions.
 *
 * Score, recommendation, confidence, and explanation are independent layers.
 * They must not be collapsed into a single rating or composite number.
 *
 * @typedef {import("./constants.js").ScoreTier} ScoreTier
 * @typedef {import("./constants.js").RecommendationFit} RecommendationFit
 * @typedef {import("./constants.js").ConfidenceLevel} ConfidenceLevel
 */

/**
 * Decision-oriented score dimensions for a vehicle.
 * Values are qualitative tiers — not stars, percentages, or numeric scales.
 *
 * @typedef {Object} EvSavariScore
 * @property {ScoreTier} overall
 * @property {ScoreTier} ownership
 * @property {ScoreTier} charging
 * @property {ScoreTier} highway
 * @property {ScoreTier} family
 * @property {ScoreTier} service
 * @property {ScoreTier} value
 */

/**
 * Persona-fit guidance — who this vehicle suits for a given buying intent.
 * Independent from numeric or tier scores; answers "should I consider this?"
 *
 * @typedef {Object} RecommendationProfile
 * @property {RecommendationFit} cityBuyer
 * @property {RecommendationFit} familyBuyer
 * @property {RecommendationFit} highwayBuyer
 * @property {RecommendationFit} budgetBuyer
 * @property {RecommendationFit} premiumBuyer
 */

/**
 * Data-trust labels per score dimension.
 * Tracks how much catalog, editorial, or inferred evidence backs each dimension.
 *
 * @typedef {Object} ConfidenceProfile
 * @property {ConfidenceLevel} overall
 * @property {ConfidenceLevel} ownership
 * @property {ConfidenceLevel} charging
 * @property {ConfidenceLevel} highway
 * @property {ConfidenceLevel} family
 * @property {ConfidenceLevel} service
 * @property {ConfidenceLevel} value
 */

/**
 * Human-readable decision guidance derived from score and recommendation layers.
 * Strengths and weaknesses describe trade-offs; bestFor and avoidIf guide intent.
 *
 * @typedef {Object} ScoreExplanation
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} bestFor
 * @property {string[]} avoidIf
 * @property {string} summary
 */

/**
 * Complete Score 2.0 profile for one vehicle family.
 * Combines all four layers without merging them into a single rating.
 *
 * @typedef {Object} VehicleScoreProfile
 * @property {string} slug Profile registry key (may differ from vehicleSlug)
 * @property {string} vehicleSlug Catalog vehicle family slug
 * @property {EvSavariScore} score
 * @property {RecommendationProfile} recommendation
 * @property {ConfidenceProfile} confidence
 * @property {ScoreExplanation} explanation
 */

export {};
