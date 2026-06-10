export { SCORE_ENGINE_VERSION, OVERALL_WEIGHTS, CATEGORY_DEFINITIONS } from "./scoreWeights.js";

export {
  clampScore,
  normalizeToScore,
  weightedAverage,
  averagePresent,
  scoreToGrade,
  computeEfficiencyKmPerKwh,
  computePremiumScore,
  computeBudgetScore,
} from "./scoreNormalization.js";

export {
  buildVehicleBreakdown,
  computeFeatureScore,
  computeRangeBreakdown,
  computeChargingBreakdown,
  computePerformanceBreakdown,
  computeSafetyBreakdown,
  computeValueBreakdown,
  computeFamilyBreakdown,
  computeCityBreakdown,
  computeHighwayBreakdown,
} from "./scoreBreakdown.js";

export {
  explainDimension,
  buildScoreExplanation,
  explainVariantPick,
  DIMENSION_LABELS,
  FEATURE_LABELS,
} from "./scoreExplanations.js";

export {
  scoreVariant,
  scoreVariants,
  enrichSignalsFromVariants,
} from "./variantScoring.js";

export {
  computeOverallScore,
  scoreVehicleFromSignals,
} from "./vehicleScoring.js";

export {
  getCategoryScore,
  rankByCategory,
  buildCategoryRankings,
  getTopRankedByCategory,
} from "./categoryRanking.js";

export {
  scoreVehicle,
  extractScoringSignals,
  extractSignals,
  toLegacyEvScores,
  withEvsavariScores,
  scoreAndRankVehicles,
} from "./scoreEngine.js";
