import {
  HIGHWAY_CONFIDENCE_ASSUMPTIONS,
  HIGHWAY_CONFIDENCE_LABELS,
  RANGE_HIGHWAY_FACTORS,
} from "./constants.js";
import { isPresent, parseKwhFromText } from "./governance.js";
import { buildRangeConfidence } from "./rangeConfidence.js";
import {
  buildChargingPracticalityContext,
  dcChargingMinutesToScore,
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

function resolveBatteryKwh(vehicle) {
  const variant = vehicle?.variants?.[0];
  const specs = vehicle?.specifications || variant?.specifications || {};
  const meta = vehicle?.catalogMeta || variant?.catalogMeta || {};

  return (
    parseNumber(variant?.batteryKwh) ??
    parseNumber(variant?.compareSpecs?.batteryKwh) ??
    parseNumber(meta.batteryCapacityKwh) ??
    parseKwhFromText(variant?.battery) ??
    parseKwhFromText(specs.batteryPack || specs.batteryCapacity || vehicle?.battery)
  );
}

function resolveClaimedRangeKm(vehicle) {
  const variant = vehicle?.variants?.[0];
  const specs = vehicle?.specifications || variant?.specifications || {};
  const meta = vehicle?.catalogMeta || variant?.catalogMeta || {};

  return (
    parseNumber(meta.claimedRangeKm) ??
    parseNumber(variant?.rangeKmClaimed) ??
    parseNumber(specs.range) ??
    parseNumber(vehicle?.range) ??
    parseNumber(vehicle?.maxRange)
  );
}

function resolveRealWorldRangeMid(vehicle, rangeIntel) {
  const meta = vehicle?.catalogMeta || {};
  const catalogRw = meta.realWorldRangeKm;

  if (catalogRw && isPresent(catalogRw.min) && isPresent(catalogRw.max)) {
    return (Number(catalogRw.min) + Number(catalogRw.max)) / 2;
  }

  const mixed = rangeIntel?.mixedUsageRangeKm;
  if (mixed && isPresent(mixed.min) && isPresent(mixed.max)) {
    return (Number(mixed.min) + Number(mixed.max)) / 2;
  }

  const estimated = rangeIntel?.estimatedRealWorldKm;
  if (estimated && isPresent(estimated.min) && isPresent(estimated.max)) {
    return (Number(estimated.min) + Number(estimated.max)) / 2;
  }

  return null;
}

/**
 * Resolve conservative highway planning range from real-world and claimed data.
 * @param {object|null|undefined} vehicle
 * @param {object|null|undefined} rangeIntel
 * @returns {{ highwayPlanningRangeKm: number|null, estimated: boolean }}
 */
export function resolveHighwayPlanningRangeKm(vehicle, rangeIntel = null) {
  const intel = rangeIntel || buildRangeConfidence(vehicle || {});
  const highwayBand = intel?.highwayRangeKm;

  if (highwayBand && isPresent(highwayBand.min)) {
    return {
      highwayPlanningRangeKm: Number(highwayBand.min),
      estimated: intel?.estimated !== false,
    };
  }

  const claimed = resolveClaimedRangeKm(vehicle);
  if (claimed != null && claimed > 0) {
    return {
      highwayPlanningRangeKm: Math.round(claimed * RANGE_HIGHWAY_FACTORS.min),
      estimated: true,
    };
  }

  const realWorldMid = resolveRealWorldRangeMid(vehicle, intel);
  if (realWorldMid != null && realWorldMid > 0) {
    return {
      highwayPlanningRangeKm: Math.round(realWorldMid * RANGE_HIGHWAY_FACTORS.min),
      estimated: true,
    };
  }

  return { highwayPlanningRangeKm: null, estimated: false };
}

/**
 * @param {number|null|undefined} highwayPlanningRangeKm
 * @returns {number|null}
 */
export function highwayPlanningRangeToScore(highwayPlanningRangeKm) {
  const km = parseNumber(highwayPlanningRangeKm);
  if (km == null) return null;
  if (km >= 280) return 92;
  if (km >= 220) return 84;
  if (km >= 180) return 74;
  if (km >= 150) return 62;
  if (km >= 120) return 50;
  if (km >= 90) return 38;
  return 28;
}

/**
 * @param {number|null|undefined} batteryKwh
 * @returns {number|null}
 */
export function highwayBatteryKwhToScore(batteryKwh) {
  const kwh = parseNumber(batteryKwh);
  if (kwh == null) return null;
  if (kwh >= 70) return 90;
  if (kwh >= 50) return 78;
  if (kwh >= 35) return 68;
  if (kwh >= 25) return 58;
  if (kwh >= 18) return 48;
  return 35;
}

/**
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function resolveHighwayConfidenceLabel(score) {
  const n = parseNumber(score);
  if (n == null) return HIGHWAY_CONFIDENCE_LABELS.at(-1).label;

  for (const tier of HIGHWAY_CONFIDENCE_LABELS) {
    if (n >= tier.min) return tier.label;
  }

  return HIGHWAY_CONFIDENCE_LABELS.at(-1).label;
}

/**
 * @param {number|null|undefined} rangeScore
 * @param {number|null|undefined} dcScore
 * @param {number|null|undefined} batteryScore
 * @returns {number|null}
 */
export function combineHighwayConfidenceScore(
  rangeScore,
  dcScore,
  batteryScore
) {
  const {
    rangeScoreWeight,
    dcScoreWeight,
    batteryScoreWeight,
  } = HIGHWAY_CONFIDENCE_ASSUMPTIONS;

  let totalWeight = 0;
  let weighted = 0;

  if (rangeScore != null) {
    weighted += rangeScore * rangeScoreWeight;
    totalWeight += rangeScoreWeight;
  }
  if (dcScore != null) {
    weighted += dcScore * dcScoreWeight;
    totalWeight += dcScoreWeight;
  }
  if (batteryScore != null) {
    weighted += batteryScore * batteryScoreWeight;
    totalWeight += batteryScoreWeight;
  }

  if (totalWeight <= 0) return null;
  return clampScore(weighted / totalWeight);
}

/**
 * Build normalized highway confidence context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @param {{ highwayPlanningRangeKm?: number|null, dcChargingMinutes?: number|null, batteryKwh?: number|null }} [options]
 * @returns {import("./types.js").HighwayConfidenceContext}
 */
export function buildHighwayConfidenceContext(vehicle, options = {}) {
  const rangeIntel = buildRangeConfidence(vehicle || {});
  const chargingCtx = buildChargingPracticalityContext(vehicle, {
    dcChargingMinutes: options.dcChargingMinutes,
    batteryKwh: options.batteryKwh,
  });

  const rangeOverride = parseNumber(options.highwayPlanningRangeKm);
  const rangeResolved =
    rangeOverride != null
      ? { highwayPlanningRangeKm: rangeOverride, estimated: false }
      : resolveHighwayPlanningRangeKm(vehicle, rangeIntel);

  const batteryKwh =
    parseNumber(options.batteryKwh) ??
    chargingCtx.batteryKwh ??
    resolveBatteryKwh(vehicle);

  return {
    highwayPlanningRangeKm: rangeResolved.highwayPlanningRangeKm,
    realWorldRangeKmMid: resolveRealWorldRangeMid(vehicle, rangeIntel),
    dcChargingMinutes: chargingCtx.dcChargingMinutes,
    batteryKwh,
    rangeEstimated: rangeResolved.estimated,
    dcTimeEstimated: chargingCtx.dcTimeEstimated,
  };
}

/**
 * Deterministic highway confidence from real-world range, DC charging, and battery size.
 * @param {object|null|undefined} vehicle
 * @param {{ highwayPlanningRangeKm?: number|null, dcChargingMinutes?: number|null, batteryKwh?: number|null }} [options]
 * @returns {import("./types.js").HighwayConfidenceScoreResult}
 */
export function buildHighwayConfidenceScore(vehicle, options = {}) {
  const ctx = buildHighwayConfidenceContext(vehicle, options);

  const score = combineHighwayConfidenceScore(
    highwayPlanningRangeToScore(ctx.highwayPlanningRangeKm),
    dcChargingMinutesToScore(ctx.dcChargingMinutes),
    highwayBatteryKwhToScore(ctx.batteryKwh)
  );

  return {
    score: score ?? MIN_SCORE,
    label: resolveHighwayConfidenceLabel(score),
  };
}
