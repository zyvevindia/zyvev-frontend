import {
  OWNERSHIP_ASSUMPTIONS,
  OWNERSHIP_COST_CONSERVATIVE_EFFICIENCY_FACTOR,
  OWNERSHIP_COST_LABELS,
} from "./constants.js";
import { isPresent, parseKwhFromText } from "./governance.js";
import { computeEfficiencyKmPerKwh } from "../scoring/scoreNormalization.js";

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

function roundCostPerKm(value) {
  return Math.round(value * 10) / 10;
}

function resolveBatteryKwh(vehicle) {
  const specs = vehicle?.specifications || {};
  const meta = vehicle?.catalogMeta || {};

  return (
    parseNumber(meta.batteryCapacityKwh) ??
    parseKwhFromText(specs.batteryPack || specs.batteryCapacity || vehicle?.battery) ??
    parseKwhFromText(meta.ownershipWarranty?.batteryCapacity)
  );
}

function resolveClaimedRangeKm(vehicle) {
  const specs = vehicle?.specifications || {};
  const meta = vehicle?.catalogMeta || {};

  return (
    parseNumber(meta.claimedRangeKm) ??
    parseNumber(specs.range) ??
    parseNumber(vehicle?.range) ??
    parseNumber(vehicle?.maxRange)
  );
}

/**
 * Resolve km/kWh from vehicle specs or an explicit override.
 * @param {object|null|undefined} vehicle
 * @param {number|null|undefined} overrideKmPerKwh
 * @returns {{ efficiencyKmPerKwh: number, estimated: boolean }}
 */
export function resolveOwnershipEfficiency(vehicle, overrideKmPerKwh = null) {
  const override = parseNumber(overrideKmPerKwh);
  if (override != null && override > 0) {
    return { efficiencyKmPerKwh: override, estimated: false };
  }

  const batteryKwh = resolveBatteryKwh(vehicle);
  const rangeKm = resolveClaimedRangeKm(vehicle);
  const fromSpecs = computeEfficiencyKmPerKwh(rangeKm, batteryKwh);

  if (fromSpecs != null && fromSpecs > 0) {
    return {
      efficiencyKmPerKwh: fromSpecs,
      estimated: !(isPresent(rangeKm) && isPresent(batteryKwh)),
    };
  }

  return {
    efficiencyKmPerKwh: OWNERSHIP_ASSUMPTIONS.defaultEfficiencyKmPerKwh,
    estimated: true,
  };
}

/**
 * @param {import("./types.js").OwnershipCostElectricityAssumptions} [overrides]
 * @returns {import("./types.js").OwnershipCostElectricityAssumptions}
 */
export function resolveOwnershipElectricityAssumptions(overrides = {}) {
  return {
    homeRateInr:
      parseNumber(overrides.homeRateInr) ??
      OWNERSHIP_ASSUMPTIONS.electricityRateHomeInr,
    blendedRateInr:
      parseNumber(overrides.blendedRateInr) ??
      OWNERSHIP_ASSUMPTIONS.electricityRateBlendedInr,
    petrolCostPerKmInr:
      parseNumber(overrides.petrolCostPerKmInr) ??
      OWNERSHIP_ASSUMPTIONS.petrolCostPerKmInr,
  };
}

/**
 * @param {number} costPerKmMax
 * @param {number} petrolCostPerKmInr
 * @returns {number}
 */
export function ownershipCostPerKmToScore(costPerKmMax, petrolCostPerKmInr) {
  const petrol = parseNumber(petrolCostPerKmInr);
  const cost = parseNumber(costPerKmMax);
  if (petrol == null || petrol <= 0 || cost == null || cost < 0) return null;

  const savingsRatio = Math.max(0, Math.min(1, (petrol - cost) / petrol));
  return clampScore(40 + savingsRatio * 53);
}

/**
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function resolveOwnershipCostLabel(score) {
  const n = parseNumber(score);
  if (n == null) return OWNERSHIP_COST_LABELS.at(-1).label;

  for (const tier of OWNERSHIP_COST_LABELS) {
    if (n >= tier.min) return tier.label;
  }

  return OWNERSHIP_COST_LABELS.at(-1).label;
}

/**
 * Build normalized ownership cost context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @param {{ efficiencyKmPerKwh?: number|null, electricityAssumptions?: import("./types.js").OwnershipCostElectricityAssumptions }} [options]
 * @returns {import("./types.js").OwnershipCostContext}
 */
export function buildOwnershipCostContext(vehicle, options = {}) {
  const { efficiencyKmPerKwh, estimated } = resolveOwnershipEfficiency(
    vehicle,
    options.efficiencyKmPerKwh
  );

  return {
    efficiencyKmPerKwh: Math.round(efficiencyKmPerKwh * 100) / 100,
    efficiencyEstimated: estimated,
    electricityAssumptions: resolveOwnershipElectricityAssumptions(
      options.electricityAssumptions
    ),
  };
}

/**
 * Deterministic ownership cost intelligence from battery efficiency and electricity assumptions.
 * @param {object|null|undefined} vehicle
 * @param {{ efficiencyKmPerKwh?: number|null, electricityAssumptions?: import("./types.js").OwnershipCostElectricityAssumptions }} [options]
 * @returns {import("./types.js").OwnershipCostScoreResult}
 */
export function buildOwnershipCostScore(vehicle, options = {}) {
  const ctx = buildOwnershipCostContext(vehicle, options);
  const { homeRateInr, blendedRateInr, petrolCostPerKmInr } =
    ctx.electricityAssumptions;
  const efficiency = ctx.efficiencyKmPerKwh;

  const conservativeEfficiency =
    efficiency * OWNERSHIP_COST_CONSERVATIVE_EFFICIENCY_FACTOR;

  const costPerKmMin = roundCostPerKm(homeRateInr / efficiency);
  const costPerKmMax = roundCostPerKm(blendedRateInr / conservativeEfficiency);
  const score = ownershipCostPerKmToScore(costPerKmMax, petrolCostPerKmInr);

  return {
    score: score ?? MIN_SCORE,
    costPerKmMin,
    costPerKmMax,
    label: resolveOwnershipCostLabel(score),
  };
}
