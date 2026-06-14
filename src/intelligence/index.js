export {
  OWNERSHIP_ASSUMPTIONS,
  RANGE_CONFIDENCE_THRESHOLDS,
  CHARGING_SPEED_CATEGORY,
  CONFIDENCE_LEVELS,
  RANGE_SOURCES,
} from "./constants.js";

export {
  UNAVAILABLE,
  isPresent,
  formatUnavailable,
  formatIntelligenceValue,
} from "./governance.js";

export {
  buildChargingIntelligence,
  classifyChargingSpeed,
  chargingConvenienceScore,
} from "./chargingIntelligence.js";

export {
  buildOwnershipIntelligence,
  computeChargingCosts,
} from "./ownershipIntelligence.js";

export {
  buildRangeConfidence,
  formatRangeConfidenceLabel,
} from "./rangeConfidence.js";

export { buildFeatureMatrix } from "./featureMatrix.js";

export {
  buildSuitabilityInsights,
  SUITABILITY_LEVEL,
} from "./suitabilityInsights.js";

export {
  buildVehicleIntelligence,
  withVehicleIntelligence,
} from "./buildVehicleIntelligence.js";

export {
  CORE_COMPARE_ROWS,
  getActiveCompareRows,
  formatCompareCellValue,
  getCompareHighlightWinnerId,
  attachIntelligenceToCompareCars,
} from "./compareSpecRows.js";

export * from "./taxonomy.js";

export {
  SCORE_WEIGHTS,
  buildEvsavariScores,
  getBestForLabel,
} from "./scoringEngine.js";

export {
  enrichFamilyWithIntelligence,
  enrichFamiliesWithIntelligence,
  familyToIntelligenceVehicle,
  isFastChargingFamily,
} from "./familyIntelligence.js";

export {
  INTELLIGENCE_FILTER_DEFINITIONS,
  FILTER_GROUPS,
  getFilterDefinition,
  getPrimaryFilters,
  getSecondaryFilters,
} from "./filterDefinitions.js";

export {
  parseIntelligenceFiltersFromParams,
  writeIntelligenceFiltersToParams,
  applyIntelligenceFilters,
  filterEnrichedFamilies,
  getAvailableFiltersForFamilies,
  INTELLIGENCE_FILTER_URL_PARAM,
} from "./filterMatcher.js";

export {
  recommendFamilies,
  DEFAULT_RECOMMENDATION_PRIORITIES,
} from "./recommendations.js";

export { buildCompareAdvantages } from "./compareAdvantages.js";

export { rankFamiliesForPreset } from "./discoveryRanking.js";

export {
  DATA_ORIGIN,
  DATA_ORIGIN_LABELS,
  VERIFICATION_BADGE,
  buildTrustField,
  buildVehicleTrustBundle,
  buildTrustFaqAnchors,
  getConfidenceLabel,
} from "./trustMetadata.js";

export {
  extractCurationMetadata,
  applyCurationToRange,
  applyCurationToChargingPracticality,
} from "./curationMetadata.js";

export {
  validateVehicleForIntelligence,
  auditIntelligenceBundle,
  validateCompareSet,
  safeIntelligenceDisplay,
} from "./intelligenceValidation.js";

export { buildChargingPracticality } from "./chargingPracticality.js";

export { buildCompareTrustSummary } from "./compareTrustSummary.js";

export {
  buildScoreExplanation,
  buildScoreExplanationContext,
  resolveScoreExplanationConfidence,
} from "./buildScoreExplanation.js";

export {
  STRENGTH_RULES,
  WEAKNESS_RULES,
  applyScoreExplanationRules,
  evaluateScoreExplanationRules,
  SCORE_EXPLANATION_LIMITS,
} from "./scoreExplanationRules.js";

export {
  SCORE_EXPLANATION_CONFIDENCE,
} from "./types.js";

export {
  buildOwnershipCostScore,
  buildOwnershipCostContext,
  resolveOwnershipEfficiency,
  resolveOwnershipElectricityAssumptions,
  ownershipCostPerKmToScore,
  resolveOwnershipCostLabel,
} from "./buildOwnershipCostScore.js";

export {
  OWNERSHIP_COST_CONSERVATIVE_EFFICIENCY_FACTOR,
  OWNERSHIP_COST_LABELS,
  CHARGING_PRACTICALITY_LABELS,
  CHARGING_PRACTICALITY_ASSUMPTIONS,
} from "./constants.js";

export {
  buildChargingPracticalityScore,
  buildChargingPracticalityContext,
  estimateAcChargingHours,
  estimateDcChargingMinutes,
  resolveAcChargingExperience,
  resolveDcChargingExperience,
  acChargingHoursToScore,
  dcChargingMinutesToScore,
  combineChargingPracticalityScore,
  resolveChargingPracticalityLabel,
} from "./buildChargingPracticalityScore.js";

export {
  buildHighwayConfidenceScore,
  buildHighwayConfidenceContext,
  resolveHighwayPlanningRangeKm,
  highwayPlanningRangeToScore,
  highwayBatteryKwhToScore,
  combineHighwayConfidenceScore,
  resolveHighwayConfidenceLabel,
} from "./buildHighwayConfidenceScore.js";

