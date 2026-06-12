/**
 * Transform public golden JSON dossiers into tier-1 catalog seed definitions.
 */

import {
  goldenMediaToFamilyMedia,
  slugifyVariantName,
} from "./goldenToVerifiedDossier.mjs";

const PRODUCTIONIZATION_SAFETY_SKELETON = {
  bharatNcap: { status: "not_tested" },
  globalNcap: { status: "unknown" },
  airbags: { status: "unknown" },
  abs: { status: "unknown" },
  esc: { status: "unknown" },
  traction_control: { status: "unknown" },
  adas: { status: "unknown" },
};

function parseNumeric(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function productionizationSeo(brand, name) {
  return {
    metaTitle: `${brand} ${name} — Price, Range & Charging | EVSavari`,
    metaDescription: `Compare ${brand} ${name} variants, range, charging, and ownership costs on EVSavari. Indicative data — verify with dealer.`,
  };
}

function defaultOwnershipMeta(category = "") {
  const body = String(category || "").toLowerCase();
  if (body.includes("hatch")) {
    return {
      apartmentFriendly: true,
      compactParking: true,
      cityPrimary: true,
    };
  }
  return {
    apartmentFriendly: true,
    highwaySuitable: true,
    familyPractical: true,
  };
}

function variantChargingMeta(row, fields) {
  const acKw = parseNumeric(row.acChargingKw ?? fields.acChargingKw);
  const dcKw = parseNumeric(row.dcChargingKw ?? fields.dcChargingKw);
  return {
    acKw,
    dcKw,
    port: row.chargingPort || fields.chargingPort || "CCS2",
    acTime0to100Hours: parseNumeric(
      row.acChargingTimeHours ?? fields.acChargingTimeHours
    ),
    dcTime10to80Minutes: parseNumeric(
      row.dcChargingTimeMinutes ?? fields.dcChargingTimeMinutes
    ),
    dcMinutes: parseNumeric(
      row.dcChargingTimeMinutes ?? fields.dcChargingTimeMinutes
    ),
    fastChargingSupported: Boolean(dcKw),
    portableChargerIncluded: true,
  };
}

/**
 * @param {object} dossier golden vehicle JSON
 * @returns {object} tier-1 catalog definition
 */
export function goldenDossierToTier1Definition(dossier) {
  const familySlug =
    dossier.familySlug || dossier.id || dossier.vehicle?.familySlug;
  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const brand = fields.brand || vehicle.brand || "";
  const name = fields.model || vehicle.model || dossier.displayName || "";
  const category = vehicle.bodyType || fields.bodyType || "EV";
  const media = goldenMediaToFamilyMedia(dossier.media || {});
  const verificationLevel = dossier.verificationLevel || "manual_review";
  const isVerified = verificationLevel === "verified_dossier";

  const variants = (dossier.variants || []).map((row) => {
    const variantSlug = slugifyVariantName(row.variantName);
    const powerBhpExplicit = parseNumeric(row.powerBhp ?? fields.powerBhp);
    const powerPs = parseNumeric(row.powerPs ?? fields.powerPs);
    const powerBhp =
      powerBhpExplicit ?? (powerPs != null ? Math.round(powerPs) : null);
    const powerKw = parseNumeric(row.powerKw ?? fields.powerKw);
    const torqueNm = parseNumeric(row.torqueNm ?? fields.torqueNm);
    const rangeKmClaimed = parseNumeric(row.rangeKm ?? fields.claimedRangeKm);
    const batteryKwh = parseNumeric(row.batteryKwh ?? fields.batteryCapacityKwh);
    const chargingMeta = variantChargingMeta(row, fields);

    return {
      slug: variantSlug,
      name: row.variantName || variantSlug,
      priceInr: parseNumeric(row.priceInr ?? fields.startingPrice),
      rangeKmClaimed,
      batteryKwh,
      powerKw,
      torqueNm,
      specs: {
        drivetrain: "FWD",
        seats: 5,
        torqueNm,
        powerKw,
        powerBhp,
        powerPs: powerPs ?? powerBhp,
      },
      compareSpecs: {
        claimedRangeKm: rangeKmClaimed,
        batteryKwh,
        powerKw,
        torqueNm,
        powerPs,
        dcChargingKw: chargingMeta.dcKw,
        dcChargingTimeMinutes: chargingMeta.dcTime10to80Minutes,
      },
      chargingMeta,
    };
  });

  const primary = dossier.variants?.[0] || {};
  const familyCharging = variantChargingMeta(primary, fields);

  const definition = {
    slug: familySlug,
    brand,
    name,
    category,
    compareReady: true,
    verificationLevel,
    safetyMeta: isVerified ? undefined : PRODUCTIONIZATION_SAFETY_SKELETON,
    seoMeta: isVerified
      ? {
          metaTitle: `${brand} ${name} — Price, Range & Charging | EVSavari`,
          metaDescription: `Compare all ${brand} ${name} variants with verified range, charging times, and safety on EVSavari.`,
        }
      : productionizationSeo(brand, name),
    ownershipMeta: defaultOwnershipMeta(category),
    chargingMeta: familyCharging,
    mediaMeta: media,
    heroImage: media.heroImage || undefined,
    compareThumbnail: media.compareImage || undefined,
    listingThumbnail: media.listingImage || undefined,
    variants,
  };

  if (isVerified) {
    definition.verified = true;
    definition.verificationSource = "Verified Dossier";
    definition.verificationOwner = "EVSavari Catalog Generator";
    definition.dossierVersion = "generated-v1";
    definition.governanceStatus = "verified";
  }

  return definition;
}

export function serializeTier1Module(definition) {
  return `/**
 * AUTO-GENERATED — do not edit manually.
 * Source: public/catalog/golden-dataset/vehicles/${definition.slug}.json
 * Regenerate: npm run catalog:generate-tier1
 */

export const TIER1_DEFINITION = Object.freeze(${JSON.stringify(definition, null, 2)});
`;
}
