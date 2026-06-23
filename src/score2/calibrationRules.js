/**
 * Editorial calibration for Score 2.0 profiles.
 *
 * Adjusts qualitative tiers after {@link buildVehicleScoreProfile} so outputs
 * align with EVSavari editorial judgement. Does not modify intelligence sources.
 */

import { buildApartmentScore } from "../intelligence/buildApartmentScore.js";
import { buildChargingPracticalityContext } from "../intelligence/buildChargingPracticalityScore.js";
import { buildHighwayConfidenceContext } from "../intelligence/buildHighwayConfidenceScore.js";
import { buildOwnershipCostScore } from "../intelligence/buildOwnershipCostScore.js";
import { CHARGING_SPEED_TAXONOMY } from "../intelligence/taxonomy.js";
import { SCORE_TIERS } from "./constants.js";
import {
  isTierAtLeast,
  isTierAtMost,
  maxTier,
  tierAtLeast,
  tierAtMost,
} from "./scoreTierMapping.js";

/** @type {ReadonlySet<string>} */
export const FAMILY_GOOD_MINIMUM_SLUGS = Object.freeze(
  new Set([
    "mahindra-be-6",
    "mahindra-xev-9e",
    "byd-seal",
    "tata-curvv-ev",
    "tata-nexon-ev",
  ])
);

/** @type {ReadonlyArray<keyof import("./types.js").EvSavariScore>} */
const SCORE_DIMENSIONS = Object.freeze([
  "ownership",
  "charging",
  "highway",
  "family",
  "service",
  "value",
]);

/**
 * @param {object|null|undefined} vehicle
 * @returns {number|null}
 */
