/**
 * Publish approved catalog import → Supabase vehicles + variants.
 * No direct writes before human approval (caller must verify status).
 */

import { IMPORT_STATUS } from "./constants.js";
import { flattenExtractionDraft } from "./extractionSchema.js";
import { mergeReviewedFields } from "./confidence.js";
import { checkPublishQualityGates } from "./benchmark/qualityGates.js";

function fieldValue(flat, key) {
  const entry = flat[key];
  return entry?.value ?? null;
}

function variantSlug(familySlug, name, index) {
  const base = String(name || `variant-${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${familySlug}-${base}`.slice(0, 120);
}

/**
 * Build publish payloads from reviewed extraction draft.
 */
export function buildPublishPayload(reviewedVehicle = {}) {
  const flat = flattenExtractionDraft(reviewedVehicle);
  const familySlug = fieldValue(flat, "familySlug");
  const brand = fieldValue(flat, "brand");
  const model = fieldValue(flat, "model");

  if (!familySlug || !brand || !model) {
    return {
      ok: false,
      errors: ["familySlug, brand, and model are required for publish"],
    };
  }

  const vehicle = {
    slug: familySlug,
    brand: String(brand),
    name: String(model),
    category: fieldValue(flat, "bodyType") || "SUV",
    compareReady: true,
    chargingMeta: {
      acKw: fieldValue(flat, "acChargingKw"),
      dcKw: fieldValue(flat, "dcChargingKw"),
      acTimeHours: fieldValue(flat, "acChargingTimeHours"),
      dcTimeMinutes: fieldValue(flat, "dcChargingTimeMinutes"),
    },
    ownershipMeta: {},
    seoMeta: { source: "catalog_import" },
    metadata: {
      publishedVia: "catalog_acquisition_v3",
      safety: {
        airbags: fieldValue(flat, "airbags"),
        adas: fieldValue(flat, "adas"),
        adasLevel: fieldValue(flat, "adasLevel"),
        ncapRating: fieldValue(flat, "ncapRating"),
      },
      features: {
        sunroof: fieldValue(flat, "sunroof"),
        ventilatedSeats: fieldValue(flat, "ventilatedSeats"),
        camera360: fieldValue(flat, "camera360"),
        connectedCar: fieldValue(flat, "connectedCar"),
        v2l: fieldValue(flat, "v2l"),
        v2v: fieldValue(flat, "v2v"),
      },
      warranty: {
        vehicleYears: fieldValue(flat, "vehicleWarrantyYears"),
        batteryYears: fieldValue(flat, "batteryWarrantyYears"),
      },
      battery: {
        capacityKwh: fieldValue(flat, "batteryCapacityKwh"),
        chemistry: fieldValue(flat, "batteryChemistry"),
      },
      range: {
        claimedKm: fieldValue(flat, "claimedRangeKm"),
        testStandard: fieldValue(flat, "rangeTestStandard"),
      },
      mediaMeta: {
        colorOptions: fieldValue(flat, "colorOptions"),
        heroImageCandidates: fieldValue(flat, "heroImageCandidates"),
      },
      dimensions: {
        lengthMm: fieldValue(flat, "lengthMm"),
        widthMm: fieldValue(flat, "widthMm"),
        heightMm: fieldValue(flat, "heightMm"),
        wheelbaseMm: fieldValue(flat, "wheelbaseMm"),
      },
      performance: {
        powerPs: fieldValue(flat, "powerPs"),
        torqueNm: fieldValue(flat, "torqueNm"),
      },
    },
  };

  const variants = [];
  const draftVariants = reviewedVehicle.variants || [];

  if (draftVariants.length) {
    draftVariants.forEach((v, i) => {
      if (v.rejected) return;
      const name = v.variantName?.value ?? v.variantName;
      if (!name) return;
      variants.push({
        slug: variantSlug(familySlug, name, i),
        name: String(name),
        priceInr: v.price?.value ?? null,
        rangeKmClaimed: v.range?.value ?? fieldValue(flat, "claimedRangeKm"),
        batteryKwh: v.battery?.value ?? fieldValue(flat, "batteryCapacityKwh"),
        specs: {
          range: v.range?.value ?? fieldValue(flat, "claimedRangeKm"),
          batteryPack: v.battery?.value
            ? `${v.battery.value} kWh`
            : fieldValue(flat, "batteryCapacityKwh")
              ? `${fieldValue(flat, "batteryCapacityKwh")} kWh`
              : null,
          charging: v.charging?.value ?? null,
          powerPs: fieldValue(flat, "powerPs"),
          torqueNm: fieldValue(flat, "torqueNm"),
        },
        compareSpecs: {
          batteryKwh: v.battery?.value ?? fieldValue(flat, "batteryCapacityKwh"),
          rangeKm: v.range?.value ?? fieldValue(flat, "claimedRangeKm"),
        },
      });
    });
  } else {
    variants.push({
      slug: `${familySlug}-base`,
      name: "Base",
      priceInr: fieldValue(flat, "startingPrice"),
      rangeKmClaimed: fieldValue(flat, "claimedRangeKm"),
      batteryKwh: fieldValue(flat, "batteryCapacityKwh"),
      specs: {
        range: fieldValue(flat, "claimedRangeKm"),
        batteryPack: fieldValue(flat, "batteryCapacityKwh")
          ? `${fieldValue(flat, "batteryCapacityKwh")} kWh`
          : null,
      },
      compareSpecs: {
        batteryKwh: fieldValue(flat, "batteryCapacityKwh"),
        rangeKm: fieldValue(flat, "claimedRangeKm"),
      },
    });
  }

  return { ok: true, vehicle, variants };
}

/**
 * Execute publish against persistence layer (injected for browser vs Node).
 * @param {object} importRecord
 * @param {{ upsertVehicle: Function, upsertVehicleVariant: Function }} persistence
 */
export async function publishCatalogImport(
  importRecord,
  persistence,
  { evidenceRecords = [], goldenDossier = null, qualityGateOptions = {} } = {}
) {
  if (!importRecord) {
    return { ok: false, errors: ["Import record missing"] };
  }
  if (importRecord.status !== IMPORT_STATUS.APPROVED) {
    return {
      ok: false,
      errors: [`Import must be approved before publish (current: ${importRecord.status})`],
    };
  }

  const gateResult = checkPublishQualityGates(
    importRecord,
    evidenceRecords,
    goldenDossier,
    qualityGateOptions
  );
  if (!gateResult.passed) {
    return {
      ok: false,
      errors: gateResult.failures.map((f) => f.message),
      qualityGates: gateResult,
    };
  }

  const reviewed = importRecord.reviewed_vehicle || importRecord.reviewedVehicle;
  const payload = buildPublishPayload(reviewed);
  if (!payload.ok) return payload;

  const vehicleResult = await persistence.upsertVehicle(payload.vehicle);
  if (!vehicleResult.ok) {
    return { ok: false, errors: [vehicleResult.error?.message || "Vehicle upsert failed"] };
  }

  const vehicleId = vehicleResult.data?.id;
  const variantResults = [];

  for (const v of payload.variants) {
    const r = await persistence.upsertVehicleVariant({
      vehicleId,
      ...v,
    });
    variantResults.push(r);
    if (!r.ok && !r.skipped) {
      return {
        ok: false,
        errors: [r.error?.message || `Variant upsert failed: ${v.slug}`],
        partial: { vehicle: vehicleResult, variants: variantResults },
      };
    }
  }

  return {
    ok: true,
    vehicle: vehicleResult.data,
    variants: variantResults.map((r) => r.data).filter(Boolean),
    publishedAt: new Date().toISOString(),
  };
}

export function applyReviewEdits(extractedVehicle, fieldReviews = {}) {
  const flat = flattenExtractionDraft(extractedVehicle);
  const merged = mergeReviewedFields(flat, fieldReviews);
  return {
    ...extractedVehicle,
    ...Object.keys(merged).reduce((acc, key) => {
      for (const group of [
        "vehicle",
        "pricing",
        "battery",
        "range",
        "charging",
        "performance",
        "dimensions",
        "safety",
      ]) {
        if (extractedVehicle[group]?.[key] !== undefined || merged[key]) {
          acc[group] = acc[group] || { ...extractedVehicle[group] };
          if (merged[key]) acc[group][key] = merged[key];
        }
      }
      return acc;
    }, {}),
  };
}
