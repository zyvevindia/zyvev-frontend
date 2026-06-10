/**
 * Golden-dataset → marketplace variant conversion for /cars listing.
 */

import {
  fetchGoldenDossier,
  fetchGoldenManifest,
} from "../catalogAcquisition/benchmark/goldenLoader.js";
import normalizeCar from "./normalizeCar.js";
import { extractFamilySlug } from "./modelFamily.js";
import { normalizeVehicleSlug } from "./vehicleRoutes.js";

function slugifyVariantName(name = "") {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {object} dossier
 * @returns {object[]}
 */
export function goldenDossierToMarketplaceVariants(dossier) {
  if (!dossier || typeof dossier !== "object") return [];

  const familySlug = normalizeVehicleSlug(
    dossier.familySlug || dossier.id || dossier.vehicle?.familySlug
  );
  if (!familySlug) return [];

  const fields = dossier.fields || {};
  const vehicle = dossier.vehicle || {};
  const brand = fields.brand || vehicle.brand || "";
  const model = fields.model || vehicle.model || dossier.displayName || "";
  const category = vehicle.bodyType || fields.bodyType || "EV";
  const media = dossier.media || {};

  const variantRows =
    Array.isArray(dossier.variants) && dossier.variants.length
      ? dossier.variants
      : [
          {
            variantName: model || familySlug,
            priceInr: fields.startingPrice ?? fields.exShowroomPrice,
            rangeKm: fields.claimedRangeKm,
            batteryKwh: fields.batteryCapacityKwh,
          },
        ];

  return variantRows.map((row, index) => {
    const variantPart = slugifyVariantName(row.variantName);
    const slug =
      variantRows.length === 1 || !variantPart
        ? familySlug
        : `${familySlug}-${variantPart}`;

    const batteryKwh = row.batteryKwh ?? fields.batteryCapacityKwh;
    const rangeKm = row.rangeKm ?? fields.claimedRangeKm;
    const price = row.priceInr ?? fields.startingPrice ?? fields.exShowroomPrice;

    return {
      _id: `golden-dataset:${familySlug}:${index}`,
      slug,
      familySlug,
      name: `${brand} ${model} ${row.variantName || ""}`.trim(),
      brand,
      category,
      price,
      startingPrice: price,
      range: rangeKm,
      battery: batteryKwh ? `${batteryKwh} kWh` : fields.batteryCapacityKwh ? `${fields.batteryCapacityKwh} kWh` : "EV Battery",
      heroImage: media.heroImage || media.front || null,
      listingThumbnail: media.listingThumbnail || media.listing || null,
      compareThumbnail: media.compareThumbnail || media.compare || null,
      image: media.listingThumbnail || media.heroImage || null,
      galleryImages: media.galleryImages || media.gallery || [],
      catalogSource: "golden-dataset",
      catalogMeta: {
        slug,
        familySlug,
        media,
        verificationLevel: dossier.verificationLevel,
      },
      specifications: {
        range: rangeKm,
        batteryPack: batteryKwh ? `${batteryKwh} kWh` : undefined,
        acChargingKw: row.acChargingKw ?? fields.acChargingKw,
        dcChargingKw: row.dcChargingKw ?? fields.dcChargingKw,
      },
    };
  });
}

/**
 * Load all golden-dataset vehicles as marketplace variants.
 * @returns {Promise<object[]>}
 */
export async function fetchGoldenDatasetMarketplaceVariants() {
  const manifest = await fetchGoldenManifest();
  const variants = [];

  for (const entry of manifest.vehicles || []) {
    try {
      const dossier = await fetchGoldenDossier(entry.id);
      variants.push(...goldenDossierToMarketplaceVariants(dossier));
    } catch {
      /* skip missing dossier */
    }
  }

  return variants.map(normalizeCar);
}

/**
 * Merge API catalog with golden dataset (golden ensures full fleet coverage).
 * @param {object[]} apiVariants normalized
 * @param {object[]} goldenVariants normalized
 * @returns {object[]}
 */
export function mergeListingCatalogVariants(apiVariants = [], goldenVariants = []) {
  const families = new Set([
    ...goldenVariants.map((v) => extractFamilySlug(v.slug)),
    ...apiVariants.map((v) => extractFamilySlug(v.slug)),
  ]);

  const merged = [];

  for (const familySlug of families) {
    if (!familySlug) continue;

    const apiFam = apiVariants.filter(
      (v) => extractFamilySlug(v.slug) === familySlug
    );
    const goldenFam = goldenVariants.filter(
      (v) => extractFamilySlug(v.slug) === familySlug
    );

    if (apiFam.length > 0) {
      merged.push(...apiFam);
    } else {
      merged.push(...goldenFam);
    }
  }

  return merged.map(normalizeCar);
}

/**
 * Stage counts for listing catalog audits.
 */
export function summarizeListingCatalogPipeline({
  goldenManifestCount = 0,
  goldenVariantCount = 0,
  apiVariantCount = 0,
  mergedVariantCount = 0,
  familyCount = 0,
  brandCount = 0,
} = {}) {
  return {
    goldenManifestCount,
    goldenVariantCount,
    apiVariantCount,
    mergedVariantCount,
    familyCount,
    brandCount,
  };
}
