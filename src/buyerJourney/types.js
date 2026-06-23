/**
 * EVSavari Buyer Journey Engine — type definitions.
 *
 * Buyer journey types describe shopping intent — not rankings or scores.
 */

/**
 * @typedef {import("./constants.js").BudgetRangeId} BudgetRangeId
 * @typedef {import("./constants.js").DailyDistanceRangeId} DailyDistanceRangeId
 * @typedef {import("./constants.js").FamilySizeId} FamilySizeId
 * @typedef {import("./constants.js").ChargingAccessId} ChargingAccessId
 * @typedef {import("./constants.js").UsagePatternId} UsagePatternId
 * @typedef {import("./constants.js").BuyerPriorityId} BuyerPriorityId
 */

/**
 * @typedef {Object} BuyerJourneyInput
 * @property {BudgetRangeId} budgetRange
 * @property {DailyDistanceRangeId} dailyDistanceRange
 * @property {FamilySizeId} familySize
 * @property {ChargingAccessId} chargingAccess
 * @property {UsagePatternId} usagePattern
 * @property {BuyerPriorityId} priority
 */

/**
 * @typedef {Object} ResolvedBuyerArchetypes
 * @property {string[]} primaryArchetypes
 * @property {string[]} secondaryArchetypes
 */

/**
 * @typedef {Object} BuyerJourneyVehicleMatch
 * @property {string} vehicleSlug
 * @property {string} vehicleName
 * @property {import("../recommendations/fitConstants.js").FitTier} anchorFitTier
 * @property {string} anchorArchetypeId
 * @property {string[]} matchedArchetypeIds
 */

/**
 * @typedef {Object} BuyerRecommendationBuckets
 * @property {BuyerJourneyVehicleMatch[]} strongMatches
 * @property {BuyerJourneyVehicleMatch[]} goodAlternatives
 * @property {BuyerJourneyVehicleMatch[]} worthConsidering
 * @property {BuyerJourneyVehicleMatch[]} weakFits
 */

/**
 * @typedef {Object} BuyerRecommendationExplanation
 * @property {string} vehicleSlug
 * @property {string} vehicleName
 * @property {string} headline
 * @property {string} summary
 * @property {string[]} strengths
 * @property {string[]} tradeOffs
 * @property {"High"|"Medium"|"Low"} confidence
 */

/**
 * @typedef {Object} BuyerJourneyGuidance
 * @property {string[]} whoShouldFocus
 * @property {string[]} whoMayWantAlternatives
 * @property {string[]} keyConsiderations
 */

/**
 * @typedef {Object} BuyerJourneyResult
 * @property {BuyerJourneyInput} input
 * @property {ResolvedBuyerArchetypes} resolvedArchetypes
 * @property {BuyerRecommendationBuckets} recommendations
 * @property {Record<string, BuyerRecommendationExplanation>} explanations
 * @property {BuyerJourneyGuidance} guidance
 */

export {};
