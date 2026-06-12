/**
 * Golden-dataset → marketplace variant conversion for /cars listing.
 */

import goldenManifest from "../../public/catalog/golden-dataset/manifest.json";
import {
  fetchGoldenDossier,
  fetchGoldenManifest,
} from "../catalogAcquisition/benchmark/goldenLoader.js";
import normalizeCar from "./normalizeCar.js";
import { formatAcChargeDurationLabel } from "./formatChargingDuration.js";
import { extractFamilySlug } from "./modelFamily.js";
import { normalizeVehicleSlug } from "./vehicleRoutes.js";

/** Build-time bundle of all golden dossiers (no runtime fetch required). */
const bundledGoldenDossiers = import.meta.glob(
  "../../public/catalog/golden-dataset/vehicles/*.json",
  { eager: true, import: "default" }
);

function resolveBundledGoldenDossier(goldenId) {
  const suffix = `/vehicles/${goldenId}.json`;
  const key = Object.keys(bundledGoldenDossiers).find((path) =>
    path.replace(/\\/g, "/").endsWith(suffix)
  );
  return key ? bundledGoldenDossiers[key] : null;
}

function dossierListingTimestamp(dossier) {
  const raw =
    dossier?.generatedAt ||
    dossier?.updatedAt ||
    dossier?.media?.generatedAt ||
    null;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) && t > 0 ? t : Date.now();
}

function slugifyVariantName(name = "") {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGoldenChargingSummary({ acKw, dcKw, dcMinutes, acHours }) {
  const segments = [];
  const dcParts = [];
  if (dcKw) dcParts.push(`${dcKw} kW`);
  if (dcMinutes != null) dcParts.push(`${dcMinutes} min`);
  if (dcParts.length) segments.push(`DC: ${dcParts.join(" • ")}`);

  const acParts = [];
  if (acKw) acParts.push(`${acKw} kW`);
  const acLabel = formatAcChargeDurationLabel(acHours);
  if (acLabel) acParts.push(acLabel);
  if (acParts.length) segments.push(`AC: ${acParts.join(" • ")}`);

  return segments.length ? segments.join(" · ") : undefined;
}

function buildGoldenVariantCatalogMeta({
  row,
  fields,
  slug,
  familySlug,
  media,
  dossier,
  rangeKm,
}) {
  const acKw = row.acChargingKw ?? fields.acChargingKw ?? null;
  const dcKw = row.dcChargingKw ?? fields.dcChargingKw ?? null;
  const dcMinutes =
    row.dcChargingTimeMinutes ??
    row.dcFastChargingMinutes ??
    fields.dcChargingTimeMinutes ??
    null;
  const acHours = row.acChargingTimeHours ?? fields.acChargingTimeHours ?? null;
  const powerBhpRaw = row.powerBhp ?? fields.powerBhp ?? null;
  const powerPsRaw = row.powerPs ?? fields.powerPs ?? null;
  const powerKwRaw = row.powerKw ?? fields.powerKw ?? null;
  const powerBhp =
    powerBhpRaw != null && Number.isFinite(Number(powerBhpRaw))
      ? Number(powerBhpRaw)
      : null;
  const powerPs =
    powerPsRaw != null && Number.isFinite(Number(powerPsRaw))
      ? Number(powerPsRaw)
      : powerBhp;
  const powerKw =
    powerKwRaw != null && Number.isFinite(Number(powerKwRaw))
      ? Number(powerKwRaw)
      : powerBhp != null
        ? Math.round(powerBhp * 0.7457 * 100) / 100
        : null;
  const torqueNmRaw = row.torqueNm ?? fields.torqueNm ?? null;
  const torqueNm =
    torqueNmRaw != null && Number.isFinite(Number(torqueNmRaw))
      ? Number(torqueNmRaw)
      : null;
  const chargingSummary = buildGoldenChargingSummary({
    acKw,
    dcKw,
    dcMinutes,
    acHours,
  });

  const realWorldMin =
    row.realWorldRangeKmMin ??
    row.realWorldRangeKm?.min ??
    fields.realWorldRangeKmMin ??
    fields.realWorldRangeKm?.min ??
    null;
  const realWorldMax =
    row.realWorldRangeKmMax ??
    row.realWorldRangeKm?.max ??
    fields.realWorldRangeKmMax ??
    fields.realWorldRangeKm?.max ??
    null;
  const realWorldRangeKm =
    realWorldMin != null || realWorldMax != null
      ? {
          min:
            realWorldMin != null && Number.isFinite(Number(realWorldMin))
              ? Number(realWorldMin)
              : null,
          max:
            realWorldMax != null && Number.isFinite(Number(realWorldMax))
              ? Number(realWorldMax)
              : null,
        }
      : null;

  return {
    slug,
    familySlug,
    media,
    verificationLevel: dossier.verificationLevel,
    claimedRangeKm: rangeKm ?? fields.claimedRangeKm ?? null,
    ...(realWorldRangeKm ? { realWorldRangeKm } : {}),
    dcChargingTimeMinutes: dcMinutes,
    chargingSummary,
    chargingIntelligence: {
      acKw,
      dcKw,
      dcTime10to80Minutes: dcMinutes,
      acTime0to100Hours: acHours,
    },
    chargingPracticality: {
      acFullChargeHours: acHours,
      dcTime10to80Minutes: dcMinutes,
    },
    performance: {
      powerPs,
      powerKw,
      powerBhp,
      torqueNm,
    },
  };
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
    const listingCreatedAt = dossierListingTimestamp(dossier);
    const catalogMeta = buildGoldenVariantCatalogMeta({
      row,
      fields,
      slug,
      familySlug,
      media,
      dossier,
      rangeKm,
    });
    const chargingSummary = catalogMeta.chargingSummary;

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
      createdAt: listingCreatedAt,
      battery: batteryKwh ? `${batteryKwh} kWh` : fields.batteryCapacityKwh ? `${fields.batteryCapacityKwh} kWh` : "EV Battery",
      heroImage: media.heroImage || media.front || null,
      listingThumbnail: media.listingThumbnail || media.listing || null,
      compareThumbnail: media.compareThumbnail || media.compare || null,
      image: media.listingThumbnail || media.heroImage || null,
      galleryImages: media.galleryImages || media.gallery || [],
      catalogSource: "golden-dataset",
      chargingTime: chargingSummary,
      catalogMeta,
      specifications: {
        range: rangeKm,
        batteryPack: batteryKwh ? `${batteryKwh} kWh` : undefined,
        acChargingKw: catalogMeta.chargingIntelligence.acKw,
        dcChargingKw: catalogMeta.chargingIntelligence.dcKw,
        chargingTime: chargingSummary,
        powerKw: catalogMeta.performance.powerKw,
        powerBhp: catalogMeta.performance.powerBhp,
      },
    };
  });
}

