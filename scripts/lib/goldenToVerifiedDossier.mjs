/**
 * Transform public golden JSON dossiers into verified-dossier-compatible shapes.
 */

export function slugifyVariantName(name = "") {
  return String(name || "")
    .trim()
    .replace(/\+/g, " plus ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function goldenMediaToFamilyMedia(media = {}) {
  const heroImage = media.heroImage || media.front || null;
  const compareImage =
    media.compareThumbnail || media.compareImage || media.compare || null;
  const listingImage =
    media.listingThumbnail || media.listingImage || media.listing || null;

  return {
    heroImage,
    compareImage,
    listingImage,
    compareThumbnail: compareImage,
    listingThumbnail: listingImage,
    source: media.source || "golden-dataset",
    verificationStatus:
      media.verificationStatus ||
      (heroImage && listingImage ? "present" : "partial"),
  };
}

function parseNumeric(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resolveRealWorldRange(row, fields = {}) {
  const min = parseNumeric(
    row.realWorldRangeKmMin ??
      row.realWorldRangeKm?.min ??
      fields.realWorldRangeKmMin ??
      fields.realWorldRangeKm?.min
  );
  const max = parseNumeric(
    row.realWorldRangeKmMax ??
      row.realWorldRangeKm?.max ??
      fields.realWorldRangeKmMax ??
      fields.realWorldRangeKm?.max
  );
  if (min == null && max == null) return null;
  return { min, max };
}

export function goldenVariantToVerified(row, familySlug, fields = {}) {
  const variantSlug = slugifyVariantName(row.variantName);
  const slug =
    row.slug ||
    (variantSlug ? `${familySlug}-${variantSlug}` : familySlug);

  const powerBhpExplicit = parseNumeric(row.powerBhp ?? fields.powerBhp);
  const powerPs = parseNumeric(row.powerPs ?? fields.powerPs);
  const powerBhp =
    powerBhpExplicit ??
    (powerPs != null ? Math.round(powerPs) : null);
  const powerKw =
    parseNumeric(row.powerKw ?? fields.powerKw) ??
    (powerBhp != null ? Math.round(powerBhp * 0.7457 * 100) / 100 : null);

  const acKw = parseNumeric(row.acChargingKw ?? fields.acChargingKw);
  const dcKw = parseNumeric(row.dcChargingKw ?? fields.dcChargingKw);
  const acTime0to100Hours = parseNumeric(
    row.acChargingTimeHours ?? fields.acChargingTimeHours
  );
  const dcTime10to80Minutes = parseNumeric(
    row.dcChargingTimeMinutes ?? fields.dcChargingTimeMinutes
  );
  const realWorldRange = resolveRealWorldRange(row, fields);

  return {
    slug,
    variantSlug,
    name: row.variantName || slug,
    trimLabel: row.variantName || slug,
    priceInr: parseNumeric(row.priceInr ?? fields.startingPrice),
    batteryKwh: parseNumeric(row.batteryKwh ?? fields.batteryCapacityKwh),
    rangeKmClaimed: parseNumeric(row.rangeKm ?? fields.claimedRangeKm),
    rangeStandard: fields.rangeTestStandard || "MIDC",
    rangeKmRealWorldMin: realWorldRange?.min ?? null,
    rangeKmRealWorldMax: realWorldRange?.max ?? null,
    powerBhp,
    powerKw,
    torqueNm: parseNumeric(row.torqueNm ?? fields.torqueNm),
    charging: {
      port: row.chargingPort || fields.chargingPort || "CCS2",
      acKw,
      dcKw,
      acTime0to100Hours,
      dcTime10to80Minutes,
      fastChargingSupported: Boolean(dcKw),
      portableChargerIncluded: true,
    },
    featureTags: Array.isArray(row.featureTags) ? row.featureTags : [],
    catalogMeta: {
      familySlug,
      slug,
      claimedRangeKm: parseNumeric(row.rangeKm ?? fields.claimedRangeKm),
      claimedRangeStandard: fields.rangeTestStandard || "MIDC",
      chargingIntelligence: {
        acKw,
        dcKw,
        acTime0to100Hours,
        dcTime10to80Minutes,
      },
      performance: {
        powerKw,
        powerBhp,
        torqueNm: parseNumeric(row.torqueNm ?? fields.torqueNm),
      },
      ...(realWorldRange ? { realWorldRangeKm: realWorldRange } : {}),
    },
  };
}

export function goldenDossierToVerifiedModule(dossier) {
  const familySlug =
    dossier.familySlug || dossier.id || dossier.vehicle?.familySlug;
  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const brand = fields.brand || vehicle.brand || "";
  const model = fields.model || vehicle.model || dossier.displayName || "";
  const category = vehicle.bodyType || fields.bodyType || "EV";

  const variants = (dossier.variants || []).map((row) =>
    goldenVariantToVerified(row, familySlug, fields)
  );

  const verificationLevel = dossier.verificationLevel || "manual_review";
  const verificationSource =
    verificationLevel === "verified_dossier"
      ? "Verified Dossier"
      : "Golden Dataset";

  return {
    familySlug,
    familyMedia: goldenMediaToFamilyMedia(dossier.media || {}),
    variants,
    dossierMeta: {
      brand,
      familyName: model,
      category,
      displayName: dossier.displayName || `${brand} ${model}`.trim(),
      verificationLevel,
      verificationSource,
      verificationOwner: "EVSavari Catalog Generator",
      dossierVersion: "generated-v1",
      sources: Array.isArray(dossier.sources) ? dossier.sources : [],
      verifiedAt: dossier.verifiedAt || null,
    },
  };
}

export function serializeJsModule(moduleData) {
  const json = JSON.stringify(
    {
      FAMILY_SLUG: moduleData.familySlug,
      FAMILY_MEDIA: moduleData.familyMedia,
      VERIFIED_VARIANTS: moduleData.variants,
      DOSSIER_META: moduleData.dossierMeta,
    },
    null,
    2
  );

  return `/**
 * AUTO-GENERATED — do not edit manually.
 * Source: public/catalog/golden-dataset/vehicles/${moduleData.familySlug}.json
 * Regenerate: npm run catalog:generate-verified
 */

export const FAMILY_SLUG = ${JSON.stringify(moduleData.familySlug)};

export const FAMILY_MEDIA = Object.freeze(${JSON.stringify(moduleData.familyMedia, null, 2)});

export const VERIFIED_VARIANTS = Object.freeze(${JSON.stringify(moduleData.variants, null, 2)});

export const DOSSIER_META = Object.freeze(${JSON.stringify(moduleData.dossierMeta, null, 2)});
`;
}
