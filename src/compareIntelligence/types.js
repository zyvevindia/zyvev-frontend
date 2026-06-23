/**
 * EVSavari Compare Intelligence — type definitions.
 *
 * Comparisons describe buyer-centric trade-offs — not rankings, scores, or winners.
 */

/**
 * Qualitative dimension outcome for a head-to-head comparison.
 *
 * @typedef {"advantage"|"tie"|"tradeOff"} DimensionOutcome
 */

/**
 * @typedef {Object} ComparisonVehicleRef
 * @property {string} slug
 * @property {string} name
 */

/**
 * @typedef {Object} DimensionComparison
 * @property {string} key
 * @property {string} label
 * @property {DimensionOutcome} outcome
 * @property {string|null} advantagedVehicleSlug
 * @property {string|null} advantagedVehicleName
 * @property {string} statement
 */

/**
 * @typedef {Object} DimensionComparisonResult
 * @property {DimensionComparison[]} dimensions
 * @property {string} dimensionSummary
 */

/**
 * @typedef {Object} TradeOffAnalysis
 * @property {string[]} advantagesPrimary
 * @property {string[]} advantagesSecondary
 * @property {string[]} tradeOffs
 */

/**
 * @typedef {Object} ComparisonNarrative
 * @property {string} headline
 * @property {string} summary
 * @property {string[]} keyDifferences
 * @property {string[]} sharedStrengths
 */

/**
 * @typedef {Object} ArchetypeComparisonOutcome
 * @property {string} archetypeId
 * @property {string} title
 * @property {"tie"|string} preferredVehicle
 * @property {string} rationale
 */

/**
 * @typedef {Object} RecommendationDifference
 * @property {string} label
 * @property {string} primaryNote
 * @property {string} secondaryNote
 */

/**
 * @typedef {Object} VehicleComparisonProfile
 * @property {ComparisonVehicleRef} primaryVehicle
 * @property {ComparisonVehicleRef} secondaryVehicle
 * @property {string[]} sharedStrengths
 * @property {string[]} differentiators
 * @property {RecommendationDifference[]} recommendationDifferences
 * @property {import("../recommendations/selectTopArchetypes.js").ArchetypeFitSelection[]} topFitsPrimary
 * @property {import("../recommendations/selectTopArchetypes.js").ArchetypeFitSelection[]} topFitsSecondary
 * @property {import("../recommendations/selectTopArchetypes.js").ArchetypeFitSelection[]} weakFitsPrimary
 * @property {import("../recommendations/selectTopArchetypes.js").ArchetypeFitSelection[]} weakFitsSecondary
 * @property {DimensionComparisonResult} dimensionComparisons
 * @property {TradeOffAnalysis} tradeOffAnalysis
 * @property {ComparisonNarrative} narrative
 * @property {ArchetypeComparisonOutcome[]} archetypeComparisons
 */

export {};
