/**
 * Normalize catalog dossier or family payloads for score2 builders.
 */

/**
 * @param {{
 *   slug?: string,
 *   intelligenceCar?: object|null,
 *   variants?: object[],
 * }} params
 * @returns {object}
 */
export function normalizeIntelligenceCar({
  slug = "",
  intelligenceCar = null,
  variants = [],
} = {}) {
  const source = intelligenceCar && typeof intelligenceCar === "object"
    ? intelligenceCar
    : {};
  const fields = source.fields || {};
  const vehicleMeta = source.vehicle || {};
  const resolvedSlug =
    slug ||
    source.familySlug ||
    source.slug ||
    fields.familySlug ||
    source.id ||
    "";

  const variantList = variants.length
    ? variants
    : source.variants || source.defaultVariant
      ? [source.defaultVariant].filter(Boolean)
      : [];

  const batteryKwh =
    fields.batteryCapacityKwh ??
    source.catalogMeta?.batteryCapacityKwh ??
    variantList[0]?.batteryKwh ??
    null;

  const claimedRangeKm =
    fields.claimedRangeKm ??
    source.catalogMeta?.claimedRangeKm ??
    variantList[0]?.rangeKm ??
    source.range ??
    null;

  const startingPrice =
    source.startingPrice ??
    fields.startingPrice ??
    fields.exShowroomPrice ??
    source.price ??
    null;

  return {
    ...source,
    id: source.id || resolvedSlug,
    slug: resolvedSlug,
    familySlug: resolvedSlug,
    name:
      source.name ||
      source.displayName ||
      source.familyName ||
      vehicleMeta.model ||
      fields.model ||
      resolvedSlug,
    brand: source.brand || fields.brand || vehicleMeta.brand || null,
    startingPrice,
    price: startingPrice,
    range: claimedRangeKm,
    specifications: {
      ...(source.specifications || {}),
      range: claimedRangeKm ?? source.specifications?.range,
      batteryPack:
        source.specifications?.batteryPack ||
        (batteryKwh != null ? `${batteryKwh} kWh` : undefined),
    },
    catalogMeta: {
      ...(source.catalogMeta || {}),
      claimedRangeKm,
      batteryCapacityKwh: batteryKwh,
      verificationLevel:
        source.catalogMeta?.verificationLevel || source.verificationLevel,
      suitabilityScores: source.catalogMeta?.suitabilityScores,
      compareValueScore: source.catalogMeta?.compareValueScore,
    },
    variants: variantList,
  };
}
