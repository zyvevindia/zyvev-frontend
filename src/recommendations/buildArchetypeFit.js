/**
 * Deterministic buyer archetype ↔ vehicle fit engine.
 *
 * Reads Score 2.0 profiles and intelligence cars read-only.
 * Does not modify score calculation, calibration, or intelligence sources.
 */

import { CONFIDENCE_LEVELS, SCORE_TIERS } from "../score2/constants.js";
import {
  isTierAtLeast,
  tierRank,
} from "../score2/scoreTierMapping.js";
import { BUYER_ARCHETYPE_IDS } from "./constants.js";
import {
  ARCHETYPE_PERSONA_CONSTRAINTS,
  ARCHETYPE_PRIMARY_DIMENSIONS,
  FIT_CONFIDENCE,
  FIT_TIER_ORDER,
  FIT_TIERS,
} from "./fitConstants.js";

/**
 * @typedef {import("./fitConstants.js").FitTier} FitTier
 * @typedef {import("./fitConstants.js").FitConfidence} FitConfidence
 * @typedef {import("./fitConstants.js").FitDimensionRef} FitDimensionRef
 *
 * @typedef {{
 *   fitTier: FitTier,
 *   reasons: string[],
 *   cautions: string[],
 *   confidence: FitConfidence,
 * }} ArchetypeFitResult
 */

const MIN_REASONS = 2;
const MAX_REASONS = 4;
const MAX_CAUTIONS = 2;

/** @type {Record<FitTier, string>} */
const TIER_REASON_PHRASES = Object.freeze({
  [SCORE_TIERS.EXCELLENT]: "Strong alignment",
  [SCORE_TIERS.GOOD]: "Solid alignment",
  [SCORE_TIERS.MODERATE]: "Partial alignment",
  [SCORE_TIERS.LIMITED]: "Limited alignment",
  [SCORE_TIERS.INSUFFICIENT]: "Poor alignment",
});

/** @type {Record<string, string>} */
const DIMENSION_REASON_PHRASES = Object.freeze({
  ownership: "Low running costs and sensible ownership economics",
  value: "Strong purchase value for cost-conscious buyers",
  cityBuyer: "Well suited to predictable urban commuting",
  family: "Strong family practicality",
  service: "Broad service support",
  highway: "Confident highway and long-distance usability",
  charging: "Practical charging for everyday use",
  premiumBuyer: "Premium comfort and refinement",
  familyBuyer: "Dependable fit for family-focused buyers",
  highwayBuyer: "Dependable fit for regular highway travel",
  budgetBuyer: "Sensible economics for budget-focused buyers",
});

/** @type {Record<string, string>} */
const DIMENSION_CAUTION_PHRASES = Object.freeze({
  ownership: "Ownership economics may not suit every budget",
  value: "Purchase price may feel high for value-focused buyers",
  cityBuyer: "City usability is not its strongest suit",
  family: "Family practicality is limited",
  service: "Service support may feel narrow in some regions",
  highway: "Long-distance highway use needs careful planning",
  charging: "Charging convenience may require extra planning",
  premiumBuyer: "Premium appeal is limited",
  familyBuyer: "Family practicality is limited",
  highwayBuyer: "Regular highway travel is not recommended",
  budgetBuyer: "Purchase and ownership costs may feel steep",
});

/**
 * @param {number} rank
 * @returns {FitTier}
 */
function rankToTier(rank) {
  const index = Math.max(0, Math.min(FIT_TIER_ORDER.length - 1, Math.round(rank)));
  return FIT_TIER_ORDER[index];
}

/**
 * @param {FitTier[]} tiers
 * @returns {FitTier}
 */
function minTier(tiers) {
  if (!tiers.length) return FIT_TIERS.INSUFFICIENT;

  return tiers.reduce((lowest, tier) =>
    tierRank(tier) < tierRank(lowest) ? tier : lowest
  );
}

/**
 * @param {FitTier[]} tiers
 * @returns {number}
 */
function averageTierRank(tiers) {
  if (!tiers.length) return tierRank(FIT_TIERS.INSUFFICIENT);

  const total = tiers.reduce((sum, tier) => sum + tierRank(tier), 0);
  return total / tiers.length;
}

