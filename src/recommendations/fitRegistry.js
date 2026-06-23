/**
 * Lazy buyer fit registry.
 *
 * Profiles materialize on first lookup from Score 2.0 + archetype definitions.
 * Nothing is stored as static JSON.
 */

import { loadIntelligenceCarForSlug } from "../score2/loadIntelligenceCar.js";
import { getVehicleScoreProfile } from "../score2/scoreRegistry.js";
import { buildArchetypeFit } from "./buildArchetypeFit.js";
import { getBuyerArchetype } from "./archetypeRegistry.js";
import { BUYER_ARCHETYPE_ID_LIST } from "./constants.js";

/** @type {Map<string, import("./buildArchetypeFit.js").ArchetypeFitResult|null>} */
const fitResultsByKey = new Map();

/**
 * @param {string} archetypeId
 * @param {string} slug
 * @returns {string}
 */
function fitCacheKey(archetypeId, slug) {
  return `${String(slug || "").trim().toLowerCase()}::${String(archetypeId || "").trim().toLowerCase()}`;
}

/**
 * @param {string} archetypeId
 * @param {string} slug
 * @returns {import("./buildArchetypeFit.js").ArchetypeFitResult|null}
 */
export function getArchetypeFit(archetypeId, slug) {
  const key = fitCacheKey(archetypeId, slug);
  if (fitResultsByKey.has(key)) {
    return fitResultsByKey.get(key) || null;
  }

  const archetype = getBuyerArchetype(archetypeId);
  const vehicleSlug = String(slug || "").trim().toLowerCase();
  const scoreProfile = vehicleSlug ? getVehicleScoreProfile(vehicleSlug) : null;
  const intelligenceCar = vehicleSlug
    ? loadIntelligenceCarForSlug(vehicleSlug)
    : null;

  if (!archetype || !scoreProfile) {
    fitResultsByKey.set(key, null);
    return null;
  }

  const fit = buildArchetypeFit({
    archetype,
    scoreProfile,
    intelligenceCar,
  });

  fitResultsByKey.set(key, fit);
  return fit;
}

/**
 * @param {string} slug
 * @returns {Array<{
 *   archetypeId: string,
 *   archetype: import("./types.js").BuyerArchetype,
 *   fit: import("./buildArchetypeFit.js").ArchetypeFitResult,
 * }>}
 */
export function listVehicleFits(slug) {
  const vehicleSlug = String(slug || "").trim().toLowerCase();
  if (!vehicleSlug) return [];

  return BUYER_ARCHETYPE_ID_LIST.map((archetypeId) => {
    const archetype = getBuyerArchetype(archetypeId);
    const fit = getArchetypeFit(archetypeId, vehicleSlug);

    if (!archetype || !fit) {
      return null;
    }

    return {
      archetypeId,
      archetype,
      fit,
    };
  }).filter(Boolean);
}
