/**
 * Shared profile materialization pipeline for Score 2.0.
 */

import { applyCalibration } from "./calibrationRules.js";
import { buildVehicleScoreProfile } from "./buildVehicleScoreProfile.js";
import { enrichProfileExplanation } from "./enrichProfileExplanation.js";

/**
 * @param {string} slug
 * @param {{ intelligenceCar: object, variants: object[] }} loaded
 * @returns {import("./types.js").VehicleScoreProfile}
 */
export function materializeVehicleScoreProfile(slug, loaded) {
  const key = String(slug || "").trim().toLowerCase();
  const layers = buildVehicleScoreProfile({
    slug: key,
    intelligenceCar: loaded.intelligenceCar,
    variants: loaded.variants,
  });

  return enrichProfileExplanation(
    applyCalibration(
      {
        slug: key,
        vehicleSlug: key,
        ...layers,
      },
      loaded.intelligenceCar
    ),
    loaded.intelligenceCar
  );
}
