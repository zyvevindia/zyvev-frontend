import { scoreVehicleFromSignals } from "./vehicleScoring.js";
import { buildCategoryRankings, rankByCategory } from "./categoryRanking.js";

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseKwhFromText(text) {
  if (text == null) return null;
  if (typeof text === "number") return text;
  const match = String(text).match(/([\d.]+)/);
  return match ? Number(match[1]) : null;
}

function coalesce(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

/**
 * Extract scoring signals from catalog car, family, or golden dossier.
 * @param {object} input
 * @returns {object}
 */
export function extractScoringSignals(input) {
  if (!input || typeof input !== "object") return {};

  if (input.fields && (input.variants || input.familySlug)) {
    return goldenDossierToSignals(input);
  }

  const specs = input.specifications || {};
  const meta = input.catalogMeta || {};
  const metaFeatures = meta.features || {};

  const features = {
    adas: coalesce(metaFeatures.adas, meta.adas, specs.adas, input.adas),
    sunroof: coalesce(metaFeatures.sunroof, meta.sunroof, specs.sunroof, input.sunroof),
    ventilatedSeats: coalesce(
      metaFeatures.ventilatedSeats,
      meta.ventilatedSeats,
      specs.ventilatedSeats,
      input.ventilatedSeats
    ),
    camera360: coalesce(
      metaFeatures.camera360,
      meta.camera360,
      specs.camera360,
      input.camera360
    ),
    connectedCar: coalesce(
      metaFeatures.connectedCar,
      meta.connectedCar,
      specs.connectedCar,
      input.connectedCar
    ),
    v2l: coalesce(metaFeatures.v2l, meta.v2l, specs.v2l, input.v2l),
    v2v: coalesce(metaFeatures.v2v, meta.v2v, specs.v2v, input.v2v),
  };

  const batteryKwh =
    parseNumber(meta.batteryCapacityKwh) ??
    parseKwhFromText(specs.batteryPack || specs.batteryCapacity || input.battery);

  return {
    brand: input.brand,
    model: input.model || input.name,
    familySlug: input.familySlug || input.slug,
    startingPrice: parseNumber(
      coalesce(input.startingPrice, input.price, meta.startingPrice, meta.exShowroomPrice)
    ),
    claimedRangeKm: parseNumber(
      coalesce(meta.claimedRangeKm, specs.range, input.range, input.maxRange)
    ),
    batteryCapacityKwh: batteryKwh,
    acChargingKw: parseNumber(
      coalesce(specs.acChargingKw, specs.acFastChargingKw, meta.acChargingKw, input.acChargingKw)
    ),
    dcChargingKw: parseNumber(
      coalesce(
        specs.dcFastChargingKw,
        specs.dcChargingKw,
        meta.dcChargingKw,
        input.dcChargingKw
      )
    ),
    acChargingTimeHours: parseNumber(
      coalesce(specs.acChargingTimeHours, meta.acChargingTimeHours, input.acChargingTimeHours)
    ),
    dcChargingTimeMinutes: parseNumber(
      coalesce(
        specs.dc10to80Minutes,
        specs.dcChargingTimeMinutes,
        meta.dcChargingTimeMinutes,
        input.dcChargingTimeMinutes
      )
    ),
    powerPs: parseNumber(coalesce(specs.powerPs, meta.powerPs, input.powerPs)),
    torqueNm: parseNumber(coalesce(specs.torqueNm, meta.torqueNm, input.torqueNm)),
    airbags: parseNumber(coalesce(specs.airbags, meta.airbags, input.airbags)),
    ncapRating: parseNumber(coalesce(specs.ncapRating, meta.ncapRating, input.ncapRating)),
    adas: features.adas,
    lengthMm: parseNumber(coalesce(specs.lengthMm, meta.lengthMm, input.lengthMm)),
    widthMm: parseNumber(coalesce(specs.widthMm, meta.widthMm, input.widthMm)),
    heightMm: parseNumber(coalesce(specs.heightMm, meta.heightMm, input.heightMm)),
    bootSpaceL: parseNumber(
      coalesce(specs.bootSpace, specs.bootSpaceL, meta.bootSpaceL, input.bootSpaceL)
    ),
    features,
    variants: input.variants || meta.variants || [],
  };
}

function goldenDossierToSignals(dossier) {
  const fields = dossier.fields || {};
  const features = {
    adas: coalesce(fields.adas, dossier.features?.adas),
    sunroof: dossier.features?.sunroof,
    ventilatedSeats: dossier.features?.ventilatedSeats,
    camera360: dossier.features?.camera360,
    connectedCar: dossier.features?.connectedCar,
    v2l: dossier.features?.v2l,
    v2v: dossier.features?.v2v,
  };

  return {
    brand: fields.brand || dossier.vehicle?.brand,
    model: fields.model || dossier.vehicle?.model,
    familySlug: dossier.familySlug || fields.familySlug,
    startingPrice: parseNumber(fields.startingPrice ?? fields.exShowroomPrice),
    claimedRangeKm: parseNumber(fields.claimedRangeKm),
    batteryCapacityKwh: parseNumber(fields.batteryCapacityKwh),
    acChargingKw: parseNumber(fields.acChargingKw),
    dcChargingKw: parseNumber(fields.dcChargingKw),
    acChargingTimeHours: parseNumber(fields.acChargingTimeHours),
    dcChargingTimeMinutes: parseNumber(fields.dcChargingTimeMinutes),
    powerPs: parseNumber(fields.powerPs),
    torqueNm: parseNumber(fields.torqueNm),
    airbags: parseNumber(fields.airbags),
    ncapRating: parseNumber(fields.ncapRating),
    adas: features.adas,
    lengthMm: parseNumber(fields.lengthMm),
    widthMm: parseNumber(fields.widthMm),
    heightMm: parseNumber(fields.heightMm),
    bootSpaceL: parseNumber(fields.bootSpaceL),
    features,
    variants: dossier.variants || [],
  };
}

/**
 * Score a catalog vehicle or golden dossier.
 * @param {object} vehicleOrDossier
 * @param {object} options
 * @returns {object}
 */
export function scoreVehicle(vehicleOrDossier, options = {}) {
  const signals = extractScoringSignals(vehicleOrDossier);
  const variants = options.variants || signals.variants || [];
  return scoreVehicleFromSignals(signals, { variants });
}

/**
 * Map v1 scores to legacy evScores shape for compare/discovery compatibility.
 * @param {object|null} v1
 * @returns {object|null}
 */
export function toLegacyEvScores(v1) {
  if (!v1?.breakdown) return null;
  const b = v1.breakdown;
  const explanations = {};
  for (const [key, row] of Object.entries(b)) {
    if (row?.explanation) explanations[key] = row.explanation;
  }

  return {
    version: 1,
    engine: "evsavari-score-v1",
    composite: v1.overall?.score ?? null,
    grade: v1.overall?.grade ?? null,
    subScores: {
      chargingConvenience: b.charging?.score ?? null,
      cityUsability: b.city?.score ?? null,
      highwayUsability: b.highway?.score ?? null,
      ownershipAffordability: b.value?.score ?? null,
      technologyFeatures: b.feature?.score ?? null,
      practicality: b.family?.score ?? null,
      range: b.range?.score ?? null,
      performance: b.performance?.score ?? null,
      safety: b.safety?.score ?? null,
    },
    explanations,
    hasData: v1.hasData === true,
  };
}

/**
 * Attach v1 scores to a vehicle clone.
 * @param {object} vehicle
 * @param {object} options
 * @returns {object}
 */
export function withEvsavariScores(vehicle, options = {}) {
  if (!vehicle) return vehicle;
  const variants = options.variants || vehicle.variants || [];
  const scored = scoreVehicle(vehicle, { variants });
  const legacy = toLegacyEvScores(scored);

  return {
    ...vehicle,
    evSavariScores: scored,
    evScores: legacy ?? vehicle.evScores,
  };
}

/**
 * Score and rank multiple vehicles.
 * @param {object[]} vehicles
 * @param {object} options
 * @returns {object}
 */
export function scoreAndRankVehicles(vehicles = [], options = {}) {
  const entries = (vehicles || [])
    .filter(Boolean)
    .map((vehicle) => ({
      vehicle,
      scored: scoreVehicle(vehicle, { variants: vehicle.variants }),
    }));

  const categoryRankings = buildCategoryRankings(entries, options);

  return {
    entries,
    categoryRankings,
    rankByCategory: (categoryId, rankOptions) =>
      rankByCategory(entries, categoryId, rankOptions),
  };
}

export { extractScoringSignals as extractSignals };
