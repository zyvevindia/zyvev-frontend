/**
 * EVSavari Score 2.0 — vehicle profile registry.
 *
 * Stores pre-built {@link import("./types.js").VehicleScoreProfile} documents.
 * Empty at foundation phase; population arrives in later Phase 14 work.
 */

/** @type {Map<string, import("./types.js").VehicleScoreProfile>} */
const vehicleScoreProfiles = new Map();

/**
 * @param {string} slug Profile slug or vehicle slug lookup key
 * @returns {import("./types.js").VehicleScoreProfile|null}
 */
export function getVehicleScoreProfile(slug) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;
  return vehicleScoreProfiles.get(key) || null;
}

/**
 * @returns {import("./types.js").VehicleScoreProfile[]}
 */
export function listVehicleScoreProfiles() {
  return [...vehicleScoreProfiles.values()];
}
