/**
 * Defaults and bounds for the EMI calculator.
 */

export const EMI_DEFAULTS = Object.freeze({
  vehiclePriceInr: 1500000,
  downPaymentPct: 20,
  loanTenureYears: 5,
  interestRatePct: 9,
  processingFeePct: 1,
  balloonPaymentInr: 0,
});

export const EMI_BOUNDS = Object.freeze({
  vehiclePriceMin: 200000,
  vehiclePriceMax: 10000000,
  downPaymentPctMin: 0,
  downPaymentPctMax: 80,
  loanTenureYearsMin: 1,
  loanTenureYearsMax: 8,
  interestRatePctMin: 5,
  interestRatePctMax: 18,
  processingFeePctMin: 0,
  processingFeePctMax: 5,
  balloonPaymentMin: 0,
  balloonPaymentMax: 5000000,
});

export const EMI_BREAKDOWN_COLORS = Object.freeze({
  principal: "#2563eb",
  interest: "#f59e0b",
  downPayment: "#0f766e",
  fees: "#64748b",
  balloon: "#7c3aed",
});

/** EMI / vehicle price ratio bands */
export const EMI_AFFORDABILITY_BANDS = Object.freeze([
  { maxRatio: 0.014, label: "Affordable", tone: "affordable" },
  { maxRatio: 0.022, label: "Moderate", tone: "moderate" },
  { maxRatio: Infinity, label: "High EMI burden", tone: "high" },
]);
