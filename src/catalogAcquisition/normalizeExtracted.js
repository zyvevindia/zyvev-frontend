/**
 * Normalize extraction candidates → EVSavari schema with per-field confidence.
 */

import { confField, aggregateConfidence } from "./confidence.js";
import {
  createEmptyExtractionDraft,
  EXTRACTION_SCHEMA_VERSION,
} from "./extractionSchema.js";
import { extractCandidatesFromContent } from "./extractFromText.js";

function slugify(text = "") {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scorePresent(value, base = 85) {
  if (value === null || value === undefined || value === "") return 0;
  return base;
}

function scoreNumeric(value, { min, max, base = 90 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (min != null && n < min) return 40;
  if (max != null && n > max) return 50;
  return base;
}

/**
 * @param {object} candidates from extractCandidatesFromContent
 * @param {{ sourceType?: string, extractor?: string }} meta
 */
export function normalizeCandidatesToDraft(candidates, meta = {}) {
  const draft = createEmptyExtractionDraft();
  draft.meta = {
    extractor: meta.extractor || "heuristic-v1",
    extractedAt: new Date().toISOString(),
    sourceType: meta.sourceType || candidates.meta?.sourceType || null,
  };

  const brand = candidates.brand;
  const model = candidates.model;
  const familySlug =
    brand && model
      ? slugify(`${brand}-${model}`.replace(/\bev\b/gi, "ev"))
      : slugify(model || brand || "");

  draft.vehicle = {
    brand: confField(brand, scorePresent(brand, 88)),
    model: confField(model, scorePresent(model, 88)),
    bodyType: confField(candidates.bodyType, scorePresent(candidates.bodyType, 75)),
    familySlug: confField(familySlug, familySlug ? 82 : 0),
  };

  draft.pricing = {
    startingPrice: confField(
      candidates.startingPrice,
      scoreNumeric(candidates.startingPrice, { min: 300_000, max: 50_000_000, base: 92 })
    ),
    topVariantPrice: confField(
      candidates.topVariantPrice,
      scoreNumeric(candidates.topVariantPrice, { min: 300_000, max: 50_000_000, base: 88 })
    ),
    exShowroomPrice: confField(
      candidates.startingPrice,
      scoreNumeric(candidates.startingPrice, { min: 300_000, max: 50_000_000, base: 90 })
    ),
  };

  draft.battery = {
    batteryCapacityKwh: confField(
      candidates.batteryCapacityKwh,
      scoreNumeric(candidates.batteryCapacityKwh, { min: 10, max: 120, base: 94 })
    ),
    batteryChemistry: confField(candidates.batteryChemistry, scorePresent(candidates.batteryChemistry, 70)),
  };

  draft.range = {
    claimedRangeKm: confField(
      candidates.claimedRangeKm,
      scoreNumeric(candidates.claimedRangeKm, { min: 80, max: 700, base: 90 })
    ),
    rangeTestStandard: confField(candidates.rangeTestStandard, scorePresent(candidates.rangeTestStandard, 72)),
  };

  draft.charging = {
    acChargingKw: confField(
      candidates.acChargingKw,
      scoreNumeric(candidates.acChargingKw, { min: 2, max: 22, base: 88 })
    ),
    dcChargingKw: confField(
      candidates.dcChargingKw,
      scoreNumeric(candidates.dcChargingKw, { min: 20, max: 350, base: 88 })
    ),
    acChargingTimeHours: confField(
      candidates.acChargingTimeHours,
      scoreNumeric(candidates.acChargingTimeHours, { min: 1, max: 24, base: 75 })
    ),
    dcChargingTimeMinutes: confField(
      candidates.dcChargingTimeMinutes,
      scoreNumeric(candidates.dcChargingTimeMinutes, { min: 15, max: 180, base: 75 })
    ),
  };

  draft.performance = {
    powerPs: confField(
      candidates.powerPs,
      scoreNumeric(candidates.powerPs, { min: 40, max: 700, base: 85 })
    ),
    torqueNm: confField(
      candidates.torqueNm,
      scoreNumeric(candidates.torqueNm, { min: 50, max: 1200, base: 85 })
    ),
  };

  draft.dimensions = {
    lengthMm: confField(candidates.lengthMm, scoreNumeric(candidates.lengthMm, { min: 3000, max: 5500 })),
    widthMm: confField(candidates.widthMm, scoreNumeric(candidates.widthMm, { min: 1500, max: 2200 })),
    heightMm: confField(candidates.heightMm, scoreNumeric(candidates.heightMm, { min: 1400, max: 2200 })),
    wheelbaseMm: confField(candidates.wheelbaseMm, scoreNumeric(candidates.wheelbaseMm, { min: 2300, max: 3200 })),
  };

  draft.safety = {
    airbags: confField(candidates.airbags, scoreNumeric(candidates.airbags, { min: 2, max: 9, base: 80 })),
    adas: confField(Boolean(candidates.adas), candidates.adas ? 70 : 0),
    adasLevel: confField(candidates.adasLevel, scoreNumeric(candidates.adasLevel, { min: 0, max: 3, base: 65 })),
    ncapRating: confField(candidates.ncapRating, scoreNumeric(candidates.ncapRating, { min: 1, max: 5, base: 75 })),
  };

  draft.features = {
    sunroof: confField(Boolean(candidates.sunroof), candidates.sunroof ? 68 : 0),
    ventilatedSeats: confField(Boolean(candidates.ventilatedSeats), candidates.ventilatedSeats ? 65 : 0),
    camera360: confField(Boolean(candidates.camera360), candidates.camera360 ? 65 : 0),
    connectedCar: confField(Boolean(candidates.connectedCar), candidates.connectedCar ? 65 : 0),
    v2l: confField(Boolean(candidates.v2l), candidates.v2l ? 62 : 0),
    v2v: confField(Boolean(candidates.v2v), candidates.v2v ? 62 : 0),
  };

  draft.warranty = {
    vehicleWarrantyYears: confField(
      candidates.vehicleWarrantyYears,
      scoreNumeric(candidates.vehicleWarrantyYears, { min: 1, max: 10, base: 70 })
    ),
    batteryWarrantyYears: confField(
      candidates.batteryWarrantyYears,
      scoreNumeric(candidates.batteryWarrantyYears, { min: 1, max: 15, base: 72 })
    ),
  };

  draft.mediaMeta = {
    colorOptions: confField(candidates.colorOptions, 0),
    heroImageCandidates: confField(candidates.heroImageCandidates, 0),
  };

  draft.variants = (candidates.variants || []).map((v) => ({
    variantName: v.variantName,
    price: confField(v.price, scoreNumeric(v.price, { min: 300_000, max: 50_000_000, base: 75 })),
    battery: confField(v.battery, scoreNumeric(v.battery, { min: 10, max: 120, base: 72 })),
    range: confField(v.range, scoreNumeric(v.range, { min: 80, max: 700, base: 72 })),
    charging: confField(v.charging, scorePresent(v.charging, 68)),
  }));

  return draft;
}

/**
 * Full pipeline: raw OEM content → structured draft + aggregate confidence.
 */
export function normalizeExtractedContent(rawContent, context = {}) {
  const candidates = extractCandidatesFromContent(rawContent, context);
  const extractedVehicle = normalizeCandidatesToDraft(candidates, {
    sourceType: context.sourceType,
    extractor: context.extractor || "heuristic-v1",
  });

  const flatSections = [
    extractedVehicle.vehicle,
    extractedVehicle.pricing,
    extractedVehicle.battery,
    extractedVehicle.range,
    extractedVehicle.charging,
    extractedVehicle.performance,
    extractedVehicle.dimensions,
    extractedVehicle.safety,
    extractedVehicle.features,
    extractedVehicle.warranty,
    extractedVehicle.mediaMeta,
  ];
  const allFields = Object.assign({}, ...flatSections);
  const confidenceScore = aggregateConfidence(allFields);

  return {
    format: EXTRACTION_SCHEMA_VERSION,
    candidates,
    extractedVehicle,
    confidenceScore,
  };
}

export function initializeReviewedVehicle(extractedVehicle) {
  return structuredClone(extractedVehicle);
}
