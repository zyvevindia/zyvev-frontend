import { extractFamilySlug } from "../../../utils/modelFamily.js";
import {
  TATA_TIAGO_FAMILY_SLUG,
  buildTataTiagoVerifiedOverlay,
} from "./tataTiagoEvVerified.js";

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

  if (family !== TATA_TIAGO_FAMILY_SLUG) {
    return car;
  }

  const overlay = buildTataTiagoVerifiedOverlay(car);
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
