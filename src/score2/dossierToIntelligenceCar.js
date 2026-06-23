/**
 * Shared golden dossier → enriched intelligence vehicle conversion.
 */

import { enrichFamilyWithIntelligence } from "../intelligence/familyIntelligence.js";

/**
 * @param {object} dossier
 * @returns {object}
 */
export function dossierToIntelligenceCar(dossier) {
  const fields = dossier.fields || {};

  return enrichFamilyWithIntelligence({
    familySlug: dossier.familySlug,
    familyName: dossier.displayName,
    brand: fields.brand || dossier.vehicle?.brand,
    startingPrice: fields.startingPrice ?? fields.exShowroomPrice ?? null,
    variants: dossier.variants || [],
    specifications: {
      range: fields.claimedRangeKm ?? null,
      batteryPack:
        fields.batteryCapacityKwh != null
          ? `${fields.batteryCapacityKwh} kWh`
          : undefined,
    },
    catalogMeta: {
      batteryCapacityKwh: fields.batteryCapacityKwh ?? null,
      claimedRangeKm: fields.claimedRangeKm ?? null,
      verificationLevel: dossier.verificationLevel ?? null,
    },
    fields: dossier.fields,
    vehicle: dossier.vehicle,
    verificationLevel: dossier.verificationLevel,
    displayName: dossier.displayName,
  });
}
