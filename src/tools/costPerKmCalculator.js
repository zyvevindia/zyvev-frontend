import { buildRangeConfidence } from "../intelligence/rangeConfidence.js";
import { resolveOwnershipEfficiency } from "../intelligence/buildOwnershipCostScore.js";
import { computeEfficiencyKmPerKwh } from "../scoring/scoreNormalization.js";
import {
  COST_PER_KM_BOUNDS,
  COST_PER_KM_DEFAULTS,
  COST_PER_KM_PUBLIC_MULTIPLIER,
  COST_PER_KM_SAVINGS_TIERS,
} from "./costPerKmDefaults.js";

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function parseNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clampCostPerKmValue(value, min, max) {
  const n = parseNumber(value);
  if (n == null) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {number|null}
 */
function resolveBatteryKwh(vehicle) {
  const specs = vehicle?.specifications || {};
  const meta = vehicle?.catalogMeta || {};

  return (
    parseNumber(meta.batteryCapacityKwh) ??
    parseNumber(specs.batteryCapacity) ??
    parseNumber(specs.batteryPack) ??
    parseNumber(vehicle?.battery)
  );
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {number|null}
 */
function resolveRealWorldRangeKmMid(vehicle) {
  if (!vehicle) return null;

  const candidates = [
    vehicle.realWorldRangeKm,
    vehicle.catalogMeta?.realWorldRangeKm,
    vehicle.range?.realWorldKm,
  ];

  for (const direct of candidates) {
    if (direct && typeof direct === "object") {
      const min = parseNumber(direct.min);
      const max = parseNumber(direct.max);
      if (min != null && max != null && min > 0 && max > 0) {
        return (min + max) / 2;
      }
    }

    const single = parseNumber(direct);
    if (single != null && single > 0) {
      return single;
    }
  }

  try {
    const confidence = buildRangeConfidence(vehicle);
    const estimated = confidence?.estimatedRealWorldKm;
    if (estimated && typeof estimated === "object") {
      const min = parseNumber(estimated.min);
      const max = parseNumber(estimated.max);
      if (min != null && max != null && min > 0 && max > 0) {
        return (min + max) / 2;
      }
    }
  } catch {
    // Fall through to claimed-efficiency resolver.
  }

  return null;
}

/**
 * Resolve real-world km/kWh for calculator prefill.
 * @param {object|null|undefined} vehicle
 * @param {object[]} [variants]
 * @returns {{ efficiencyKmPerKwh: number, fromRealWorld: boolean }|null}
 */
export function resolveVehicleCostPerKmEfficiency(vehicle, variants = []) {
  const pool = variants.length ? variants : vehicle ? [vehicle] : [];
  if (!pool.length) return null;

  const efficiencies = [];

  for (const item of pool) {
    const realWorldKm = resolveRealWorldRangeKmMid(item);
    const batteryKwh = resolveBatteryKwh(item);
    const fromRealWorld = computeEfficiencyKmPerKwh(realWorldKm, batteryKwh);
    if (fromRealWorld != null && fromRealWorld > 0) {
      efficiencies.push(fromRealWorld);
    }
  }

  if (efficiencies.length) {
    const average =
      efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length;
    return {
      efficiencyKmPerKwh:
        Math.round(
          clampCostPerKmValue(
            average,
            COST_PER_KM_BOUNDS.efficiencyMin,
            COST_PER_KM_BOUNDS.efficiencyMax
          ) * 100
        ) / 100,
      fromRealWorld: true,
    };
  }

  const fallback = resolveOwnershipEfficiency(vehicle || pool[0]);
  if (!fallback?.efficiencyKmPerKwh) return null;

  return {
    efficiencyKmPerKwh: clampCostPerKmValue(
      fallback.efficiencyKmPerKwh,
      COST_PER_KM_BOUNDS.efficiencyMin,
      COST_PER_KM_BOUNDS.efficiencyMax
    ),
    fromRealWorld: false,
  };
}

/**
 * @param {{
 *   homeTariffInr?: number,
 *   homeChargingPct?: number,
 *   efficiencyKmPerKwh?: number,
 * }} input
 * @returns {{
 *   effectiveRateInr: number,
 *   publicTariffInr: number,
 *   publicChargingPct: number,
 *   costPerKm: number,
 * }}
 */
export function calculateCostPerKm(input = {}) {
  const homeTariffInr = clampCostPerKmValue(
    input.homeTariffInr ?? COST_PER_KM_DEFAULTS.homeTariffInr,
    COST_PER_KM_BOUNDS.homeTariffMin,
    COST_PER_KM_BOUNDS.homeTariffMax
  );
  const homeChargingPct = clampCostPerKmValue(
    input.homeChargingPct ?? COST_PER_KM_DEFAULTS.homeChargingPct,
    COST_PER_KM_BOUNDS.homeChargingPctMin,
    COST_PER_KM_BOUNDS.homeChargingPctMax
  );
  const efficiencyKmPerKwh = clampCostPerKmValue(
    input.efficiencyKmPerKwh ?? COST_PER_KM_DEFAULTS.efficiencyKmPerKwh,
    COST_PER_KM_BOUNDS.efficiencyMin,
    COST_PER_KM_BOUNDS.efficiencyMax
  );

  const publicChargingPct = Math.max(0, 100 - homeChargingPct);
  const homeShare = homeChargingPct / 100;
  const publicShare = publicChargingPct / 100;
  const publicTariffInr = homeTariffInr * COST_PER_KM_PUBLIC_MULTIPLIER;
  const effectiveRateInr =
    homeShare * homeTariffInr + publicShare * publicTariffInr;
  const costPerKm = effectiveRateInr / efficiencyKmPerKwh;

  return {
    effectiveRateInr: roundCurrency(effectiveRateInr),
    publicTariffInr: roundCurrency(publicTariffInr),
    publicChargingPct,
    costPerKm: roundCostPerKm(costPerKm),
  };
}

/**
 * @param {number} costPerKm
 * @param {number} [monthlyKm]
 * @returns {number}
 */
export function calculateMonthlyCost(
  costPerKm,
  monthlyKm = COST_PER_KM_DEFAULTS.monthlyKm
) {
  const rate = parseNumber(costPerKm);
  const km = parseNumber(monthlyKm);
  if (rate == null || km == null) return 0;
  return roundCurrency(rate * km);
}

/**
 * @param {number} costPerKm
 * @param {number} [yearlyKm]
 * @returns {number}
 */
export function calculateYearlyCost(
  costPerKm,
  yearlyKm = COST_PER_KM_DEFAULTS.yearlyKm
) {
  const rate = parseNumber(costPerKm);
  const km = parseNumber(yearlyKm);
  if (rate == null || km == null) return 0;
  return roundCurrency(rate * km);
}

/**
 * @param {number} costPerKm
 * @returns {{ label: string, tone: string }}
 */
export function resolveCostPerKmSavingsTier(costPerKm) {
  const rate = parseNumber(costPerKm);
  if (rate == null) {
    return { label: "Moderate", tone: "moderate" };
  }

  for (const tier of COST_PER_KM_SAVINGS_TIERS) {
    if (rate <= tier.max) {
      return { label: tier.label, tone: tier.tone };
    }
  }

  return { label: "High", tone: "high" };
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatCostPerKmRate(value) {
  const rate = parseNumber(value);
  if (rate == null) return "—";
  return `₹${rate.toFixed(2)}/km`;
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatOwnershipToolInr(value) {
  const amount = parseNumber(value);
  if (amount == null) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function roundCostPerKm(value) {
  return Math.round(value * 100) / 100;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
