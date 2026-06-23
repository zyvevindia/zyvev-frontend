import { buildConfidenceLabels } from "../intelligence/buildConfidenceLabels.js";
import { buildChargingPracticalityScore } from "../intelligence/buildChargingPracticalityScore.js";
import { buildFamilyScore } from "../intelligence/buildFamilyScore.js";
import { buildHighwayConfidenceScore } from "../intelligence/buildHighwayConfidenceScore.js";
import { buildOwnershipCostScore } from "../intelligence/buildOwnershipCostScore.js";
import {
  buildRecommendationContext,
  buildRecommendationEngine,
} from "../intelligence/buildRecommendationEngine.js";
import { buildPersonas, buildPersonaContext } from "../intelligence/buildPersonas.js";
import {
  buildScoreExplanation,
  buildScoreExplanationContext,
} from "../intelligence/buildScoreExplanation.js";
import { buildServiceNetworkScore } from "../intelligence/buildServiceNetworkScore.js";
import { CONFIDENCE_LABELS } from "../intelligence/confidenceRules.js";
import { PREMIUM_PRICE_THRESHOLD_INR } from "../intelligence/personaRules.js";
import { CONFIDENCE_LEVELS, SCORE_TIERS } from "./constants.js";
import { normalizeIntelligenceCar } from "./normalizeIntelligenceCar.js";
import {
  averageScoreToTier,
  bumpScoreTier,
  lowerScoreTier,
  numericScoreToTier,
} from "./scoreTierMapping.js";

/** @type {Record<string, string>} */
const BEST_FOR_FRIENDLY = {
  "City Driving": "Daily commuters",
  "Apartment Living": "Apartment owners",
  "First EV buyers": "First-time EV buyers",
  "Budget-conscious buyers": "Budget-conscious buyers",
  "Frequent highway travel": "Occasional highway drivers",
  "Long-distance touring": "Weekend getaways",
  "Value seekers": "Value-focused buyers",
  "Family use": "Small families",
};

/** @type {Record<string, string>} */
const AVOID_FOR_FRIENDLY = {
  "Frequent highway travel": "Frequent long-distance travel",
  "Long-distance touring": "Regular long-distance touring",
  "Large families": "Large families needing extra space",
  "Fast-charging priority": "Buyers needing the fastest charging",
  "Remote area travel": "Drivers far from charging networks",
};

/** @type {Record<string, string>} */
const SUMMARY_BY_PERSONA = {
  "City EV": "Excellent city EV with very low running costs and strong ownership economics.",
  "Value EV": "Great value EV with sensible everyday running costs.",
  "Highway EV": "Strong highway EV suited for inter-city travel.",
  "Long-distance EV": "Strong highway EV suited for inter-city travel.",
  "Family EV": "Balanced family EV with practical charging and usable space.",
  "Apartment EV": "Practical apartment EV with convenient home charging.",
  "First EV": "Well-rounded first EV with balanced everyday capability.",
  "Premium EV": "Premium everyday EV with confident ownership appeal.",
};

/**
 * @param {import("../intelligence/types.js").ConfidenceLabel|null|undefined} label
 * @returns {import("./constants.js").ConfidenceLevel}
 */
function mapIntelligenceConfidenceLabel(label) {
  if (label === CONFIDENCE_LABELS.VERIFIED || label === CONFIDENCE_LABELS.PARTIAL) {
    return CONFIDENCE_LEVELS.VERIFIED;
  }

  if (label === CONFIDENCE_LABELS.DIRECTIONAL) {
    return CONFIDENCE_LEVELS.EDITORIAL;
  }

  return CONFIDENCE_LEVELS.ESTIMATED;
}

/**
 * @param {object} vehicle
 * @returns {import("./types.js").EvSavariScore}
 */
