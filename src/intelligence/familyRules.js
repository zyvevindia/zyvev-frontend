import {
  FAMILY_SCORE_WEIGHTS,
  FAMILY_SUITABILITY_LABELS,
  MICRO_EV_BATTERY_KWH_THRESHOLD,
  MICRO_EV_BOOT_SPACE_DEFAULT_L,
  SEGMENT_BOOT_SPACE_DEFAULTS_L,
} from "./constants.js";
import { isPresent } from "./governance.js";
import { weightedAverage } from "../scoring/scoreNormalization.js";

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

function parseBootSpaceLiters(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }

  const match = String(raw).match(/(\d+(?:\.\d+)?)\s*l/i);
  return match ? Number(match[1]) : null;
}

/**
 * @param {number|null|undefined} bootSpaceL
 * @returns {number|null}
 */
export function bootSpaceLitersToFamilyScore(bootSpaceL) {
  const liters = parseNumber(bootSpaceL);
  if (liters == null) return null;
  if (liters <= 180) return 38;
  if (liters <= 260) return 54;
  if (liters <= 330) return 68;
  if (liters <= 390) return 80;
  if (liters <= 450) return 88;
  return 94;
}

/**
 * @param {number|null|undefined} batteryKwh
 * @returns {number|null}
 */
export function batteryKwhToFamilyScore(batteryKwh) {
  const kwh = parseNumber(batteryKwh);
  if (kwh == null) return null;
  if (kwh < 18) return 48;
  if (kwh < 24) return 58;
  if (kwh < 32) return 80;
  if (kwh < 48) return 86;
  if (kwh <= 62) return 94;
  return 90;
}

/**
 * @param {number|null|undefined} realWorldRangeKm
 * @returns {number|null}
 */
export function realWorldRangeKmToFamilyScore(realWorldRangeKm) {
  const km = parseNumber(realWorldRangeKm);
  if (km == null) return null;
  if (km < 170) return 50;
  if (km < 210) return 76;
  if (km < 260) return 80;
  if (km < 340) return 88;
  return 95;
}

/**
 * @param {import("./types.js").FamilyScoreContext} ctx
 * @returns {number|null}
 */
export function dimensionsToFamilyScore(ctx) {
  if (ctx.isMicroEv) return 52;

  const scores = {
    hatchback: 54,
    compact_suv: 76,
    suv: 86,
    sedan: 84,
    luxury_suv: 88,
    mpv: 92,
    coupe_suv: 74,
  };

  if (ctx.segment && scores[ctx.segment] != null) {
    return scores[ctx.segment];
  }

  const lengthMm = parseNumber(ctx.lengthMm);
  const wheelbaseMm = parseNumber(ctx.wheelbaseMm);

  if (wheelbaseMm != null) {
    if (wheelbaseMm >= 2700) return 88;
    if (wheelbaseMm >= 2500) return 80;
    if (wheelbaseMm >= 2300) return 70;
    return 58;
  }

  if (lengthMm != null) {
    if (lengthMm >= 4600) return 86;
    if (lengthMm >= 4300) return 80;
    if (lengthMm >= 4000) return 72;
    if (lengthMm >= 3700) return 62;
    return 52;
  }

  return 65;
}

/**
 * @param {import("./types.js").FamilyScoreContext} ctx
 * @returns {number}
 */
export function resolveFamilySegmentBonus(ctx) {
  if (ctx.isMicroEv) return 0;

  const batteryKwh = parseNumber(ctx.batteryKwh);
  const realWorldRangeKmMid = parseNumber(ctx.realWorldRangeKmMid);
  const segment = ctx.segment;

  if (segment === "luxury_suv" || segment === "mpv") return 4;

  if (
    segment === "suv" &&
    batteryKwh != null &&
    batteryKwh >= 45 &&
    realWorldRangeKmMid != null &&
    realWorldRangeKmMid >= 320
  ) {
    return 3;
  }

  if (
    segment === "suv" &&
    batteryKwh != null &&
    batteryKwh >= 24 &&
    realWorldRangeKmMid != null &&
    realWorldRangeKmMid >= 200
  ) {
    return 8;
  }

  if (
    segment === "compact_suv" &&
    batteryKwh != null &&
    batteryKwh >= 24 &&
    realWorldRangeKmMid != null &&
    realWorldRangeKmMid >= 200
  ) {
    return 6;
  }

  return 0;
}

/**
 * @param {string|null|undefined} segment
 * @param {number|null|undefined} batteryKwh
 * @returns {number|null}
 */