export {
  HIGHWAY_CONFIDENCE_LABELS,
  HIGHWAY_CONFIDENCE_ASSUMPTIONS,
} from "./constants.js";

export {
  buildApartmentScore,
  buildApartmentContext,
  apartmentBatteryKwhToScore,
  resolveApartmentCityScore,
  combineApartmentSuitabilityScore,
  resolveApartmentSuitabilityLabel,
} from "./buildApartmentScore.js";

export {
  APARTMENT_SUITABILITY_LABELS,
  APARTMENT_SUITABILITY_ASSUMPTIONS,
} from "./constants.js";

export {
  buildRecommendationEngine,
  buildRecommendationContext,
} from "./buildRecommendationEngine.js";

export {
  RECOMMENDATION_BEST_FOR_RULES,
  RECOMMENDATION_AVOID_FOR_RULES,
  RECOMMENDATION_LIMITS,
  applyRecommendationRules,
} from "./recommendationRules.js";

export { buildPersonas, buildPersonaContext } from "./buildPersonas.js";

export {
  PERSONA_RULES,
  PERSONA_LIMITS,
  PREMIUM_PRICE_THRESHOLD_INR,
} from "./personaRules.js";

export {
  buildConfidenceLabels,
  buildConfidenceContext,
  CONFIDENCE_LABELS,
} from "./buildConfidenceLabels.js";

export {
  applyConfidenceRules,
  combineConfidenceLabels,
  minConfidenceLabel,
  CONFIDENCE_LABEL_ORDER,
  resolveOverallConfidenceLabel,
  resolveRangeConfidenceLabel,
  resolveOwnershipConfidenceLabel,
  resolveChargingPracticalityConfidenceLabel,
  resolveHighwayConfidenceConfidenceLabel,
  resolveApartmentSuitabilityConfidenceLabel,
  resolveFamilySuitabilityConfidenceLabel,
  resolveServiceNetworkConfidenceLabel,
} from "./confidenceRules.js";

export { buildFamilyScore, buildFamilyContext } from "./buildFamilyScore.js";

export {
  FAMILY_SCORE_WEIGHTS,
  FAMILY_SUITABILITY_LABELS,
  SEGMENT_BOOT_SPACE_DEFAULTS_L,
  MICRO_EV_BOOT_SPACE_DEFAULT_L,
  MICRO_EV_BATTERY_KWH_THRESHOLD,
} from "./constants.js";

export {
  bootSpaceLitersToFamilyScore,
  batteryKwhToFamilyScore,
  realWorldRangeKmToFamilyScore,
  dimensionsToFamilyScore,
  resolveFamilySegmentBonus,
  resolveCatalogTrustFamilyBonus,
  resolveSegmentBootSpaceDefault,
  resolveFamilyBootSpace,
  combineFamilyScoreComponents,
  finalizeFamilyScore,
  resolveFamilySuitabilityLabel,
  buildFamilyScoreComponents,
  computeFamilyScore,
} from "./familyRules.js";

export {
  buildServiceNetworkScore,
  buildServiceNetworkContext,
  resolveServiceNetworkBrand,
} from "./buildServiceNetworkScore.js";

export {
  SERVICE_NETWORK_LABELS,
  SERVICE_NETWORK_TIERS,
  SERVICE_NETWORK_BRAND_ALIASES,
  SERVICE_NETWORK_DEFAULT_SCORE,
  normalizeServiceNetworkBrand,
  resolveServiceNetworkBrandScore,
  resolveServiceNetworkLabel,
  computeServiceNetworkScore,
  applyServiceNetworkRules,
} from "./serviceNetworkRules.js";

export { formatRangeBand } from "./rangeConfidence.js";

export {
  CHANGE_FIELD,
  CHANGE_SEVERITY,
  buildCatalogSnapshot,
  diffCatalogSnapshots,
  detectCatalogChanges,
  extractCatalogChangeLog,
} from "./changeDetection.js";

export {
  FRESHNESS_STATE,
  FRESHNESS_STATE_LABELS,
  buildFreshnessMetadata,
  extractFreshnessSources,
  classifyFreshnessState,
  formatFreshnessLabel,
  daysSince,
} from "./freshnessMetadata.js";

export {
  computeFreshnessScore,
  adjustConfidenceForFreshness,
  buildFreshnessConfidenceExplanation,
} from "./freshnessScoring.js";

export { buildChangeTransparency } from "./changeTransparency.js";

export {
  AUDIT_ISSUE,
  auditVehicleCatalog,
  buildCatalogOpsSummary,
  auditCompareSet,
} from "./catalogAudit.js";

export {
  FRESHNESS_THRESHOLDS,
  REVIEW_PRIORITY,
  VERIFICATION_STATUS,
} from "./constants.js";

export { needsHumanReview } from "./curationMetadata.js";

export { buildContentOpsSummary } from "./contentOpsAudit.js";

export { runIngestionPipeline } from "./ingestion/runIngestionPipeline.js";