function buildScoreLayer(vehicle) {
  const recommendationCtx = buildRecommendationContext(vehicle);
  const ownershipScore = buildOwnershipCostScore(vehicle).score;
  const chargingScore = buildChargingPracticalityScore(vehicle).score;
  const highwayScore = buildHighwayConfidenceScore(vehicle).score;
  const familyScore = buildFamilyScore(vehicle).score;
  const serviceScore = buildServiceNetworkScore(vehicle).score;
  const valueScore = recommendationCtx.valueScore;

  const dimensions = {
    ownership: numericScoreToTier(ownershipScore),
    charging: numericScoreToTier(chargingScore),
    highway: numericScoreToTier(highwayScore),
    family: numericScoreToTier(familyScore),
    service: numericScoreToTier(serviceScore),
    value: numericScoreToTier(valueScore),
  };

  const overallNumeric =
    recommendationCtx.overallScore ??
    (() => {
      const dimensionScores = [
        ownershipScore,
        chargingScore,
        highwayScore,
        familyScore,
        serviceScore,
        valueScore,
      ].filter((score) => score != null && Number.isFinite(Number(score)));

      if (!dimensionScores.length) return null;
      return (
        dimensionScores.reduce((sum, score) => sum + Number(score), 0) /
        dimensionScores.length
      );
    })();

  return {
    overall: numericScoreToTier(overallNumeric),
    ...dimensions,
  };
}

/**
 * @param {import("../intelligence/types.js").PersonaContext} personaCtx
 * @param {Set<string>} personas
 * @param {number|null|undefined} batteryKwh
 * @returns {import("./constants.js").ScoreTier}
 */
function buildCityBuyerTier(personaCtx, personas, batteryKwh) {
  const chargingScore =
    personaCtx.chargingPracticalityScore != null &&
    personaCtx.chargingPracticalityScore > 0
      ? personaCtx.chargingPracticalityScore
      : null;

  let cityBuyer = averageScoreToTier([
    personaCtx.cityScore,
    personaCtx.apartmentScore,
    chargingScore,
  ]);

  if (
    batteryKwh != null &&
    batteryKwh <= 20 &&
    (personaCtx.apartmentScore ?? 0) >= 55 &&
    (personaCtx.ownershipCostScore ?? 0) >= 80
  ) {
    cityBuyer = SCORE_TIERS.EXCELLENT;
  } else if (
    batteryKwh != null &&
    batteryKwh <= 20 &&
    (personaCtx.cityScore ?? 0) >= 50
  ) {
    cityBuyer = bumpScoreTier(cityBuyer, 2);
  }

  if (personas.has("City EV") || personas.has("Apartment EV")) {
    cityBuyer = bumpScoreTier(cityBuyer);
  }

  return cityBuyer;
}

/**
 * @param {import("../intelligence/types.js").PersonaContext} personaCtx
 * @param {Set<string>} personas
 * @param {number|null|undefined} startingPrice
 * @returns {import("./constants.js").ScoreTier}
 */
function buildPremiumBuyerTier(personaCtx, personas, startingPrice) {
  if (
    personas.has("Premium EV") &&
    startingPrice != null &&
    startingPrice >= PREMIUM_PRICE_THRESHOLD_INR
  ) {
    return SCORE_TIERS.EXCELLENT;
  }

  let premiumBuyer = numericScoreToTier(personaCtx.premiumScore);

  if (personas.has("Premium EV")) {
    premiumBuyer = bumpScoreTier(premiumBuyer, 2);
  }

  if (startingPrice != null && startingPrice >= PREMIUM_PRICE_THRESHOLD_INR) {
    premiumBuyer = bumpScoreTier(premiumBuyer);
  }

  if (startingPrice != null && startingPrice < 1_000_000) {
    premiumBuyer = SCORE_TIERS.INSUFFICIENT;
  } else if (
    startingPrice != null &&
    startingPrice < 1_500_000 &&
    !personas.has("Premium EV")
  ) {
    premiumBuyer = lowerScoreTier(premiumBuyer, 2);
  }

  return premiumBuyer;
}

