/**
 * Lazy comparison profile registry.
 */

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { buildVehicleComparisonProfile } from "./buildVehicleComparisonProfile.js";

/** @typedef {import("./types.js").VehicleComparisonProfile} VehicleComparisonProfile */

/** @type {Map<string, VehicleComparisonProfile|null>} */
const comparisonProfilesByKey = new Map();

/**
 * @param {string} primarySlug
 * @param {string} secondarySlug
 * @returns {string}
 */
function comparisonCacheKey(primarySlug, secondarySlug) {
  const ordered = [primarySlug, secondarySlug].sort();
  return `${ordered[0]}::${ordered[1]}`;
}

/**
 * @param {string} primarySlug
 * @param {string} secondarySlug
 * @returns {VehicleComparisonProfile|null}
 */
export function getVehicleComparisonProfile(primarySlug, secondarySlug) {
  const primary = String(primarySlug || "").trim().toLowerCase();
  const secondary = String(secondarySlug || "").trim().toLowerCase();

  if (!primary || !secondary || primary === secondary) {
    return null;
  }

  const cacheKey = comparisonCacheKey(primary, secondary);

  if (comparisonProfilesByKey.has(cacheKey)) {
    return comparisonProfilesByKey.get(cacheKey) || null;
  }

  const profile = buildVehicleComparisonProfile({
    primaryVehicleSlug: primary,
    secondaryVehicleSlug: secondary,
  });

  comparisonProfilesByKey.set(cacheKey, profile);
  return profile;
}

/**
 * @returns {VehicleComparisonProfile[]}
 */
export function listComparisonProfiles() {
  /** @type {VehicleComparisonProfile[]} */
  const profiles = [];

  for (let i = 0; i < TIER1_MODEL_FAMILY_SLUGS.length; i += 1) {
    for (let j = i + 1; j < TIER1_MODEL_FAMILY_SLUGS.length; j += 1) {
      const profile = getVehicleComparisonProfile(
        TIER1_MODEL_FAMILY_SLUGS[i],
        TIER1_MODEL_FAMILY_SLUGS[j]
      );
      if (profile) {
        profiles.push(profile);
      }
    }
  }

  return profiles;
}
