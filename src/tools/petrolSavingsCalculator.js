import { calculateCostPerKm } from "./costPerKmCalculator.js";
import {
  calculateDepreciation,
  calculateEnergyCost,
  calculateInsuranceCost,
  calculateMaintenanceCost,
  calculateTotalOwnershipCost,
  calculateTco,
  clampTcoValue,
  deriveDefaultInsurancePerYear,
  formatTcoLakh,
} from "./tcoCalculator.js";
import { TCO_BOUNDS } from "./tcoDefaults.js";
import {
  PETROL_SAVINGS_BOUNDS,
  PETROL_SAVINGS_DEFAULTS,
  SAVINGS_TONE_THRESHOLDS,
} from "./petrolSavingsDefaults.js";

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
export function clampPetrolSavingsValue(value, min, max) {
  const n = parseNumber(value);
  if (n == null) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {number} petrolPricePerLitre
 * @param {number} petrolEfficiencyKmPerL
 * @returns {number}
 */
export function calculatePetrolCostPerKm(
  petrolPricePerLitre,
  petrolEfficiencyKmPerL
) {
  const price = clampPetrolSavingsValue(
    petrolPricePerLitre,
    PETROL_SAVINGS_BOUNDS.petrolPriceMin,
    PETROL_SAVINGS_BOUNDS.petrolPriceMax
  );
  const efficiency = clampPetrolSavingsValue(
    petrolEfficiencyKmPerL,
    PETROL_SAVINGS_BOUNDS.petrolEfficiencyMin,
    PETROL_SAVINGS_BOUNDS.petrolEfficiencyMax
  );
  if (efficiency <= 0) return 0;
  return Math.round((price / efficiency) * 100) / 100;
}

/**
 * @param {{
 *   vehiclePriceInr?: number,
 *   annualKm?: number,
 *   ownershipYears?: number,
 *   petrolPricePerLitre?: number,
 *   petrolEfficiencyKmPerL?: number,
 *   petrolMaintenancePerKm?: number,
 *   petrolResidualPct?: number,
 *   insurancePerYear?: number,
 * }} input
 * @returns {import("./petrolSavingsCalculator.js").PetrolOwnershipResult}
 */
export function calculatePetrolOwnershipCost(input = {}) {
  const vehiclePriceInr = clampPetrolSavingsValue(
    input.vehiclePriceInr ?? PETROL_SAVINGS_DEFAULTS.petrolPriceInr,
    PETROL_SAVINGS_BOUNDS.vehiclePriceMin,
    PETROL_SAVINGS_BOUNDS.vehiclePriceMax
  );
  const annualKm = clampTcoValue(
    input.annualKm ?? PETROL_SAVINGS_DEFAULTS.annualKm,
    PETROL_SAVINGS_BOUNDS.annualKmMin,
    PETROL_SAVINGS_BOUNDS.annualKmMax
  );
  const ownershipYears = clampTcoValue(
    input.ownershipYears ?? PETROL_SAVINGS_DEFAULTS.ownershipYears,
    PETROL_SAVINGS_BOUNDS.ownershipYearsMin,
    PETROL_SAVINGS_BOUNDS.ownershipYearsMax
  );
  const petrolResidualPct = clampPetrolSavingsValue(
    input.petrolResidualPct ?? PETROL_SAVINGS_DEFAULTS.petrolResidualPct,
    PETROL_SAVINGS_BOUNDS.residualPctMin,
    PETROL_SAVINGS_BOUNDS.residualPctMax
  );

  const petrolCostPerKm = calculatePetrolCostPerKm(
    input.petrolPricePerLitre,
    input.petrolEfficiencyKmPerL
  );
  const fuelInr = roundCurrency(annualKm * ownershipYears * petrolCostPerKm);
  const maintenanceInr = calculateMaintenanceCost(
    annualKm,
    ownershipYears,
    clampPetrolSavingsValue(
      input.petrolMaintenancePerKm ??
        PETROL_SAVINGS_DEFAULTS.petrolMaintenancePerKm,
      PETROL_SAVINGS_BOUNDS.petrolMaintenanceMin,
      PETROL_SAVINGS_BOUNDS.petrolMaintenanceMax
    )
  );
  const { depreciationInr, residualValueInr } = calculateDepreciation(
    vehiclePriceInr,
    petrolResidualPct
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
    energyInr: fuelInr,
    maintenanceInr,
    insuranceInr,
  });

  return {
    vehiclePriceInr,
    annualKm,
    ownershipYears,
    petrolCostPerKm,
    fuelInr,
    maintenanceInr,
    depreciationInr,
    insuranceInr,
    insurancePerYear,
    residualValueInr,
    totalOwnershipCostInr,
    totalKm: annualKm * ownershipYears,
    breakdown: [
      {
        key: "depreciation",
        label: "Depreciation",
        amountInr: depreciationInr,
      },
      { key: "fuel", label: "Fuel", amountInr: fuelInr },
      {
        key: "maintenance",
        label: "Maintenance",
        amountInr: maintenanceInr,
      },
      {
        key: "insurance",
        label: "Insurance",
        amountInr: insuranceInr,
      },
    ],
  };
}