/**
 * Synchronous golden listing load from bundled JSON (always available).
 * @returns {object[]}
 */
const GOLDEN_FAMILY_SLUGS = new Set(
  (goldenManifest.vehicles || [])
    .map((entry) => normalizeVehicleSlug(entry.familySlug || entry.id))
    .filter(Boolean)
);

/**
 * True when familySlug is listed in public/catalog/golden-dataset/manifest.json.
 * Phase 2 authority: these families always resolve from golden JSON at runtime
 * (verified dossier and API are bypassed for variant data).
 * @param {string} familySlug
 */
export function isGoldenDatasetFamily(familySlug) {
  const slug = normalizeVehicleSlug(familySlug);
  return slug ? GOLDEN_FAMILY_SLUGS.has(slug) : false;
}

/** @returns {string[]} sorted golden manifest family slugs */
export function getGoldenManifestFamilySlugs() {
  return [...GOLDEN_FAMILY_SLUGS].sort((a, b) => a.localeCompare(b));
}

/**
 * Bundled golden variants for one fleet family (build-time source of truth).
 * @param {string} familySlug
 * @returns {object[]}
 */
export function loadBundledGoldenDatasetFamilyVariants(familySlug) {
  const slug = normalizeVehicleSlug(familySlug);
  if (!slug || !isGoldenDatasetFamily(slug)) return [];
  const dossier = resolveBundledGoldenDossier(slug);
  if (!dossier) return [];
  return goldenDossierToMarketplaceVariants(dossier).map(normalizeCar);
}

export function loadBundledGoldenDatasetMarketplaceVariants() {
  const variants = [];

  for (const entry of goldenManifest.vehicles || []) {
    const dossier = resolveBundledGoldenDossier(entry.id);
    if (!dossier) continue;
    variants.push(...goldenDossierToMarketplaceVariants(dossier));
  }

  return variants.map(normalizeCar);
}

/**
 * Load all golden-dataset vehicles as marketplace variants.
 * Falls back to bundled dossiers when runtime fetch fails.
 * @returns {Promise<object[]>}
 */
export async function fetchGoldenDatasetMarketplaceVariants() {
  try {
    const manifest = await fetchGoldenManifest();
    const entries = manifest.vehicles || [];
    const batches = await Promise.all(
      entries.map(async (entry) => {
        try {
          const dossier = await fetchGoldenDossier(entry.id);
          return goldenDossierToMarketplaceVariants(dossier);
        } catch {
          const bundled = resolveBundledGoldenDossier(entry.id);
          return bundled ? goldenDossierToMarketplaceVariants(bundled) : [];
        }
      })
    );
    const variants = batches.flat();
    if (variants.length > 0) {
      return variants.map(normalizeCar);
    }
  } catch {
    /* use bundled fallback below */
  }

  return loadBundledGoldenDatasetMarketplaceVariants();
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

    if (isGoldenDatasetFamily(familySlug) && goldenFam.length > 0) {
      merged.push(...goldenFam);
    } else if (apiFam.length > 0) {
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
