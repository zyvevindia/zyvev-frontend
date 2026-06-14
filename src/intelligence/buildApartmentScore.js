import {
  APARTMENT_SUITABILITY_ASSUMPTIONS,
  APARTMENT_SUITABILITY_LABELS,
} from "./constants.js";
import { buildScoreExplanationContext } from "./buildScoreExplanation.js";
import {
  acChargingHoursToScore,
  buildChargingPracticalityContext,
} from "./buildChargingPracticalityScore.js";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clampScore(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(MAX_SCORE, Math.max(MIN_SCORE, n)));
}

/**
 * Apartment-friendly battery sizing — moderate packs balance overnight AC time and daily range.
 * @param {number|null|undefined} batteryKwh
 * @returns {number|null}
 */
export function apartmentBatteryKwhToScore(batteryKwh) {
  const kwh = parseNumber(batteryKwh);
  if (kwh == null) return null;
  if (kwh >= 20 && kwh <= 32) return 88;
  if (kwh >= 17 && kwh <= 38) return 78;
  if (kwh >= 15 && kwh <= 45) return 68;
  if (kwh < 15) return 58;
  if (kwh <= 55) return 56;
  return 42;
}

/**
 * Resolve city usage score from EVSavari breakdown or catalog suitability metadata.
 * @param {object|null|undefined} vehicle
 * @returns {{ cityScore: number|null, estimated: boolean }}
 */
export function resolveApartmentCityScore(vehicle) {
  const explanationCtx = buildScoreExplanationContext(vehicle);
  if (explanationCtx.cityScore != null) {
    return { cityScore: explanationCtx.cityScore, estimated: false };
  }

  const metaScore = parseNumber(vehicle?.catalogMeta?.suitabilityScores?.city);
  if (metaScore != null) {
    return { cityScore: metaScore, estimated: false };
  }

  const ownershipMeta = vehicle?.ownershipMeta || {};
  if (ownershipMeta.apartmentFriendly === true) {
    return { cityScore: 72, estimated: true };
  }

  const rangeKm = parseNumber(
    vehicle?.catalogMeta?.claimedRangeKm ??
      vehicle?.specifications?.range ??
      vehicle?.range
  );
  if (rangeKm != null && rangeKm >= 200 && rangeKm <= 350) {
    return { cityScore: 68, estimated: true };
  }

  return { cityScore: null, estimated: false };
}

/**
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function resolveApartmentSuitabilityLabel(score) {
  const n = parseNumber(score);
  if (n == null) return APARTMENT_SUITABILITY_LABELS.at(-1).label;

  for (const tier of APARTMENT_SUITABILITY_LABELS) {
    if (n >= tier.min) return tier.label;
  }

  return APARTMENT_SUITABILITY_LABELS.at(-1).label;
}

/**
 * @param {number|null|undefined} acScore
 * @param {number|null|undefined} cityScore
 * @param {number|null|undefined} batteryScore
 * @returns {number|null}
 */
export function combineApartmentSuitabilityScore(
  acScore,
  cityScore,
  batteryScore
) {
  const { acScoreWeight, cityScoreWeight, batteryScoreWeight } =
    APARTMENT_SUITABILITY_ASSUMPTIONS;

  let totalWeight = 0;
  let weighted = 0;

  if (acScore != null) {
    weighted += acScore * acScoreWeight;
    totalWeight += acScoreWeight;
  }
  if (cityScore != null) {
    weighted += cityScore * cityScoreWeight;
    totalWeight += cityScoreWeight;
  }
  if (batteryScore != null) {
    weighted += batteryScore * batteryScoreWeight;
    totalWeight += batteryScoreWeight;
  }

  if (totalWeight <= 0) return null;
  return clampScore(weighted / totalWeight);
}

/**
 * Build normalized apartment suitability context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @param {{ acChargingHours?: number|null, batteryKwh?: number|null, cityScore?: number|null }} [options]
 * @returns {import("./types.js").ApartmentSuitabilityContext}
 */
export function buildApartmentContext(vehicle, options = {}) {
  const chargingCtx = buildChargingPracticalityContext(vehicle, {
    acChargingHours: options.acChargingHours,
    batteryKwh: options.batteryKwh,
  });

  const cityOverride = parseNumber(options.cityScore);
  const cityResolved =
    cityOverride != null
      ? { cityScore: cityOverride, estimated: false }
      : resolveApartmentCityScore(vehicle);

  return {
    batteryKwh: chargingCtx.batteryKwh,
    acChargingHours: chargingCtx.acChargingHours,
    cityScore: cityResolved.cityScore,
    acTimeEstimated: chargingCtx.acTimeEstimated,
    cityScoreEstimated: cityResolved.estimated,
  };
}

/**
 * Deterministic apartment suitability from battery size, AC charging time, and city usage.
 * @param {object|null|undefined} vehicle
 * @param {{ acChargingHours?: number|null, batteryKwh?: number|null, cityScore?: number|null }} [options]
 * @returns {import("./types.js").ApartmentSuitabilityScoreResult}
 */
export function buildApartmentScore(vehicle, options = {}) {
  const ctx = buildApartmentContext(vehicle, options);

  const score = combineApartmentSuitabilityScore(
    acChargingHoursToScore(ctx.acChargingHours),
    parseNumber(ctx.cityScore),
    apartmentBatteryKwhToScore(ctx.batteryKwh)
  );

  return {
    score: score ?? MIN_SCORE,
    label: resolveApartmentSuitabilityLabel(score),
  };
}