/**
 * @param {number} petrolTotalInr
 * @param {number} evTotalInr
 * @returns {{ savingsInr: number, savingsPct: number, tone: "green" | "amber" | "red" }}
 */
export function calculateOwnershipSavings(petrolTotalInr, evTotalInr) {
  const petrol = parseNumber(petrolTotalInr) || 0;
  const ev = parseNumber(evTotalInr) || 0;
  const savingsInr = roundCurrency(petrol - ev);
  const savingsPct =
    petrol > 0 ? Math.round((savingsInr / petrol) * 1000) / 10 : 0;

  let tone = "amber";
  const absPct = Math.abs(savingsPct);

  if (savingsInr > 0 && absPct >= SAVINGS_TONE_THRESHOLDS.nearParityPct) {
    tone = "green";
  } else if (savingsInr < 0 && absPct >= SAVINGS_TONE_THRESHOLDS.nearParityPct) {
    tone = "red";
  } else {
    tone = "amber";
  }

  return { savingsInr, savingsPct, tone };
}

/**
 * @param {number} extraPurchaseCostInr
 * @param {number} petrolRunningCostPerKm
 * @param {number} evRunningCostPerKm
 * @returns {number|null}
 */
export function calculateBreakEvenDistance(
  extraPurchaseCostInr,
  petrolRunningCostPerKm,
  evRunningCostPerKm
) {
  const extra = parseNumber(extraPurchaseCostInr) || 0;
  const petrolRate = parseNumber(petrolRunningCostPerKm) || 0;
  const evRate = parseNumber(evRunningCostPerKm) || 0;
  const runningDiff = petrolRate - evRate;

  if (extra <= 0) return 0;
  if (runningDiff <= 0) return null;

  return Math.round(extra / runningDiff);
}

/**
 * @param {number|null|undefined} breakEvenKm
 * @param {number} annualKm
 * @returns {number|null}
 */
export function calculateBreakEvenYears(breakEvenKm, annualKm) {
  const km = parseNumber(breakEvenKm);
  const annual = clampTcoValue(
    annualKm,
    PETROL_SAVINGS_BOUNDS.annualKmMin,
    PETROL_SAVINGS_BOUNDS.annualKmMax
  );
  if (km == null || annual <= 0) return null;
  return Math.round((km / annual) * 10) / 10;
}

/**
 * @param {{
 *   evPriceInr?: number,
 *   petrolVehiclePriceInr?: number,
 *   annualKm?: number,
 *   ownershipYears?: number,
 *   homeTariffInr?: number,
 *   homeChargingPct?: number,
 *   efficiencyKmPerKwh?: number,
 *   evMaintenancePerKm?: number,
 *   evResidualPct?: number,
 *   petrolPricePerLitre?: number,
 *   petrolEfficiencyKmPerL?: number,
 *   petrolMaintenancePerKm?: number,
 *   petrolResidualPct?: number,
 * }} input
 * @returns {import("./petrolSavingsCalculator.js").PetrolSavingsResult}
 */
