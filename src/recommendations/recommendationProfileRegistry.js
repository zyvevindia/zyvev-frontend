/**
 * Lazy vehicle recommendation profile registry.
 *
 * Profiles, top-fit selection, guidance, and explanations materialize on lookup.
 * Nothing is stored as static JSON.
 */

import { loadIntelligenceCarForSlug } from "../score2/loadIntelligenceCar.js";
import { getVehicleScoreProfile } from "../score2/scoreRegistry.js";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import {
  buildVehicleRecommendationProfiles,
  listProfilesFromMap,
} from "./buildVehicleRecommendationProfiles.js";
import {
  buildWhoShouldBuyThis,
  buildWhoShouldLookElsewhere,
} from "./buildBuyerGuidance.js";
import { buildRecommendationExplanation } from "./buildRecommendationExplanation.js";
import { selectTopArchetypes } from "./selectTopArchetypes.js";

/** @type {Map<string, VehicleRecommendationBundle|null>} */
const recommendationBundlesBySlug = new Map();

/** @type {boolean} */
let tier1Preloaded = false;

/**
 * @typedef {import("./buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap} VehicleRecommendationProfileMap
 * @typedef {import("./selectTopArchetypes.js").TopArchetypeSelection} TopArchetypeSelection
 * @typedef {import("./buildRecommendationExplanation.js").RecommendationExplanation} RecommendationExplanation
 *
 * @typedef {{
 *   vehicleSlug: string,
 *   profiles: VehicleRecommendationProfileMap,
 *   topFits: TopArchetypeSelection["topFits"],
 *   secondaryFits: TopArchetypeSelection["secondaryFits"],
 *   weakFits: TopArchetypeSelection["weakFits"],
 *   whoShouldBuy: string[],
 *   whoShouldLookElsewhere: string[],
 *   explanation: RecommendationExplanation,
 * }} VehicleRecommendationBundle
 */

/**
 * @param {string} slug
 * @returns {VehicleRecommendationBundle|null}
 */
function materializeVehicleRecommendationBundle(slug) {
  const vehicleSlug = String(slug || "").trim().toLowerCase();
  if (!vehicleSlug) return null;

  const scoreProfile = getVehicleScoreProfile(vehicleSlug);
  if (!scoreProfile) return null;

  const intelligenceCar = loadIntelligenceCarForSlug(vehicleSlug);
  const profiles = buildVehicleRecommendationProfiles({
    scoreProfile,
    intelligenceCar,
  });
  const profileList = listProfilesFromMap(profiles);
  const selection = selectTopArchetypes(profileList);

  return {
    vehicleSlug,
    profiles,
    topFits: selection.topFits,
    secondaryFits: selection.secondaryFits,
    weakFits: selection.weakFits,
    whoShouldBuy: buildWhoShouldBuyThis(profileList, selection, scoreProfile),
    whoShouldLookElsewhere: buildWhoShouldLookElsewhere(
      profileList,
      selection,
      scoreProfile
    ),
    explanation: buildRecommendationExplanation(
      profileList,
      selection,
      scoreProfile,
      intelligenceCar
    ),
  };
}

/**
 * @param {string} slug
 * @returns {VehicleRecommendationBundle|null}
 */
export function getVehicleRecommendationProfiles(slug) {
  const vehicleSlug = String(slug || "").trim().toLowerCase();
  if (!vehicleSlug) return null;

  if (recommendationBundlesBySlug.has(vehicleSlug)) {
    return recommendationBundlesBySlug.get(vehicleSlug) || null;
  }

  const bundle = materializeVehicleRecommendationBundle(vehicleSlug);
  recommendationBundlesBySlug.set(vehicleSlug, bundle);
  return bundle;
}

/**
 * @returns {VehicleRecommendationBundle[]}
 */
export function listVehicleRecommendationProfiles() {
  if (!tier1Preloaded) {
    tier1Preloaded = true;
    for (const familySlug of TIER1_MODEL_FAMILY_SLUGS) {
      getVehicleRecommendationProfiles(familySlug);
    }
  }

  return [...recommendationBundlesBySlug.values()].filter(Boolean);
}