/**
 * @param {object} vehicle
 * @param {import("../intelligence/types.js").PersonaContext} personaCtx
 * @param {Set<string>} personas
 * @returns {import("./types.js").RecommendationProfile}
 */
function buildRecommendationLayer(vehicle, personaCtx, personas) {
  const scoreCtx = buildScoreExplanationContext(vehicle);
  const batteryKwh = scoreCtx.batteryKwh;
  const startingPrice = personaCtx.startingPrice;

  const cityBuyer = buildCityBuyerTier(personaCtx, personas, batteryKwh);

  let familyBuyer = numericScoreToTier(buildFamilyScore(vehicle).score);
  if (personas.has("Family EV")) {
    familyBuyer = bumpScoreTier(familyBuyer);
  }

  let highwayBuyer = numericScoreToTier(
    personaCtx.highwayPersonaScore ?? personaCtx.highwayConfidenceScore
  );

  if (personas.has("Highway EV") || personas.has("Long-distance EV")) {
    highwayBuyer = bumpScoreTier(highwayBuyer);
  }

  if (batteryKwh != null && batteryKwh < 20) {
    highwayBuyer = SCORE_TIERS.INSUFFICIENT;
  } else if (
    personaCtx.highwayPlanningRangeKm != null &&
    personaCtx.highwayPlanningRangeKm < 180
  ) {
    highwayBuyer = lowerScoreTier(highwayBuyer);
  }

  let budgetBuyer = averageScoreToTier([
    personaCtx.ownershipCostScore,
    personaCtx.valueScore,
  ]);

  if (
    startingPrice != null &&
    startingPrice <= 1_000_000 &&
    (personaCtx.ownershipCostScore ?? 0) >= 60
  ) {
    budgetBuyer = SCORE_TIERS.EXCELLENT;
  } else if (personas.has("Value EV")) {
    budgetBuyer = bumpScoreTier(budgetBuyer);
  }

  if (startingPrice != null && startingPrice >= PREMIUM_PRICE_THRESHOLD_INR) {
    budgetBuyer = SCORE_TIERS.LIMITED;
  } else if (startingPrice != null && startingPrice > 2_500_000) {
    budgetBuyer = lowerScoreTier(budgetBuyer, 2);
  }

  const premiumBuyer = buildPremiumBuyerTier(
    personaCtx,
    personas,
    startingPrice
  );

  return {
    cityBuyer,
    familyBuyer,
    highwayBuyer,
    budgetBuyer,
    premiumBuyer,
  };
}

/**
 * @param {object} vehicle
 * @returns {import("./types.js").ConfidenceProfile}
 */
function buildConfidenceLayer(vehicle) {
  const labels = buildConfidenceLabels(vehicle);
  const scoreCtx = buildScoreExplanationContext(vehicle);

  const valueConfidence = scoreCtx.hasScoreData
    ? mapIntelligenceConfidenceLabel(labels.overall)
    : CONFIDENCE_LEVELS.ESTIMATED;

  return {
    overall: mapIntelligenceConfidenceLabel(labels.overall),
    ownership: mapIntelligenceConfidenceLabel(labels.ownership),
    charging: mapIntelligenceConfidenceLabel(labels.chargingPracticality),
    highway: mapIntelligenceConfidenceLabel(labels.highwayConfidence),
    family: mapIntelligenceConfidenceLabel(labels.familySuitability),
    service: mapIntelligenceConfidenceLabel(labels.serviceNetwork),
    value: valueConfidence,
  };
}

/**
 * @param {string[]} labels
 * @param {Record<string, string>} friendlyMap
 * @param {number} [limit=4]
 * @returns {string[]}
 */
function mapFriendlyLabels(labels = [], friendlyMap = {}, limit = 4) {
  const seen = new Set();
  const mapped = [];

  for (const label of labels) {
    const friendly = friendlyMap[label] || label;
    const key = friendly.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push(friendly);
    if (mapped.length >= limit) break;
  }

  return mapped;
}