export function calculatePetrolSavings(input = {}) {
  const evPriceInr = clampPetrolSavingsValue(
    input.evPriceInr ?? PETROL_SAVINGS_DEFAULTS.evPriceInr,
    PETROL_SAVINGS_BOUNDS.vehiclePriceMin,
    PETROL_SAVINGS_BOUNDS.vehiclePriceMax
  );
  const petrolVehiclePriceInr = clampPetrolSavingsValue(
    input.petrolVehiclePriceInr ?? evPriceInr,
    PETROL_SAVINGS_BOUNDS.vehiclePriceMin,
    PETROL_SAVINGS_BOUNDS.vehiclePriceMax
  );

  const ev = calculateTco({
    vehiclePriceInr: evPriceInr,
    annualKm: input.annualKm,
    ownershipYears: input.ownershipYears,
    homeTariffInr: input.homeTariffInr,
    homeChargingPct: input.homeChargingPct,
    efficiencyKmPerKwh: input.efficiencyKmPerKwh,
    maintenanceCostPerKm: clampPetrolSavingsValue(
      input.evMaintenancePerKm ?? PETROL_SAVINGS_DEFAULTS.evMaintenancePerKm,
      PETROL_SAVINGS_BOUNDS.evMaintenanceMin,
      PETROL_SAVINGS_BOUNDS.evMaintenanceMax
    ),
    residualValuePct: clampPetrolSavingsValue(
      input.evResidualPct ?? PETROL_SAVINGS_DEFAULTS.evResidualPct,
      PETROL_SAVINGS_BOUNDS.residualPctMin,
      PETROL_SAVINGS_BOUNDS.residualPctMax
    ),
  });

  const petrol = calculatePetrolOwnershipCost({
    vehiclePriceInr: petrolVehiclePriceInr,
    annualKm: input.annualKm,
    ownershipYears: input.ownershipYears,
    petrolPricePerLitre: input.petrolPricePerLitre,
    petrolEfficiencyKmPerL: input.petrolEfficiencyKmPerL,
    petrolMaintenancePerKm: input.petrolMaintenancePerKm,
    petrolResidualPct: input.petrolResidualPct,
  });

  const savings = calculateOwnershipSavings(
    petrol.totalOwnershipCostInr,
    ev.totalOwnershipCostInr
  );

  const evRunningCostPerKm = calculateCostPerKm({
    homeTariffInr: input.homeTariffInr,
    homeChargingPct: input.homeChargingPct,
    efficiencyKmPerKwh: input.efficiencyKmPerKwh,
  }).costPerKm;

  const petrolRunningCostPerKm = petrol.petrolCostPerKm;
  const extraPurchaseCostInr = evPriceInr - petrolVehiclePriceInr;
  const breakEvenKm = calculateBreakEvenDistance(
    extraPurchaseCostInr,
    petrolRunningCostPerKm,
    evRunningCostPerKm
  );

  const breakEvenYears = calculateBreakEvenYears(breakEvenKm, ev.annualKm);

  const runningSavingsInr = roundCurrency(
    petrol.fuelInr +
      petrol.maintenanceInr -
      (ev.energyInr + ev.maintenanceInr)
  );

  return {
    ev,
    petrol,
    evPriceInr,
    petrolVehiclePriceInr,
    savingsInr: savings.savingsInr,
    savingsPct: savings.savingsPct,
    tone: savings.tone,
    breakEvenKm,
    breakEvenYears,
    runningSavingsInr,
    evRunningCostPerKm,
    petrolRunningCostPerKm,
  };
}

/**
 * @typedef {Object} PetrolOwnershipResult
 * @property {number} vehiclePriceInr
 * @property {number} annualKm
 * @property {number} ownershipYears
 * @property {number} petrolCostPerKm
 * @property {number} fuelInr
 * @property {number} maintenanceInr
 * @property {number} depreciationInr
 * @property {number} insuranceInr
 * @property {number} insurancePerYear
 * @property {number} residualValueInr
 * @property {number} totalOwnershipCostInr
 * @property {number} totalKm
 * @property {Array<{ key: string, label: string, amountInr: number }>} breakdown
 */

/**
 * @typedef {Object} PetrolSavingsResult
 * @property {import("./tcoCalculator.js").TcoCalculationResult} ev
 * @property {PetrolOwnershipResult} petrol
 * @property {number} evPriceInr
 * @property {number} petrolVehiclePriceInr
 * @property {number} savingsInr
 * @property {number} savingsPct
 * @property {"green"|"amber"|"red"} tone
 * @property {number|null} breakEvenKm
 * @property {number|null} breakEvenYears
 * @property {number} runningSavingsInr
 * @property {number} evRunningCostPerKm
 * @property {number} petrolRunningCostPerKm
 */

/**
 * @param {PetrolSavingsResult} result
 * @returns {string[]}
 */
export function generatePetrolSavingsInsights(result) {
  const insights = [];
  const {
    savingsInr,
    savingsPct,
    ownershipYears,
    breakEvenYears,
    runningSavingsInr,
    ev,
    petrol,
  } = result;
  const years = ev?.ownershipYears ?? petrol?.ownershipYears ?? 5;

  if (Math.abs(savingsInr) >= 1000) {
    const absLakh = formatTcoLakh(Math.abs(savingsInr)).replace("₹", "");
    if (savingsInr >= 0) {
      insights.push(
        `You save approximately ₹${absLakh} over ${years} years.`
      );
    } else {
      insights.push(
        `The EV costs approximately ₹${absLakh} more than petrol over ${years} years at these assumptions.`
      );
    }
  }

  if (runningSavingsInr > 0 && Math.abs(savingsPct) >= 1) {
    insights.push("Most savings come from lower running costs.");
  }

  if (
    breakEvenYears != null &&
    breakEvenYears > 0 &&
    breakEvenYears <= years + 2
  ) {
    insights.push(
      `Break-even occurs after roughly ${breakEvenYears} years.`
    );
  } else if (savingsInr > 0 && breakEvenYears === 0) {
    insights.push("Running costs alone already favour the EV from day one.");
  }

  if (!insights.length) {
    insights.push(
      "Adjust driving, fuel price, and charging assumptions to compare outcomes."
    );
  }

  return insights.slice(0, 3);
}

/**
 * @param {number} km
 * @returns {string}
 */
export function formatBreakEvenDistance(km) {
  const value = parseNumber(km);
  if (value == null) return "—";
  if (value === 0) return "Immediate";
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k km`;
  }
  return `${Math.round(value).toLocaleString("en-IN")} km`;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
