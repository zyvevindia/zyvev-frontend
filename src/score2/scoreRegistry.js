/**
 * EVSavari Score 2.0 — vehicle profile registry.
 *
 * Profiles are generated lazily from catalog intelligence via
 * {@link buildVehicleScoreProfile}. Nothing is stored as static JSON.
 */

import { loadIntelligenceCarForSlug } from "./loadIntelligenceCar.js";
import { materializeVehicleScoreProfile } from "./materializeVehicleScoreProfile.js";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";

/** @type {Map<string, import("./types.js").VehicleScoreProfile>} */
const vehicleScoreProfiles = new Map();

/** @type {boolean} */
let tier1Preloaded = false;

/**
 * @param {string} slug
 * @returns {import("./types.js").VehicleScoreProfile|null}
 */
export function getVehicleScoreProfile(slug) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  if (vehicleScoreProfiles.has(key)) {
    return vehicleScoreProfiles.get(key) || null;
  }

  const loaded = loadIntelligenceCarForSlug(key);
  if (!loaded) {
    vehicleScoreProfiles.set(key, null);
    return null;
  }

  const profile = materializeVehicleScoreProfile(key, loaded);

  vehicleScoreProfiles.set(key, profile);
  return profile;
}

/**
 * @returns {import("./types.js").VehicleScoreProfile[]}
 */
export function listVehicleScoreProfiles() {
  if (!tier1Preloaded) {
    tier1Preloaded = true;
    for (const familySlug of TIER1_MODEL_FAMILY_SLUGS) {
      getVehicleScoreProfile(familySlug);
    }
  }

  return [...vehicleScoreProfiles.values()].filter(Boolean);
}
