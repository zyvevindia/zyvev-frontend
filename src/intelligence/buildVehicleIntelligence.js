import { buildChargingIntelligence } from "./chargingIntelligence.js";
import { buildChargingPracticality } from "./chargingPracticality.js";
import { buildFeatureMatrix } from "./featureMatrix.js";
import { buildOwnershipIntelligence } from "./ownershipIntelligence.js";
import { buildRangeConfidence } from "./rangeConfidence.js";
import { buildEvsavariScores } from "./scoringEngine.js";
import { scoreVehicle, toLegacyEvScores } from "../scoring/index.js";
import { buildSuitabilityInsights } from "./suitabilityInsights.js";
import {
  extractCurationMetadata,
  applyCurationToRange,
  applyCurationToChargingPracticality,
  needsHumanReview,
} from "./curationMetadata.js";
import { buildVehicleTrustBundle } from "./trustMetadata.js";
import { buildFreshnessMetadata } from "./freshnessMetadata.js";
import { buildChangeTransparency } from "./changeTransparency.js";
import { extractCatalogChangeLog } from "./changeDetection.js";
import {
  auditIntelligenceBundle,
  validateVehicleForIntelligence,
} from "./intelligenceValidation.js";

/**
 * Unified EV intelligence bundle for detail, compare, filters, and SEO.
 * @param {object} car
 */
export function buildVehicleIntelligence(car) {
  if (!car || typeof car !== "object") return null;

  const vehicleCheck = validateVehicleForIntelligence(car);
  if (!vehicleCheck.valid && !vehicleCheck.hasMinimalData) {
    return null;
  }

  const curation = extractCurationMetadata(car);
  const freshness = buildFreshnessMetadata(car);
  const transparency = buildChangeTransparency(car);
  const changeLog = extractCatalogChangeLog(car);

  const charging = buildChargingIntelligence(car);
  let range = buildRangeConfidence(car);
  range = applyCurationToRange(range, curation);

  const ownership = buildOwnershipIntelligence(car, charging);
  const features = buildFeatureMatrix(car);

  let chargingPracticality = buildChargingPracticality(car, charging);
  chargingPracticality = applyCurationToChargingPracticality(
    chargingPracticality,
    curation
  );

  const suitability = buildSuitabilityInsights(car, {
    charging,
    ownership,
    range,
    features,
  });

  const hasAnyData =
    charging.hasData ||
    range.hasData ||
    ownership.hasData ||
    features.hasData ||
    suitability.hasData ||
    chargingPracticality.hasData;

  if (!hasAnyData) return null;

  const partialBundle = {
    version: 3,
    charging,
    ownership,
    range,
    features,
    suitability,
    chargingPracticality,
    freshness,
    transparency,
    changeLog,
    hasAnyData,
  };

  const scores = buildEvsavariScores(car, partialBundle);
  const trust = buildVehicleTrustBundle(car, partialBundle, curation);
  const governance = auditIntelligenceBundle(partialBundle);

  return {
    version: 3,
    charging,
    ownership,
    range,
    features,
    suitability,
    chargingPracticality,
    freshness,
    transparency,
    changeLog,
    scores,
    trust,
    curation,
    governance,
    needsReview: needsHumanReview(curation, freshness),
    hasAnyData,
  };
}

/**
 * Attach intelligence to a car clone (non-mutating).
 */
export function withVehicleIntelligence(car) {
  if (!car) return car;
  const intelligence = buildVehicleIntelligence(car);
  const evSavariScores = scoreVehicle(car, { variants: car.variants });
  const v1Legacy = toLegacyEvScores(evSavariScores);

  if (!intelligence) {
    if (!v1Legacy?.hasData) return car;
    return {
      ...car,
      evSavariScores,
      evScores: v1Legacy,
    };
  }

  const {
    scores,
    trust,
    curation,
    governance,
    freshness,
    transparency,
    changeLog,
    needsReview,
    ...evIntelligence
  } = intelligence;

  return {
    ...car,
    evIntelligence,
    evSavariScores,
    evScores:
      v1Legacy ||
      scores ||
      buildEvsavariScores(car, evIntelligence),
    evTrust: trust,
    evGovernance: governance,
    evFreshness: freshness,
    evTransparency: transparency,
    evChangeLog: changeLog,
    evNeedsReview: needsReview,
  };
}
