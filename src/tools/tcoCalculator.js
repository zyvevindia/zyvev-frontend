import { calculateCostPerKm } from "./costPerKmCalculator.js";
import { TCO_BOUNDS, TCO_DEFAULTS } from "./tcoDefaults.js";

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
export function clampTcoValue(value, min, max) {
  const n = parseNumber(value);
  if (n == null) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {number} vehiclePriceInr
 * @param {number} [residualPct]
 * @returns {{ residualValueInr: number, depreciationInr: number }}
 */
export function calculateDepreciation(
  vehiclePriceInr,
  residualPct = TCO_DEFAULTS.residualValuePct
) {
  const price = clampTcoValue(
    vehiclePriceInr,
    TCO_BOUNDS.vehiclePriceMin,
    TCO_BOUNDS.vehiclePriceMax
  );
  const pct = clampTcoValue(
    residualPct,
    TCO_BOUNDS.residualValuePctMin,
    TCO_BOUNDS.residualValuePctMax
  );

  const residualValueInr = roundCurrency(price * (pct / 100));
  const depreciationInr = roundCurrency(price - residualValueInr);

  return { residualValueInr, depreciationInr };
}

/**
 * @param {{
 *   annualKm?: number,
 *   ownershipYears?: number,
 *   homeTariffInr?: number,
 *   homeChargingPct?: number,
 *   efficiencyKmPerKwh?: number,
 * }} input
 * @returns {number}
 */
export function calculateEnergyCost(input = {}) {
  const annualKm = clampTcoValue(
    input.annualKm ?? TCO_DEFAULTS.annualKm,
    TCO_BOUNDS.annualKmMin,
    TCO_BOUNDS.annualKmMax
  );
  const years = clampTcoValue(
    input.ownershipYears ?? TCO_DEFAULTS.ownershipYears,
    TCO_BOUNDS.ownershipYearsMin,
    TCO_BOUNDS.ownershipYearsMax
  );

  const { costPerKm } = calculateCostPerKm({
    homeTariffInr: input.homeTariffInr,
    homeChargingPct: input.homeChargingPct,
    efficiencyKmPerKwh: input.efficiencyKmPerKwh,
  });

  return roundCurrency(annualKm * years * costPerKm);
}

/**
 * @param {number} annualKm
 * @param {number} ownershipYears
 * @param {number} [maintenanceCostPerKm]
 * @returns {number}
 */
export function calculateMaintenanceCost(
  annualKm,
  ownershipYears,
  maintenanceCostPerKm = TCO_DEFAULTS.maintenanceCostPerKm
) {
  const km = clampTcoValue(
    annualKm,
    TCO_BOUNDS.annualKmMin,
    TCO_BOUNDS.annualKmMax
  );
  const years = clampTcoValue(
    ownershipYears,
    TCO_BOUNDS.ownershipYearsMin,
    TCO_BOUNDS.ownershipYearsMax
  );
  const rate = clampTcoValue(
    maintenanceCostPerKm,
    TCO_BOUNDS.maintenanceCostPerKmMin,
    TCO_BOUNDS.maintenanceCostPerKmMax
  );

  return roundCurrency(km * years * rate);
}

/**
 * @param {number} insurancePerYear
 * @param {number} ownershipYears
 * @returns {number}
 */
export function calculateInsuranceCost(insurancePerYear, ownershipYears) {
  const annual = clampTcoValue(
    insurancePerYear,
    TCO_BOUNDS.insurancePerYearMin,
    TCO_BOUNDS.insurancePerYearMax
  );
  const years = clampTcoValue(
    ownershipYears,
    TCO_BOUNDS.ownershipYearsMin,
    TCO_BOUNDS.ownershipYearsMax
  );

  return roundCurrency(annual * years);
}

/**
 * @param {number} vehiclePriceInr
 * @param {number} [ratePerYear]
 * @returns {number}
 */
export function deriveDefaultInsurancePerYear(
  vehiclePriceInr,
  ratePerYear = TCO_DEFAULTS.insuranceRatePerYear
) {
  const price = clampTcoValue(
    vehiclePriceInr,
    TCO_BOUNDS.vehiclePriceMin,
    TCO_BOUNDS.vehiclePriceMax
  );
  return roundCurrency(price * ratePerYear);
}

/**
 * @param {{
 *   depreciationInr: number,
 *   energyInr: number,
 *   maintenanceInr: number,
 *   insuranceInr: number,
 * }} parts
 * @returns {number}
 */
export function calculateTotalOwnershipCost(parts) {
  return roundCurrency(
    (parts.depreciationInr || 0) +
      (parts.energyInr || 0) +
      (parts.maintenanceInr || 0) +
      (parts.insuranceInr || 0)
  );
}

/**
 * @param {number} totalCostInr
 * @param {number} annualKm
 * @param {number} ownershipYears
 * @returns {number}
 */
export function calculateOwnershipCostPerKm(
  totalCostInr,
  annualKm,
  ownershipYears
) {
  const km = clampTcoValue(
    annualKm,
    TCO_BOUNDS.annualKmMin,
    TCO_BOUNDS.annualKmMax
  );
  const years = clampTcoValue(
    ownershipYears,
    TCO_BOUNDS.ownershipYearsMin,
    TCO_BOUNDS.ownershipYearsMax
  );
  const totalKm = km * years;
  if (totalKm <= 0) return 0;

  return Math.round((totalCostInr / totalKm) * 100) / 100;
}

/**
 * @param {{
 *   vehiclePriceInr?: number,
 *   annualKm?: number,
 *   ownershipYears?: number,
 *   homeTariffInr?: number,
 *   homeChargingPct?: number,
 *   efficiencyKmPerKwh?: number,
 *   maintenanceCostPerKm?: number,
 *   insurancePerYear?: number,
 *   residualValuePct?: number,
 * }} input
 * @returns {import("./tcoCalculator.js").TcoCalculationResult}
 */
export function calculateTco(input = {}) {
  const vehiclePriceInr = clampTcoValue(
    input.vehiclePriceInr ?? TCO_DEFAULTS.vehiclePriceInr,
    TCO_BOUNDS.vehiclePriceMin,
    TCO_BOUNDS.vehiclePriceMax
  );
  const annualKm = clampTcoValue(
    input.annualKm ?? TCO_DEFAULTS.annualKm,
    TCO_BOUNDS.annualKmMin,
    TCO_BOUNDS.annualKmMax
  );
  const ownershipYears = clampTcoValue(
    input.ownershipYears ?? TCO_DEFAULTS.ownershipYears,
    TCO_BOUNDS.ownershipYearsMin,
    TCO_BOUNDS.ownershipYearsMax
  );
  const residualValuePct = clampTcoValue(
    input.residualValuePct ?? TCO_DEFAULTS.residualValuePct,
    TCO_BOUNDS.residualValuePctMin,
    TCO_BOUNDS.residualValuePctMax
  );

  const { costPerKm, effectiveRateInr, publicChargingPct } = calculateCostPerKm({
    homeTariffInr: input.homeTariffInr,
    homeChargingPct: input.homeChargingPct,
    efficiencyKmPerKwh: input.efficiencyKmPerKwh,
  });

  const { residualValueInr, depreciationInr } = calculateDepreciation(
    vehiclePriceInr,
    residualValuePct
  );
  const energyInr = calculateEnergyCost({
    annualKm,
    ownershipYears,
    homeTariffInr: input.homeTariffInr,
    homeChargingPct: input.homeChargingPct,
    efficiencyKmPerKwh: input.efficiencyKmPerKwh,
  });
  const maintenanceInr = calculateMaintenanceCost(
    annualKm,
    ownershipYears,
    input.maintenanceCostPerKm
  );
  const insurancePerYear = clampTcoValue(
    input.insurancePerYear ??
      deriveDefaultInsurancePerYear(vehiclePriceInr),
    TCO_BOUNDS.insurancePerYearMin,
    TCO_BOUNDS.insurancePerYearMax
  );
  const insuranceInr = calculateInsuranceCost(
    insurancePerYear,
    ownershipYears
  );

  const totalOwnershipCostInr = calculateTotalOwnershipCost({
    depreciationInr,
    energyInr,
    maintenanceInr,
    insuranceInr,
  });

  const ownershipCostPerKm = calculateOwnershipCostPerKm(
    totalOwnershipCostInr,
    annualKm,
    ownershipYears
  );

  const runningCostPerKm = calculateCostPerKm({
    homeTariffInr: input.homeTariffInr,
    homeChargingPct: input.homeChargingPct,
    efficiencyKmPerKwh: input.efficiencyKmPerKwh,
  }).costPerKm;

  return {
    vehiclePriceInr,
    annualKm,
    ownershipYears,
    residualValuePct,
    residualValueInr,
    depreciationInr,
    energyInr,
    maintenanceInr,
    insurancePerYear,
    insuranceInr,
    totalOwnershipCostInr,
    ownershipCostPerKm,
    runningCostPerKm,
    energyCostPerKm: costPerKm,
    effectiveRateInr,
    publicChargingPct,
    totalKm: annualKm * ownershipYears,
    breakdown: [
      { key: "depreciation", label: "Depreciation", amountInr: depreciationInr },
      { key: "energy", label: "Energy", amountInr: energyInr },
      { key: "maintenance", label: "Maintenance", amountInr: maintenanceInr },
      { key: "insurance", label: "Insurance", amountInr: insuranceInr },
    ],
  };
}

/**
 * @typedef {Object} TcoCalculationResult
 * @property {number} vehiclePriceInr
 * @property {number} annualKm
 * @property {number} ownershipYears
 * @property {number} residualValuePct
 * @property {number} residualValueInr
 * @property {number} depreciationInr
 * @property {number} energyInr
 * @property {number} maintenanceInr
 * @property {number} insurancePerYear
 * @property {number} insuranceInr
 * @property {number} totalOwnershipCostInr
 * @property {number} ownershipCostPerKm
 * @property {number} runningCostPerKm
 * @property {number} energyCostPerKm
 * @property {number} effectiveRateInr
 * @property {number} publicChargingPct
 * @property {number} totalKm
 * @property {Array<{ key: string, label: string, amountInr: number }>} breakdown
 */

/**
 * @param {TcoCalculationResult} result
 * @returns {string[]}
 */
export function generateTcoOwnershipInsights(result) {
  const insights = [];
  const {
    depreciationInr,
    energyInr,
    maintenanceInr,
    insuranceInr,
    totalOwnershipCostInr,
    runningCostPerKm,
    totalKm,
  } = result;

  if (totalOwnershipCostInr <= 0) {
    return insights;
  }

  const runningInr = energyInr + maintenanceInr;
  const components = [
    { key: "depreciation", value: depreciationInr },
    { key: "energy", value: energyInr },
    { key: "maintenance", value: maintenanceInr },
    { key: "insurance", value: insuranceInr },
  ];
  const largest = components.reduce(
    (max, item) => (item.value > max.value ? item : max),
    components[0]
  );

  if (
    largest.key === "depreciation" &&
    depreciationInr > runningInr
  ) {
    insights.push(
      "Most ownership cost comes from depreciation rather than charging expenses."
    );
  }

  const dieselReferencePerKm = 6;
  if (runningCostPerKm < dieselReferencePerKm) {
    insights.push(
      "Running costs remain significantly lower than equivalent ICE vehicles."
    );
  } else if (totalKm > 0 && runningInr / totalKm < dieselReferencePerKm) {
    insights.push(
      "Running costs remain significantly lower than equivalent ICE vehicles."
    );
  }

  if (!insights.length) {
    insights.push(
      "Adjust inputs to compare purchase, running, and retention costs for your usage pattern."
    );
  }

  return insights.slice(0, 2);
}

/**
 * @param {number} inr
 * @returns {string}
 */
export function formatTcoLakh(inr) {
  const amount = parseNumber(inr);
  if (amount == null) return "—";
  const lakh = amount / 100000;
  if (lakh >= 100) {
    return `₹${(lakh / 100).toFixed(2)} Cr`;
  }
  return `₹${lakh.toFixed(2)} lakh`;
}

/**
 * @param {number} inr
 * @returns {string}
 */
export function formatTcoInr(inr) {
  const amount = parseNumber(inr);
  if (amount == null) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatTcoPerKm(value) {
  const rate = parseNumber(value);
  if (rate == null) return "—";
  return `₹${rate.toFixed(2)}/km`;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
