import { extractFamilySlug } from "../../../utils/modelFamily.js";
import { GENERATED_OVERLAY_BUILDERS } from "../generated/overlays/index.js";

/**
 * Apply controlled verified catalog overlays (no schema changes).
 * @param {object} car
 * @returns {object}
 */
export function applyVerifiedCatalogOverlay(car) {
  if (!car || typeof car !== "object") return car;

  const family = extractFamilySlug(
    car.slug || car.catalogMeta?.slug || car.catalogMeta?.familySlug
  );

  const buildOverlay = GENERATED_OVERLAY_BUILDERS[family];
  if (!buildOverlay) {
    return car;
  }

  const overlay = buildOverlay(car);
  if (!overlay) return car;

  return {
    ...car,
    ...overlay,
    specifications: {
      ...(car.specifications || {}),
      ...(overlay.specifications || {}),
    },
    catalogMeta: {
      ...(car.catalogMeta || {}),
      ...(overlay.catalogMeta || {}),
      safety: {
        ...(car.catalogMeta?.safety || {}),
        ...(overlay.catalogMeta?.safety || {}),
      },
      chargingIntelligence: {
        ...(car.catalogMeta?.chargingIntelligence || {}),
        ...(overlay.catalogMeta?.chargingIntelligence || {}),
      },
      chargingPracticality: {
        ...(car.catalogMeta?.chargingPracticality || {}),
        ...(overlay.catalogMeta?.chargingPracticality || {}),
      },
      chargingEcosystem: {
        ...(car.catalogMeta?.chargingEcosystem || {}),
        ...(overlay.catalogMeta?.chargingEcosystem || {}),
      },
    },
  };
}
