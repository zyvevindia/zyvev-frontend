/**
 * Browser-safe async Score 2.0 registry lookup.
 */

import { loadIntelligenceCarForSlugAsync } from "./loadIntelligenceCarBrowser.js";
import { materializeVehicleScoreProfile } from "./materializeVehicleScoreProfile.js";

/** @type {Map<string, import("./types.js").VehicleScoreProfile|null>} */
const vehicleScoreProfiles = new Map();

/** @type {Map<string, Promise<import("./types.js").VehicleScoreProfile|null>>} */
const pendingProfiles = new Map();

/**
 * @param {string} slug
 * @returns {Promise<import("./types.js").VehicleScoreProfile|null>}
 */
export async function getVehicleScoreProfileAsync(slug) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  if (vehicleScoreProfiles.has(key)) {
    return vehicleScoreProfiles.get(key) || null;
  }

  if (pendingProfiles.has(key)) {
    return pendingProfiles.get(key);
  }

  const promise = (async () => {
    const loaded = await loadIntelligenceCarForSlugAsync(key);
    if (!loaded) {
      vehicleScoreProfiles.set(key, null);
      return null;
    }

    const profile = materializeVehicleScoreProfile(key, loaded);
    vehicleScoreProfiles.set(key, profile);
    return profile;
  })();

  pendingProfiles.set(key, promise);

  try {
    return await promise;
  } finally {
    pendingProfiles.delete(key);
  }
}