/**
 * @param {import("../score2/types.js").VehicleScoreProfile} profile
 * @param {FitDimensionRef} dimension
 * @returns {FitTier}
 */
function readDimensionTier(profile, dimension) {
  if (dimension.kind === "score") {
    return profile.score[dimension.key] || FIT_TIERS.INSUFFICIENT;
  }

  return profile.recommendation[dimension.key] || FIT_TIERS.INSUFFICIENT;
}

/**
 * @param {import("../score2/types.js").VehicleScoreProfile} profile
 * @param {FitDimensionRef} dimension
 * @returns {import("../score2/constants.js").ConfidenceLevel}
 */
function readDimensionConfidence(profile, dimension) {
  if (dimension.kind === "score") {
    return profile.confidence[dimension.key] || CONFIDENCE_LEVELS.ESTIMATED;
  }

  return profile.confidence.overall || CONFIDENCE_LEVELS.ESTIMATED;
}

/**
 * @param {FitTier} tier
 * @param {import("../score2/constants.js").ConfidenceLevel} confidence
 * @param {{ chargingCritical?: boolean }} [options]
 * @returns {FitTier}
 */
function effectiveTierForAggregation(tier, confidence, options = {}) {
  if (tier !== FIT_TIERS.INSUFFICIENT) {
    return tier;
  }

  if (options.personaPremium) {
    return FIT_TIERS.LIMITED;
  }

  if (options.chargingCritical) {
    return FIT_TIERS.MODERATE;
  }

  if (confidence === CONFIDENCE_LEVELS.VERIFIED) {
    return FIT_TIERS.INSUFFICIENT;
  }

  return FIT_TIERS.MODERATE;
}

/**
 * @param {import("./types.js").BuyerArchetype} archetype
 * @param {import("../score2/types.js").VehicleScoreProfile} profile
 * @param {FitDimensionRef[]} dimensions
 * @param {FitTier[]} effectiveTiers
 * @returns {FitTier}
 */
function deriveFitTier(archetype, profile, dimensions, effectiveTiers) {
  const archetypeId = archetype.id;
  const personaKey = ARCHETYPE_PERSONA_CONSTRAINTS[archetypeId];
  const personaTier = personaKey
    ? profile.recommendation[personaKey] || FIT_TIERS.INSUFFICIENT
    : null;

  let fitTier = rankToTier(averageTierRank(effectiveTiers));

  if (archetypeId === BUYER_ARCHETYPE_IDS.CITY_COMMUTER) {
    const weightedRank =
      (tierRank(profile.score.ownership) * 2 +
        tierRank(profile.score.value) * 2 +
        tierRank(profile.recommendation.cityBuyer)) /
      5;
    fitTier = rankToTier(weightedRank);
  } else if (
    personaTier &&
    archetypeId !== BUYER_ARCHETYPE_IDS.PREMIUM_BUYER &&
    archetypeId !== BUYER_ARCHETYPE_IDS.BUDGET_BUYER
  ) {
    fitTier = minTier([fitTier, personaTier]);
  }

  if (archetypeId === BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER) {
    const highwayTier = readDimensionTier(profile, dimensions[0]);
    if (
      highwayTier === FIT_TIERS.LIMITED ||
      highwayTier === FIT_TIERS.INSUFFICIENT
    ) {
      fitTier = FIT_TIERS.INSUFFICIENT;
    } else if (personaTier === FIT_TIERS.INSUFFICIENT) {
      fitTier = minTier([fitTier, FIT_TIERS.LIMITED]);
    }
  }

  if (archetypeId === BUYER_ARCHETYPE_IDS.BUDGET_BUYER) {
    const valueTier = profile.score.value;
    const ownershipTier = profile.score.ownership;
    const budgetPersona = profile.recommendation.budgetBuyer;
    const weightedRank =
      (tierRank(valueTier) +
        tierRank(ownershipTier) +
        tierRank(budgetPersona) * 2) /
      4;
    fitTier = rankToTier(weightedRank);

    if (
      valueTier === FIT_TIERS.GOOD &&
      budgetPersona === FIT_TIERS.GOOD &&
      !isTierAtLeast(ownershipTier, FIT_TIERS.EXCELLENT)
    ) {
      fitTier = minTier([fitTier, FIT_TIERS.MODERATE]);
    }

    if (
      valueTier === FIT_TIERS.GOOD &&
      budgetPersona === FIT_TIERS.GOOD &&
      isTierAtLeast(ownershipTier, FIT_TIERS.EXCELLENT)
    ) {
      fitTier = minTier([fitTier, FIT_TIERS.MODERATE]);
    }

    fitTier = minTier([
      fitTier,
      budgetPersona === FIT_TIERS.INSUFFICIENT
        ? FIT_TIERS.LIMITED
        : budgetPersona,
    ]);
  }

  if (archetypeId === BUYER_ARCHETYPE_IDS.PREMIUM_BUYER) {
    const premiumTier = profile.recommendation.premiumBuyer;
    const normalizedPremium =
      premiumTier === FIT_TIERS.INSUFFICIENT
        ? FIT_TIERS.LIMITED
        : premiumTier;

    fitTier = minTier([fitTier, normalizedPremium]);
  }

  if (
    fitTier === FIT_TIERS.EXCELLENT &&
    profile.score.overall === FIT_TIERS.GOOD &&
    archetypeId !== BUYER_ARCHETYPE_IDS.PREMIUM_BUYER
  ) {
    fitTier = FIT_TIERS.GOOD;
  }

  if (
    archetypeId === BUYER_ARCHETYPE_IDS.APARTMENT_OWNER &&
    profile.score.charging === FIT_TIERS.INSUFFICIENT
  ) {
    fitTier = minTier([fitTier, FIT_TIERS.MODERATE]);
  }

  return fitTier;
}

