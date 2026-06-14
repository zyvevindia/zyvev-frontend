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
