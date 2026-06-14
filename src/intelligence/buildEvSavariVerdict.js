import { buildApartmentScore } from "./buildApartmentScore.js";
import { buildFamilyScore } from "./buildFamilyScore.js";
import { buildHighwayConfidenceScore } from "./buildHighwayConfidenceScore.js";
import { buildOwnershipCostScore } from "./buildOwnershipCostScore.js";
import { buildPersonas, buildPersonaContext } from "./buildPersonas.js";
import { buildRecommendationEngine } from "./buildRecommendationEngine.js";
import {
  buildVerdictSummary,
  resolveVerdictHeadline,
  VERDICT_HEADLINE_RULES,
} from "./evSavariVerdictRules.js";

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function scoreAtLeast(score, threshold) {
  const n = parseNumber(score);
  return n != null && n >= threshold;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {import("./types.js").VerdictContext}
 */
export function buildVerdictContext(vehicle) {
  const personas = buildPersonas(vehicle).personas || [];
  const personaSet = new Set(personas);
  const recommendation = buildRecommendationEngine(vehicle);
  const ownershipScore = buildOwnershipCostScore(vehicle).score;
  const highwayScore = buildHighwayConfidenceScore(vehicle).score;
  const apartmentScore = buildApartmentScore(vehicle).score;
  const familyScore = buildFamilyScore(vehicle).score;
  const personaCtx = buildPersonaContext(vehicle);

  const avoidFor = recommendation.avoidFor || [];

  return {
    personas,
    bestFor: recommendation.bestFor || [],
    avoidFor,
    hasPersona: (label) => personaSet.has(label),
    excellentOwnership: scoreAtLeast(ownershipScore, 80),
    goodOwnership: scoreAtLeast(ownershipScore, 65),
    strongHighway: scoreAtLeast(highwayScore, 80),
    moderateHighway:
      scoreAtLeast(highwayScore, 50) && !scoreAtLeast(highwayScore, 80),
    weakHighway:
      highwayScore != null && parseNumber(highwayScore) < 50,
    strongApartment: scoreAtLeast(apartmentScore, 75),
    strongFamily: scoreAtLeast(familyScore, 75),
    strongCity: scoreAtLeast(personaCtx.cityScore, 80),
    avoidsHighway: avoidFor.some((label) =>
      /highway/i.test(String(label))
    ),
    avoidsRemote: avoidFor.some((label) =>
      /remote/i.test(String(label))
    ),
  };
}

/**
 * Build EVSavari's natural-language advisor verdict.
 * @param {object|null|undefined} vehicle
 * @returns {import("./types.js").EvSavariVerdictResult}
 */
export function buildEvSavariVerdict(vehicle) {
  if (!vehicle || typeof vehicle !== "object") {
    return { headline: null, summary: null };
  }

  const ctx = buildVerdictContext(vehicle);
  const headline = resolveVerdictHeadline(VERDICT_HEADLINE_RULES, ctx);
  const summary = buildVerdictSummary(ctx);

  return {
    headline,
    summary,
  };
}