/**
 * @param {string[]} phrases
 * @returns {string[]}
 */
function dedupePhrases(phrases = []) {
  const seen = new Set();
  const result = [];

  for (const phrase of phrases) {
    const cleaned = String(phrase || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {import("./types.js").BuyerArchetype} archetype
 * @param {import("../score2/types.js").VehicleScoreProfile} profile
 * @param {FitDimensionRef[]} dimensions
 * @param {FitTier[]} rawTiers
 * @returns {string[]}
 */
function buildReasons(archetype, profile, dimensions, rawTiers) {
  const phrases = [];
  const explanation = profile.explanation;

  for (let index = 0; index < dimensions.length; index += 1) {
    const dimension = dimensions[index];
    const tier = rawTiers[index];

    if (!isTierAtLeast(tier, FIT_TIERS.GOOD)) continue;

    const phrase = DIMENSION_REASON_PHRASES[dimension.key];
    if (phrase) phrases.push(phrase);
  }

  for (const strength of explanation.strengths || []) {
    phrases.push(strength);
  }

  if (archetype.id === BUYER_ARCHETYPE_IDS.FAMILY_BUYER) {
    if (isTierAtLeast(profile.score.family, FIT_TIERS.GOOD)) {
      phrases.push("Strong family practicality");
    }
    if (isTierAtLeast(profile.score.highway, FIT_TIERS.GOOD)) {
      phrases.push("Suitable for mixed city and highway usage");
    }
  }

  if (archetype.id === BUYER_ARCHETYPE_IDS.CITY_COMMUTER) {
    if (isTierAtLeast(profile.score.ownership, FIT_TIERS.GOOD)) {
      phrases.push("Low running costs for daily commuting");
    }
  }

  if (archetype.id === BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER) {
    if (isTierAtLeast(profile.score.highway, FIT_TIERS.GOOD)) {
      phrases.push("Dependable range for inter-city travel");
    }
  }

  if (archetype.id === BUYER_ARCHETYPE_IDS.PREMIUM_BUYER) {
    if (isTierAtLeast(profile.recommendation.premiumBuyer, FIT_TIERS.GOOD)) {
      phrases.push("Premium comfort and performance appeal");
    }
  }

  if (phrases.length < MIN_REASONS) {
    phrases.push(
      `${TIER_REASON_PHRASES[rawTiers[0] || FIT_TIERS.MODERATE]} with ${archetype.priority.toLowerCase()} priorities`
    );
  }

  void archetype;
  return dedupePhrases(phrases).slice(0, MAX_REASONS);
}

/**
 * @param {import("./types.js").BuyerArchetype} archetype
 * @param {import("../score2/types.js").VehicleScoreProfile} profile
 * @param {FitDimensionRef[]} dimensions
 * @param {FitTier[]} rawTiers
 * @returns {string[]}
 */
function buildCautions(archetype, profile, dimensions, rawTiers) {
  const phrases = [];

  for (let index = 0; index < dimensions.length; index += 1) {
    const dimension = dimensions[index];
    const tier = rawTiers[index];

    if (!isTierAtLeast(tier, FIT_TIERS.GOOD)) {
      const phrase = DIMENSION_CAUTION_PHRASES[dimension.key];
      if (phrase) phrases.push(phrase);
    }
  }

  for (const weakness of profile.explanation.weaknesses || []) {
    phrases.push(weakness);
  }

  if (
    archetype.id === BUYER_ARCHETYPE_IDS.PREMIUM_BUYER &&
    !isTierAtLeast(profile.recommendation.premiumBuyer, FIT_TIERS.GOOD)
  ) {
    phrases.push("Premium appeal is limited");
  }

  if (
    archetype.id === BUYER_ARCHETYPE_IDS.FAMILY_BUYER &&
    !isTierAtLeast(profile.score.family, FIT_TIERS.GOOD)
  ) {
    phrases.push("Family practicality is limited");
  }

  if (
    archetype.id === BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER &&
    !isTierAtLeast(profile.score.highway, FIT_TIERS.GOOD)
  ) {
    phrases.push("Long-distance usability remains limited");
  }

  return dedupePhrases(phrases).slice(0, MAX_CAUTIONS);
}

/**
 * @param {import("../score2/types.js").VehicleScoreProfile} profile
 * @param {FitDimensionRef[]} dimensions
 * @returns {FitConfidence}
 */
function deriveConfidence(profile, dimensions) {
  const levels = dimensions.map((dimension) =>
    readDimensionConfidence(profile, dimension)
  );

  const verifiedCount = levels.filter(
    (level) => level === CONFIDENCE_LEVELS.VERIFIED
  ).length;
  const estimatedCount = levels.filter(
    (level) => level === CONFIDENCE_LEVELS.ESTIMATED
  ).length;

  if (verifiedCount >= Math.ceil(dimensions.length * 0.6)) {
    return FIT_CONFIDENCE.HIGH;
  }

  if (estimatedCount >= Math.ceil(dimensions.length * 0.6)) {
    return FIT_CONFIDENCE.LOW;
  }

  return FIT_CONFIDENCE.MEDIUM;
}

/**
 * @param {{
 *   archetype: import("./types.js").BuyerArchetype|null|undefined,
 *   scoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   intelligenceCar?: object|null,
 * }} input
 * @returns {ArchetypeFitResult|null}
 */
export function buildArchetypeFit({
  archetype,
  scoreProfile,
  intelligenceCar = null,
}) {
  if (!archetype?.id || !scoreProfile) {
    return null;
  }

  const dimensions = ARCHETYPE_PRIMARY_DIMENSIONS[archetype.id];
  if (!dimensions?.length) {
    return null;
  }

  const rawTiers = dimensions.map((dimension) =>
    readDimensionTier(scoreProfile, dimension)
  );

  const chargingCritical =
    archetype.id === BUYER_ARCHETYPE_IDS.APARTMENT_OWNER ||
    archetype.id === BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER;

  const effectiveTiers = dimensions.map((dimension, index) =>
    effectiveTierForAggregation(
      rawTiers[index],
      readDimensionConfidence(scoreProfile, dimension),
      {
        chargingCritical:
          chargingCritical && dimension.key === "charging",
        personaPremium:
          dimension.kind === "persona" && dimension.key === "premiumBuyer",
      }
    )
  );

  const fitTier = deriveFitTier(
    archetype,
    scoreProfile,
    dimensions,
    effectiveTiers
  );

  void intelligenceCar;

  return {
    fitTier,
    reasons: buildReasons(archetype, scoreProfile, dimensions, rawTiers),
    cautions: buildCautions(archetype, scoreProfile, dimensions, rawTiers),
    confidence: deriveConfidence(scoreProfile, dimensions),
  };
}
