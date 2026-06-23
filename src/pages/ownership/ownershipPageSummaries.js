import { formatCostPerKmRate } from "../../tools/costPerKmCalculator.js";
import { formatTcoLakh } from "../../tools/tcoCalculator.js";
import { formatCurrencyAmount, formatPercentage } from "../../utils/numberFormatters.js";
import { TCO_DEFAULTS } from "../../tools/tcoDefaults.js";
import { PETROL_SAVINGS_DEFAULTS } from "../../tools/petrolSavingsDefaults.js";
import { EMI_DEFAULTS } from "../../tools/emiDefaults.js";

/**
 * @param {string} vehicleName
 * @param {number} costPerKm
 * @returns {string}
 */
export function buildRunningCostSummary(vehicleName, costPerKm) {
  const name = vehicleName || "This EV";
  const rate = formatCostPerKmRate(costPerKm);
  return `${name} costs approximately ${rate} to run under typical charging conditions.`;
}

/**
 * @param {string} vehicleName
 * @param {number} totalOwnershipCostInr
 * @param {number} [annualKm]
 * @param {number} [ownershipYears]
 * @returns {string}
 */
export function buildOwnershipCostSummary(
  vehicleName,
  totalOwnershipCostInr,
  annualKm = TCO_DEFAULTS.annualKm,
  ownershipYears = TCO_DEFAULTS.ownershipYears
) {
  const name = vehicleName || "This EV";
  const totalLabel = formatTcoLakh(totalOwnershipCostInr);
  return `Over ${ownershipYears} years and ${annualKm.toLocaleString("en-IN")} km annually, ${name} ownership costs are approximately ${totalLabel}.`;
}

/**
 * @param {string} vehicleName
 * @param {number} savingsInr
 * @returns {string}
 */
export function buildPetrolSavingsSummary(vehicleName, savingsInr) {
  const name = vehicleName || "This EV";
  const absLabel = formatTcoLakh(Math.abs(savingsInr));
  if (savingsInr >= 0) {
    return `Compared with an equivalent petrol car, ${name} ownership savings are approximately ${absLabel}.`;
  }
  return `Compared with an equivalent petrol car, ${name} costs approximately ${absLabel} more over the selected ownership period at these assumptions.`;
}

/**
 * @param {string} vehicleName
 * @param {number} emiInr
 * @param {number} [downPaymentPct]
 * @returns {string}
 */
export function buildEmiSummary(
  vehicleName,
  emiInr,
  downPaymentPct = EMI_DEFAULTS.downPaymentPct
) {
  const name = vehicleName || "This EV";
  return `With a down payment of ${formatPercentage(downPaymentPct)}, estimated EMI for ${name} is approximately ${formatCurrencyAmount(emiInr)} per month.`;
}

/**
 * @param {import("./ownershipRoutes.js").OwnershipPageType} pageType
 * @param {string} vehicleName
 * @param {object} values
 * @returns {string}
 */
export function buildOwnershipSummaryText(pageType, vehicleName, values = {}) {
  switch (pageType) {
    case "running-cost":
      return buildRunningCostSummary(vehicleName, values.costPerKm || 0);
    case "tco":
      return buildOwnershipCostSummary(
        vehicleName,
        values.totalOwnershipCostInr || 0,
        values.annualKm,
        values.ownershipYears
      );
    case "petrol-savings":
      return buildPetrolSavingsSummary(vehicleName, values.savingsInr || 0);
    case "emi":
      return buildEmiSummary(
        vehicleName,
        values.emiInr || 0,
        values.downPaymentPct
      );
    default:
      return "";
  }
}

export {
  TCO_DEFAULTS,
  PETROL_SAVINGS_DEFAULTS,
  EMI_DEFAULTS,
};
