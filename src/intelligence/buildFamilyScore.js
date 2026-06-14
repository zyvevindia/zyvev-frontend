import { scoreVehicle } from "../scoring/scoreEngine.js";
import { classifyFamilyBodyType } from "./bodyTypeCatalog.js";
import { buildScoreExplanationContext } from "./buildScoreExplanation.js";
import {
  computeFamilyScore,
  resolveFamilyBootSpace,
  resolveFamilySuitabilityLabel,
} from "./familyRules.js";
import { buildRangeConfidence } from "./rangeConfidence.js";
import { MICRO_EV_BATTERY_KWH_THRESHOLD } from "./constants.js";
import { isPresent, parseKwhFromText } from "./governance.js";

const MIN_SCORE = 0;

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function coalesce(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function resolveBatteryKwh(vehicle) {
  const variant = vehicle?.variants?.[0];
  const specs = vehicle?.specifications || variant?.specifications || {};
  const meta = vehicle?.catalogMeta || variant?.catalogMeta || {};

  return (
    parseNumber(variant?.batteryKwh) ??
    parseNumber(variant?.compareSpecs?.batteryKwh) ??
    parseNumber(meta.batteryCapacityKwh) ??
    parseKwhFromText(specs.batteryPack || specs.batteryCapacity || vehicle?.battery)
  );
}

function resolveOverallScore(vehicle) {
  const existing =
    parseNumber(vehicle?.evSavariScores?.overall?.score) ??
    parseNumber(vehicle?.evSavariScores?.composite) ??
    parseNumber(vehicle?.evScores?.composite);

  if (existing != null) return existing;

  try {
    const scored = scoreVehicle(vehicle, { variants: vehicle?.variants });
    return parseNumber(scored?.overall?.score);
  } catch {
    return null;
  }
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

function resolveDimensions(vehicle) {
  const meta = vehicle?.catalogMeta || {};
  const specs = vehicle?.specifications || {};
  const dimensions = meta.dimensions || specs.dimensions || {};

  return {
    lengthMm: parseNumber(
      coalesce(dimensions.lengthMm, dimensions.length, specs.lengthMm)
    ),
    widthMm: parseNumber(
      coalesce(dimensions.widthMm, dimensions.width, specs.widthMm)
    ),
    wheelbaseMm: parseNumber(
      coalesce(dimensions.wheelbaseMm, dimensions.wheelbase, specs.wheelbaseMm)
    ),
  };
}

/**
 * Build normalized family suitability context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").FamilyScoreContext>} [options]
 * @returns {import("./types.js").FamilyScoreContext}
 */
export function buildFamilyContext(vehicle, options = {}) {
  const explanationCtx = buildScoreExplanationContext(vehicle);
  const rangeIntel = options.rangeIntel ?? buildRangeConfidence(vehicle || {});
  const batteryKwh =
    parseNumber(options.batteryKwh) ?? resolveBatteryKwh(vehicle);
  const segment =
    options.segment ?? classifyFamilyBodyType(vehicle) ?? "suv";
  const isMicroEv =
    options.isMicroEv ??
    (batteryKwh != null && batteryKwh < MICRO_EV_BATTERY_KWH_THRESHOLD);
  const dimensions = resolveDimensions(vehicle);

  const draftCtx = {
    segment,
    batteryKwh,
    isMicroEv,
    bootSpaceL: parseNumber(options.bootSpaceL),
    realWorldRangeKmMid:
      parseNumber(options.realWorldRangeKmMid) ??
      resolveRealWorldRangeMid(vehicle, rangeIntel),
    highwayScore:
      parseNumber(options.highwayScore) ?? explanationCtx.highwayScore,
    overallScore:
      parseNumber(options.overallScore) ?? resolveOverallScore(vehicle),
    safetyScore:
      parseNumber(options.safetyScore) ?? explanationCtx.safetyScore,
    lengthMm: parseNumber(options.lengthMm) ?? dimensions.lengthMm,
    widthMm: parseNumber(options.widthMm) ?? dimensions.widthMm,
    wheelbaseMm: parseNumber(options.wheelbaseMm) ?? dimensions.wheelbaseMm,
    bootSpaceEstimated: false,
  };

  const bootResolved = resolveFamilyBootSpace(vehicle, draftCtx);

  return {
    ...draftCtx,
    bootSpaceL: bootResolved.bootSpaceL,
    bootSpaceEstimated: bootResolved.estimated,
  };
}

/**
 * Deterministic family suitability from boot space, range, battery, and usage scores.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").FamilyScoreContext>} [options]
 * @returns {import("./types.js").FamilyScoreResult}
 */
export function buildFamilyScore(vehicle, options = {}) {
  const ctx = buildFamilyContext(vehicle, options);
  const score = computeFamilyScore(ctx, vehicle);

  return {
    score: score ?? MIN_SCORE,
    label: resolveFamilySuitabilityLabel(score),
  };
}
