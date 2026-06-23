/**
 * Lazy recommendation narrative registry.
 *
 * Narratives materialize on first lookup from fit results and score profiles.
 * Nothing is stored as static JSON.
 */

import { loadIntelligenceCarForSlug } from "../score2/loadIntelligenceCar.js";
import { getVehicleScoreProfile } from "../score2/scoreRegistry.js";
import { buildRecommendationNarrative } from "./buildRecommendationNarrative.js";
import { getArchetypeFit } from "./fitRegistry.js";
import { getBuyerArchetype } from "./archetypeRegistry.js";
import { BUYER_ARCHETYPE_ID_LIST } from "./constants.js";

/** @type {Map<string, import("./buildRecommendationNarrative.js").RecommendationNarrative|null>} */
const narrativesByKey = new Map();

/**
 * @param {string} archetypeId
 * @param {string} slug
 * @returns {string}
 */
function narrativeCacheKey(archetypeId, slug) {
  return `${String(slug || "").trim().toLowerCase()}::${String(archetypeId || "").trim().toLowerCase()}`;
}

/**
 * @param {string} archetypeId
 * @param {string} slug
 * @returns {import("./buildRecommendationNarrative.js").RecommendationNarrative|null}
 */
export function getRecommendationNarrative(archetypeId, slug) {
  const key = narrativeCacheKey(archetypeId, slug);
  if (narrativesByKey.has(key)) {
    return narrativesByKey.get(key) || null;
  }

  const archetype = getBuyerArchetype(archetypeId);
  const vehicleSlug = String(slug || "").trim().toLowerCase();
  const fitResult = getArchetypeFit(archetypeId, vehicleSlug);
  const scoreProfile = vehicleSlug ? getVehicleScoreProfile(vehicleSlug) : null;
  const intelligenceCar = vehicleSlug
    ? loadIntelligenceCarForSlug(vehicleSlug)
    : null;

  if (!archetype || !fitResult || !scoreProfile) {
    narrativesByKey.set(key, null);
    return null;
  }

  const narrative = buildRecommendationNarrative({
    archetype,
    fitResult,
    scoreProfile,
    intelligenceCar,
  });

  narrativesByKey.set(key, narrative);
  return narrative;
}

/**
 * @param {string} slug
 * @returns {Array<{
 *   archetypeId: string,
 *   archetype: import("./types.js").BuyerArchetype,
 *   fit: import("./buildArchetypeFit.js").ArchetypeFitResult,
 *   narrative: import("./buildRecommendationNarrative.js").RecommendationNarrative,
 * }>}
 */
export function listVehicleRecommendations(slug) {
  const vehicleSlug = String(slug || "").trim().toLowerCase();
  if (!vehicleSlug) return [];

  return BUYER_ARCHETYPE_ID_LIST.map((archetypeId) => {
    const archetype = getBuyerArchetype(archetypeId);
    const fit = getArchetypeFit(archetypeId, vehicleSlug);
    const narrative = getRecommendationNarrative(archetypeId, vehicleSlug);

    if (!archetype || !fit || !narrative) {
      return null;
    }

    return {
      archetypeId,
      archetype,
      fit,
      narrative,
    };
  }).filter(Boolean);
}
