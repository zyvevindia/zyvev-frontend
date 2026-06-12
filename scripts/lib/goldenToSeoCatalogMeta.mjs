/**
 * Transform golden vehicle JSON into factual SEO catalog metadata (no editorial copy).
 */

import {
  goldenMediaToFamilyMedia,
} from "./goldenToVerifiedDossier.mjs";

function parseNumeric(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * @param {object} dossier
 * @returns {object}
 */
export function goldenDossierToSeoCatalogMeta(dossier) {
  const familySlug =
    dossier.familySlug || dossier.id || dossier.vehicle?.familySlug;
  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const variants = Array.isArray(dossier.variants) ? dossier.variants : [];
  const brand = fields.brand || vehicle.brand || "";
  const model = fields.model || vehicle.model || "";
  const bodyStyle = vehicle.bodyType || fields.bodyType || null;

  const prices = variants
    .map((v) => parseNumeric(v.priceInr))
    .filter((n) => n != null);
  const ranges = variants
    .map((v) => parseNumeric(v.rangeKm))
    .filter((n) => n != null);

  const media = goldenMediaToFamilyMedia(dossier.media || {});
  const primary = variants[0] || {};

  const minPrice = prices.length ? Math.min(...prices) : parseNumeric(fields.startingPrice);
  const maxPrice = prices.length ? Math.max(...prices) : parseNumeric(fields.topVariantPrice);
  const minRange = ranges.length ? Math.min(...ranges) : parseNumeric(fields.claimedRangeKm);
  const maxRange = ranges.length ? Math.max(...ranges) : parseNumeric(fields.claimedRangeKm);
  const realWorldMin = parseNumeric(
    fields.realWorldRangeKmMin ?? fields.realWorldRangeKm?.min
  );
  const realWorldMax = parseNumeric(
    fields.realWorldRangeKmMax ?? fields.realWorldRangeKm?.max
  );

  return {
    familySlug,
    displayName:
      dossier.displayName || [brand, model].filter(Boolean).join(" ").trim() || familySlug,
    brand,
    model,
    bodyStyle,
    variantCount: variants.length,
    verificationLevel: dossier.verificationLevel || "manual_review",
    priceBand: {
      minInr: minPrice,
      maxInr: maxPrice,
    },
    rangeBand: {
      minKm: minRange,
      maxKm: maxRange,
    },
    ...(realWorldMin != null || realWorldMax != null
      ? {
          realWorldRangeBand: {
            minKm: realWorldMin,
            maxKm: realWorldMax,
          },
        }
      : {}),
    maxRangeKm: maxRange,
    startingPriceInr: minPrice,
    topVariantPriceInr: maxPrice,
    charging: {
      acKw: parseNumeric(primary.acChargingKw ?? fields.acChargingKw),
      dcKw: parseNumeric(primary.dcChargingKw ?? fields.dcChargingKw),
      acTimeHours: parseNumeric(
        primary.acChargingTimeHours ?? fields.acChargingTimeHours
      ),
      dcTimeMinutes: parseNumeric(
        primary.dcChargingTimeMinutes ?? fields.dcChargingTimeMinutes
      ),
      rangeTestStandard: fields.rangeTestStandard || null,
    },
    media: {
      hasHero: Boolean(media.heroImage),
      hasListing: Boolean(media.listingImage),
      hasCompare: Boolean(media.compareImage),
      source: media.source || null,
    },
    sources: Array.isArray(dossier.sources) ? dossier.sources : [],
    verifiedAt: dossier.verifiedAt || null,
    generatedFrom: `public/catalog/golden-dataset/vehicles/${familySlug}.json`,
  };
}

export function wrapSeoCatalogArtifact(catalogMeta, generatedAt) {
  return {
    version: "seo-catalog-v1",
    generatedAt,
    catalogMeta,
  };
}
