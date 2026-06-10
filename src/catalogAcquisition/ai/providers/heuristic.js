/**
 * Heuristic fallback extractor — structured like AI output for evidence pipeline.
 */

import { extractCandidatesFromContent } from "../../extractFromText.js";
import { ALL_SCALAR_FIELD_KEYS } from "../../extractionSchema.js";

function conf(value, confidence = 72) {
  if (value === null || value === undefined || value === "") {
    return { value: null, confidence: 0 };
  }
  return { value, confidence };
}

function extendCandidates(candidates = {}) {
  const plain = candidates.plainTextLength ? "" : "";
  const fields = {
    brand: conf(candidates.brand, 78),
    model: conf(candidates.model, 78),
    bodyType: conf(candidates.bodyType, 70),
    familySlug: conf(
      candidates.brand && candidates.model
        ? `${String(candidates.brand).toLowerCase()}-${String(candidates.model).toLowerCase()}`.replace(
            /[^a-z0-9]+/g,
            "-"
          )
        : null,
      75
    ),
    startingPrice: conf(candidates.startingPrice, 80),
    topVariantPrice: conf(candidates.topVariantPrice, 78),
    exShowroomPrice: conf(candidates.startingPrice, 76),
    batteryCapacityKwh: conf(candidates.batteryCapacityKwh, 82),
    batteryChemistry: conf(candidates.batteryChemistry, 0),
    claimedRangeKm: conf(candidates.claimedRangeKm, 80),
    rangeTestStandard: conf(candidates.rangeTestStandard, 0),
    acChargingKw: conf(candidates.acChargingKw, 78),
    dcChargingKw: conf(candidates.dcChargingKw, 78),
    acChargingTimeHours: conf(candidates.acChargingTimeHours, 0),
    dcChargingTimeMinutes: conf(candidates.dcChargingTimeMinutes, 0),
    powerPs: conf(candidates.powerPs, 75),
    powerKw: conf(candidates.powerKw, 0),
    torqueNm: conf(candidates.torqueNm, 75),
    airbags: conf(candidates.airbags, 72),
    adas: conf(candidates.adas, candidates.adas ? 65 : 0),
    adasLevel: conf(candidates.adasLevel, 0),
    ncapRating: conf(candidates.ncapRating, 70),
    sunroof: conf(candidates.sunroof, 0),
    ventilatedSeats: conf(candidates.ventilatedSeats, 0),
    camera360: conf(candidates.camera360, 0),
    connectedCar: conf(candidates.connectedCar, 0),
    v2l: conf(candidates.v2l, 0),
    v2v: conf(candidates.v2v, 0),
    vehicleWarrantyYears: conf(candidates.vehicleWarrantyYears, 0),
    batteryWarrantyYears: conf(candidates.batteryWarrantyYears, 0),
    colorOptions: conf(candidates.colorOptions, 0),
    heroImageCandidates: conf(candidates.heroImageCandidates, 0),
    lengthMm: conf(candidates.lengthMm, 70),
    widthMm: conf(candidates.widthMm, 70),
    heightMm: conf(candidates.heightMm, 70),
    wheelbaseMm: conf(candidates.wheelbaseMm, 70),
  };

  for (const key of ALL_SCALAR_FIELD_KEYS) {
    if (!fields[key]) fields[key] = conf(null, 0);
  }

  const variants = (candidates.variants || []).map((v) => ({
    variantName: v.variantName,
    price: conf(v.price, 70),
    battery: conf(v.battery, 68),
    range: conf(v.range, 68),
    acChargingKw: conf(candidates.acChargingKw, 65),
    dcChargingKw: conf(candidates.dcChargingKw, 65),
    featureHighlights: conf(v.charging, 60),
  }));

  return { fields, variants, plain };
}

export async function extractWithHeuristic(content, context = {}) {
  const candidates = extractCandidatesFromContent(content, context);
  const { fields, variants } = extendCandidates(candidates);
  return {
    ok: true,
    fields,
    variants,
    provider: "heuristic",
    model: "heuristic-v1-enhanced",
  };
}