function parseNumber(value) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function resolveVehicleSlug(vehicle) {
  return String(
    vehicle?.familySlug || vehicle?.slug || vehicle?.fields?.familySlug || ""
  )
    .trim()
    .toLowerCase();
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {number|null}
 */
function resolveStartingPrice(vehicle) {
  const fields = vehicle?.fields || {};
  return (
    parseNumber(vehicle?.startingPrice) ??
    parseNumber(vehicle?.price) ??
    parseNumber(fields.startingPrice) ??
    parseNumber(fields.exShowroomPrice) ??
    null
  );
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {number|null}
 */
function resolveBatteryKwh(vehicle) {
  const fields = vehicle?.fields || {};
  const variant = vehicle?.variants?.[0];
  return (
    parseNumber(fields.batteryCapacityKwh) ??
    parseNumber(vehicle?.catalogMeta?.batteryCapacityKwh) ??
    parseNumber(variant?.batteryKwh) ??
    null
  );
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {number|null}
 */
function resolveRealWorldRangeKm(vehicle) {
  const highwayCtx = buildHighwayConfidenceContext(vehicle);
  const mid = parseNumber(highwayCtx.realWorldRangeKmMid);
  if (mid != null) return mid;

  const catalogRw = vehicle?.catalogMeta?.realWorldRangeKm;
  if (catalogRw && catalogRw.min != null && catalogRw.max != null) {
    return (Number(catalogRw.min) + Number(catalogRw.max)) / 2;
  }

  return null;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {boolean}
 */
function hasDcChargingAvailable(vehicle) {
  const fields = vehicle?.fields || {};
  const variant = vehicle?.variants?.[0];
  const chargingCtx = buildChargingPracticalityContext(vehicle);

  const dcKw =
    parseNumber(chargingCtx.dcChargingKw) ??
    parseNumber(fields.dcChargingKw) ??
    parseNumber(variant?.dcChargingKw);

  if (dcKw != null && dcKw > 0) return true;
  if (chargingCtx.dcChargingMinutes != null) return true;
  if (vehicle?.taxonomyTags?.fastCharging === true) return true;

  return false;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {boolean}
 */
function hasFastCharging(vehicle) {
  const fields = vehicle?.fields || {};
  const variant = vehicle?.variants?.[0];
  const chargingSpeed = vehicle?.taxonomyTags?.chargingSpeed;
  const dcKw =
    parseNumber(fields.dcChargingKw) ??
    parseNumber(variant?.dcChargingKw) ??
    parseNumber(buildChargingPracticalityContext(vehicle).dcChargingKw);

  if (
    chargingSpeed === CHARGING_SPEED_TAXONOMY.FAST ||
    chargingSpeed === CHARGING_SPEED_TAXONOMY.ULTRA
  ) {
    return true;
  }

  if (vehicle?.taxonomyTags?.fastCharging === true) return true;
  return dcKw != null && dcKw >= 50;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {boolean}
 */
function hasHomeChargingSuitability(vehicle) {
  if (vehicle?.taxonomyTags?.homeCharging === true) return true;

  const apartmentScore = buildApartmentScore(vehicle).score;
  if (apartmentScore != null && apartmentScore >= 55) return true;

  const fields = vehicle?.fields || {};
  const variant = vehicle?.variants?.[0];
  const acKw =
    parseNumber(fields.acChargingKw) ??
    parseNumber(variant?.acChargingKw) ??
    parseNumber(buildChargingPracticalityContext(vehicle).acChargingKw);

  return acKw != null && acKw > 0;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {boolean}
 */
export function isMicroEv(vehicle) {
  const slug = resolveVehicleSlug(vehicle);
  if (slug === "mg-comet-ev") return true;

  const batteryKwh = resolveBatteryKwh(vehicle);
  return batteryKwh != null && batteryKwh <= 20;
}

/**
 * @param {import("./types.js").EvSavariScore} score
 * @param {object|null|undefined} vehicle
 */
function calibrateHighwayTier(score, vehicle) {
  const realWorldRangeKm = resolveRealWorldRangeKm(vehicle);
  const dcAvailable = hasDcChargingAvailable(vehicle);
  const fastCharging = hasFastCharging(vehicle);

  if (realWorldRangeKm != null && realWorldRangeKm > 350 && dcAvailable) {
    score.highway = tierAtLeast(score.highway, SCORE_TIERS.MODERATE);
  }

  if (realWorldRangeKm != null && realWorldRangeKm > 450 && fastCharging) {
    score.highway = tierAtLeast(score.highway, SCORE_TIERS.GOOD);
  }
}

/**
 * @param {import("./types.js").EvSavariScore} score
 * @param {object|null|undefined} vehicle
 */
function calibrateFamilyTier(score, vehicle) {
  const slug = resolveVehicleSlug(vehicle);
  if (FAMILY_GOOD_MINIMUM_SLUGS.has(slug)) {
    score.family = tierAtLeast(score.family, SCORE_TIERS.GOOD);
  }
}

/**
 * @param {import("./types.js").EvSavariScore} score
 * @param {object|null|undefined} vehicle
 */
function calibrateValueTier(score, vehicle) {
  const startingPrice = resolveStartingPrice(vehicle);
  if (startingPrice == null) return;

  if (startingPrice <= 2_000_000) {
    score.value = tierAtLeast(score.value, SCORE_TIERS.MODERATE);
  }

  if (startingPrice <= 1_500_000) {
    score.value = tierAtLeast(score.value, SCORE_TIERS.GOOD);
  }
}

/**
 * @param {import("./types.js").EvSavariScore} score
 * @param {object|null|undefined} vehicle
 */
function calibrateOwnershipTier(score, vehicle) {
  const ownership = buildOwnershipCostScore(vehicle);
  const costPerKm = parseNumber(ownership.costPerKmMax);

  if (
    hasHomeChargingSuitability(vehicle) &&
    costPerKm != null &&
    costPerKm < 2
  ) {
    score.ownership = tierAtLeast(score.ownership, SCORE_TIERS.GOOD);
  }
}

/**
 * @param {import("./types.js").EvSavariScore} score
 * @param {import("./types.js").RecommendationProfile} recommendation
 * @param {object|null|undefined} vehicle
 */
function calibrateOverallTier(score, recommendation, vehicle) {
  let overall = score.overall;
  const slug = resolveVehicleSlug(vehicle);

  if (
    SCORE_DIMENSIONS.every((dimension) =>
      isTierAtMost(score[dimension], SCORE_TIERS.LIMITED)
    )
  ) {
    overall = SCORE_TIERS.LIMITED;
  }

  if (
    !isMicroEv(vehicle) &&
    isTierAtLeast(recommendation.cityBuyer, SCORE_TIERS.GOOD) &&
    isTierAtLeast(score.ownership, SCORE_TIERS.MODERATE) &&
    isTierAtLeast(score.value, SCORE_TIERS.MODERATE)
  ) {
    overall = maxTier(overall, SCORE_TIERS.GOOD);
  }

  if (
    recommendation.premiumBuyer === SCORE_TIERS.EXCELLENT &&
    isTierAtLeast(score.highway, SCORE_TIERS.GOOD) &&
    isTierAtLeast(score.family, SCORE_TIERS.GOOD)
  ) {
    overall = maxTier(overall, SCORE_TIERS.GOOD);
  }

  if (FAMILY_GOOD_MINIMUM_SLUGS.has(slug)) {
    overall = maxTier(overall, SCORE_TIERS.GOOD);
  }

  if (isMicroEv(vehicle)) {
    overall = tierAtLeast(overall, SCORE_TIERS.MODERATE);
    overall = tierAtMost(overall, SCORE_TIERS.MODERATE);
  }

  score.overall = overall;
}

/**
 * Apply editorial calibration to a built Score 2.0 profile.
 *
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {import("./types.js").VehicleScoreProfile}
 */
export function applyCalibration(profile, intelligenceCar) {
  if (!profile || typeof profile !== "object") {
    return profile;
  }

  const score = { ...profile.score };

  calibrateHighwayTier(score, intelligenceCar);
  calibrateFamilyTier(score, intelligenceCar);
  calibrateValueTier(score, intelligenceCar);
  calibrateOwnershipTier(score, intelligenceCar);
  calibrateOverallTier(score, profile.recommendation, intelligenceCar);

  return {
    ...profile,
    score,
  };
}
