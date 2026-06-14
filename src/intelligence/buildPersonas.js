import { scoreVehicle } from "../scoring/scoreEngine.js";
import { buildRecommendationContext } from "./buildRecommendationEngine.js";
import {
  PERSONA_LIMITS,
  PERSONA_RULES,
} from "./personaRules.js";
import { applyRecommendationRules } from "./recommendationRules.js";

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function coalesce(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function resolveStartingPrice(vehicle) {
  const direct = parseNumber(
    coalesce(
      vehicle?.startingPrice,
      vehicle?.price,
      vehicle?.catalogMeta?.startingPrice,
      vehicle?.catalogMeta?.exShowroomPrice
    )
  );
  if (direct != null) return direct;

  const variantPrices = (vehicle?.variants || [])
    .map((variant) => parseNumber(variant?.priceInr ?? variant?.price))
    .filter((price) => price != null);

  if (variantPrices.length === 0) return null;
  return Math.min(...variantPrices);
}

function resolvePremiumScore(vehicle) {
  const existing = parseNumber(
    vehicle?.evSavariScores?.breakdown?.premium?.score
  );
  if (existing != null) return existing;

  try {
    const scored = scoreVehicle(vehicle, { variants: vehicle?.variants });
    return parseNumber(scored?.breakdown?.premium?.score);
  } catch {
    return null;
  }
}

/**
 * Build normalized persona context from intelligence scores.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").PersonaContext>} [options]
 * @returns {import("./types.js").PersonaContext}
 */
export function buildPersonaContext(vehicle, options = {}) {
  const recommendationCtx = buildRecommendationContext(vehicle, options);

  return {
    ...recommendationCtx,
    premiumScore:
      parseNumber(options.premiumScore) ?? resolvePremiumScore(vehicle),
    startingPrice:
      parseNumber(options.startingPrice) ?? resolveStartingPrice(vehicle),
  };
}

/**
 * Classify an EV into human-understandable persona labels.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").PersonaContext>} [options]
 * @returns {import("./types.js").PersonaEngineResult}
 */
export function buildPersonas(vehicle, options = {}) {
  const ctx = buildPersonaContext(vehicle, options);

  const personas = applyRecommendationRules(
    PERSONA_RULES,
    ctx,
    PERSONA_LIMITS.maxPersonas
  );

  return { personas };
}