/**
 * @param {object} vehicle
 * @param {import("./types.js").EvSavariScore} score
 * @param {import("./types.js").RecommendationProfile} recommendation
 * @param {string[]} personaLabels
 * @returns {string}
 */
function buildSummary(vehicle, score, recommendation, personaLabels) {
  for (const persona of personaLabels) {
    const summary = SUMMARY_BY_PERSONA[persona];
    if (summary) return summary;
  }

  if (
    recommendation.cityBuyer === SCORE_TIERS.EXCELLENT &&
    recommendation.budgetBuyer === SCORE_TIERS.EXCELLENT
  ) {
    return "Excellent city EV with very low running costs and strong ownership economics.";
  }

  if (recommendation.highwayBuyer === SCORE_TIERS.EXCELLENT) {
    return "Strong highway EV with confident long-distance usability.";
  }

  if (recommendation.premiumBuyer === SCORE_TIERS.EXCELLENT) {
    return "Premium everyday EV with confident ownership appeal.";
  }

  const displayName =
    vehicle.name ||
    vehicle.displayName ||
    vehicle.familyName ||
    vehicle.familySlug ||
    "This EV";

  if (score.overall === SCORE_TIERS.EXCELLENT) {
    return `${displayName} is a strong all-round EV for everyday Indian ownership.`;
  }

  if (score.overall === SCORE_TIERS.GOOD) {
    return `${displayName} offers balanced EV ownership with clear everyday strengths.`;
  }

  return `${displayName} suits focused use cases with trade-offs buyers should weigh carefully.`;
}

/**
 * @param {object} vehicle
 * @param {import("./types.js").EvSavariScore} score
 * @param {import("./types.js").RecommendationProfile} recommendation
 * @param {import("../intelligence/types.js").RecommendationEngineResult} recommendationEngine
 * @param {string[]} personaLabels
 * @returns {import("./types.js").ScoreExplanation}
 */
function buildExplanationLayer(
  vehicle,
  score,
  recommendation,
  recommendationEngine,
  personaLabels
) {
  const explanationIntel = buildScoreExplanation(vehicle);

  return {
    strengths: (explanationIntel.strengths || []).slice(0, 4),
    weaknesses: (explanationIntel.weaknesses || []).slice(0, 3),
    bestFor: mapFriendlyLabels(recommendationEngine.bestFor, BEST_FOR_FRIENDLY),
    avoidIf: mapFriendlyLabels(recommendationEngine.avoidFor, AVOID_FOR_FRIENDLY, 3),
    summary: buildSummary(vehicle, score, recommendation, personaLabels),
  };
}

/**
 * Build the four Score 2.0 layers for one vehicle family.
 *
 * @param {{
 *   slug?: string,
 *   intelligenceCar?: object|null,
 *   variants?: object[],
 * }} params
 * @returns {{
 *   score: import("./types.js").EvSavariScore,
 *   recommendation: import("./types.js").RecommendationProfile,
 *   confidence: import("./types.js").ConfidenceProfile,
 *   explanation: import("./types.js").ScoreExplanation,
 * }}
 */
export function buildVehicleScoreProfile({
  slug = "",
  intelligenceCar = null,
  variants = [],
} = {}) {
  const vehicle = normalizeIntelligenceCar({
    slug,
    intelligenceCar,
    variants,
  });

  const personaCtx = buildPersonaContext(vehicle);
  const personaResult = buildPersonas(vehicle);
  const personaLabels = personaResult.personas || [];
  const personas = new Set(personaLabels);
  const recommendationEngine = buildRecommendationEngine(vehicle);

  const score = buildScoreLayer(vehicle);
  const recommendation = buildRecommendationLayer(vehicle, personaCtx, personas);
  const confidence = buildConfidenceLayer(vehicle);
  const explanation = buildExplanationLayer(
    vehicle,
    score,
    recommendation,
    recommendationEngine,
    personaLabels
  );

  return {
    score,
    recommendation,
    confidence,
    explanation,
  };
}