export function resolveSegmentBootSpaceDefault(segment, batteryKwh) {
  const battery = parseNumber(batteryKwh);
  if (battery != null && battery < MICRO_EV_BATTERY_KWH_THRESHOLD) {
    return MICRO_EV_BOOT_SPACE_DEFAULT_L;
  }

  if (segment && SEGMENT_BOOT_SPACE_DEFAULTS_L[segment] != null) {
    return SEGMENT_BOOT_SPACE_DEFAULTS_L[segment];
  }

  return SEGMENT_BOOT_SPACE_DEFAULTS_L.suv;
}

/**
 * Resolve boot space from catalog fields or segment defaults.
 * @param {object|null|undefined} vehicle
 * @param {import("./types.js").FamilyScoreContext} ctx
 * @returns {{ bootSpaceL: number|null, estimated: boolean }}
 */
export function resolveFamilyBootSpace(vehicle, ctx) {
  const specs = vehicle?.specifications || {};
  const meta = vehicle?.catalogMeta || {};
  const variant = vehicle?.variants?.[0];

  const candidates = [
    ctx.bootSpaceL,
    specs.bootSpaceL,
    specs.bootSpace,
    meta.bootSpaceL,
    meta.dimensions?.bootSpaceL,
    meta.dimensions?.bootSpace,
    variant?.specs?.bootSpaceL,
    variant?.specs?.bootSpace,
    variant?.compareSpecs?.bootSpaceL,
  ];

  for (const raw of candidates) {
    const liters = parseBootSpaceLiters(raw);
    if (liters != null) {
      return { bootSpaceL: liters, estimated: false };
    }
  }

  const fallback = resolveSegmentBootSpaceDefault(ctx.segment, ctx.batteryKwh);
  return { bootSpaceL: fallback, estimated: true };
}

/**
 * @param {Partial<Record<keyof typeof FAMILY_SCORE_WEIGHTS, number|null|undefined>>} components
 * @returns {number|null}
 */
export function combineFamilyScoreComponents(components) {
  return weightedAverage(components, FAMILY_SCORE_WEIGHTS);
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {number}
 */
export function resolveCatalogTrustFamilyBonus(vehicle) {
  const level = String(
    vehicle?.verificationLevel || vehicle?.catalogMeta?.verificationLevel || ""
  ).toLowerCase();

  if (
    level === "verified_dossier" ||
    level === "verified" ||
    level === "golden"
  ) {
    return 1;
  }

  return 0;
}

/**
 * @param {number|null|undefined} score
 * @param {import("./types.js").FamilyScoreContext} ctx
 * @param {object|null|undefined} [vehicle]
 * @returns {number|null}
 */
export function finalizeFamilyScore(score, ctx, vehicle = null) {
  const base = parseNumber(score);
  if (base == null) return null;

  return clampScore(
    base +
      resolveFamilySegmentBonus(ctx) +
      resolveCatalogTrustFamilyBonus(vehicle)
  );
}

/**
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function resolveFamilySuitabilityLabel(score) {
  const n = parseNumber(score);
  if (n == null) return FAMILY_SUITABILITY_LABELS.at(-1).label;

  for (const tier of FAMILY_SUITABILITY_LABELS) {
    if (n >= tier.min) return tier.label;
  }

  return FAMILY_SUITABILITY_LABELS.at(-1).label;
}

/**
 * @param {import("./types.js").FamilyScoreContext} ctx
 * @returns {Partial<Record<keyof typeof FAMILY_SCORE_WEIGHTS, number|null>>}
 */
export function buildFamilyScoreComponents(ctx) {
  const bootScore = bootSpaceLitersToFamilyScore(ctx.bootSpaceL);
  const rangeScore = realWorldRangeKmToFamilyScore(ctx.realWorldRangeKmMid);
  const batteryScore = batteryKwhToFamilyScore(ctx.batteryKwh);
  const dimensionScore = dimensionsToFamilyScore(ctx);

  return {
    bootSpace: bootScore,
    realWorldRange: rangeScore,
    battery: batteryScore,
    dimensions: dimensionScore,
    highway: parseNumber(ctx.highwayScore),
    overall: parseNumber(ctx.overallScore),
    safety: parseNumber(ctx.safetyScore),
  };
}

/**
 * @param {import("./types.js").FamilyScoreContext} ctx
 * @returns {number|null}
 */
export function computeFamilyScore(ctx, vehicle = null) {
  const combined = combineFamilyScoreComponents(buildFamilyScoreComponents(ctx));
  return finalizeFamilyScore(combined, ctx, vehicle);
}
