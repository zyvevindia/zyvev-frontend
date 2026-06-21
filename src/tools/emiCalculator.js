import {
  EMI_AFFORDABILITY_BANDS,
  EMI_BOUNDS,
  EMI_DEFAULTS,
} from "./emiDefaults.js";

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
export function clampEmiValue(value, min, max) {
  const n = parseNumber(value);
  if (n == null) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {number} vehiclePriceInr
 * @param {number} downPaymentPct
 * @returns {{ downPaymentInr: number, loanAmountInr: number }}
 */
export function calculateLoanAmount(vehiclePriceInr, downPaymentPct) {
  const price = clampEmiValue(
    vehiclePriceInr,
    EMI_BOUNDS.vehiclePriceMin,
    EMI_BOUNDS.vehiclePriceMax
  );
  const pct = clampEmiValue(
    downPaymentPct,
    EMI_BOUNDS.downPaymentPctMin,
    EMI_BOUNDS.downPaymentPctMax
  );
  const downPaymentInr = roundCurrency(price * (pct / 100));
  const loanAmountInr = roundCurrency(Math.max(0, price - downPaymentInr));

  return { downPaymentInr, loanAmountInr };
}

/**
 * Standard reducing-balance monthly EMI.
 * @param {number} loanAmountInr
 * @param {number} annualInterestRatePct
 * @param {number} tenureYears
 * @returns {number}
 */
export function calculateEmi(
  loanAmountInr,
  annualInterestRatePct,
  tenureYears
) {
  const principal = parseNumber(loanAmountInr) || 0;
  if (principal <= 0) return 0;

  const annualRate = clampEmiValue(
    annualInterestRatePct,
    EMI_BOUNDS.interestRatePctMin,
    EMI_BOUNDS.interestRatePctMax
  );
  const years = clampEmiValue(
    tenureYears,
    EMI_BOUNDS.loanTenureYearsMin,
    EMI_BOUNDS.loanTenureYearsMax
  );
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return roundCurrency(principal / months);
  }

  const factor = (1 + monthlyRate) ** months;
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return roundCurrency(emi);
}

/**
 * @param {number} monthlyEmi
 * @param {number} loanAmountInr
 * @param {number} tenureYears
 * @returns {number}
 */
export function calculateTotalInterest(
  monthlyEmi,
  loanAmountInr,
  tenureYears
) {
  const emi = parseNumber(monthlyEmi) || 0;
  const principal = parseNumber(loanAmountInr) || 0;
  const years = clampEmiValue(
    tenureYears,
    EMI_BOUNDS.loanTenureYearsMin,
    EMI_BOUNDS.loanTenureYearsMax
  );
  const months = years * 12;
  const totalPaid = emi * months;
  return roundCurrency(Math.max(0, totalPaid - principal));
}

/**
 * @param {number} loanAmountInr
 * @param {number} processingFeePct
 * @returns {number}
 */
export function calculateProcessingFee(loanAmountInr, processingFeePct) {
  const loan = parseNumber(loanAmountInr) || 0;
  const pct = clampEmiValue(
    processingFeePct,
    EMI_BOUNDS.processingFeePctMin,
    EMI_BOUNDS.processingFeePctMax
  );
  return roundCurrency(loan * (pct / 100));
}

/**
 * @param {{
 *   downPaymentInr: number,
 *   monthlyEmi: number,
 *   tenureYears: number,
 *   processingFeeInr: number,
 *   balloonPaymentInr?: number,
 * }} parts
 * @returns {number}
 */
export function calculateTotalOutflow(parts) {
  const years = clampEmiValue(
    parts.tenureYears,
    EMI_BOUNDS.loanTenureYearsMin,
    EMI_BOUNDS.loanTenureYearsMax
  );
  const months = years * 12;
  const emiTotal = (parseNumber(parts.monthlyEmi) || 0) * months;
  const balloon = clampEmiValue(
    parts.balloonPaymentInr ?? 0,
    EMI_BOUNDS.balloonPaymentMin,
    EMI_BOUNDS.balloonPaymentMax
  );

  return roundCurrency(
    (parts.downPaymentInr || 0) +
      emiTotal +
      (parts.processingFeeInr || 0) +
      balloon
  );
}

/**
 * @param {number} monthlyEmi
 * @param {number} vehiclePriceInr
 * @returns {{ label: string, tone: string, ratio: number }}
 */
export function calculateAffordabilityBand(monthlyEmi, vehiclePriceInr) {
  const emi = parseNumber(monthlyEmi) || 0;
  const price = parseNumber(vehiclePriceInr) || 0;
  const ratio = price > 0 ? emi / price : 0;

  for (const band of EMI_AFFORDABILITY_BANDS) {
    if (ratio <= band.maxRatio) {
      return { label: band.label, tone: band.tone, ratio };
    }
  }

  return {
    label: "High EMI burden",
    tone: "high",
    ratio,
  };
}

/**
 * @param {{
 *   vehiclePriceInr?: number,
 *   downPaymentPct?: number,
 *   loanTenureYears?: number,
 *   interestRatePct?: number,
 *   processingFeePct?: number,
 *   balloonPaymentInr?: number,
 * }} input
 * @returns {import("./emiCalculator.js").EmiCalculationResult}
 */
export function calculateEmiPlan(input = {}) {
  const vehiclePriceInr = clampEmiValue(
    input.vehiclePriceInr ?? EMI_DEFAULTS.vehiclePriceInr,
    EMI_BOUNDS.vehiclePriceMin,
    EMI_BOUNDS.vehiclePriceMax
  );
  const downPaymentPct = clampEmiValue(
    input.downPaymentPct ?? EMI_DEFAULTS.downPaymentPct,
    EMI_BOUNDS.downPaymentPctMin,
    EMI_BOUNDS.downPaymentPctMax
  );
  const loanTenureYears = clampEmiValue(
    input.loanTenureYears ?? EMI_DEFAULTS.loanTenureYears,
    EMI_BOUNDS.loanTenureYearsMin,
    EMI_BOUNDS.loanTenureYearsMax
  );
  const interestRatePct = clampEmiValue(
    input.interestRatePct ?? EMI_DEFAULTS.interestRatePct,
    EMI_BOUNDS.interestRatePctMin,
    EMI_BOUNDS.interestRatePctMax
  );
  const processingFeePct = clampEmiValue(
    input.processingFeePct ?? EMI_DEFAULTS.processingFeePct,
    EMI_BOUNDS.processingFeePctMin,
    EMI_BOUNDS.processingFeePctMax
  );
  const balloonPaymentInr = clampEmiValue(
    input.balloonPaymentInr ?? EMI_DEFAULTS.balloonPaymentInr,
    EMI_BOUNDS.balloonPaymentMin,
    EMI_BOUNDS.balloonPaymentMax
  );

  const { downPaymentInr, loanAmountInr } = calculateLoanAmount(
    vehiclePriceInr,
    downPaymentPct
  );
  const monthlyEmi = calculateEmi(
    loanAmountInr,
    interestRatePct,
    loanTenureYears
  );
  const totalInterestInr = calculateTotalInterest(
    monthlyEmi,
    loanAmountInr,
    loanTenureYears
  );
  const processingFeeInr = calculateProcessingFee(
    loanAmountInr,
    processingFeePct
  );
  const totalOutflowInr = calculateTotalOutflow({
    downPaymentInr,
    monthlyEmi,
    tenureYears: loanTenureYears,
    processingFeeInr,
    balloonPaymentInr,
  });
  const affordability = calculateAffordabilityBand(
    monthlyEmi,
    vehiclePriceInr
  );
  const months = loanTenureYears * 12;
  const monthlyRate = interestRatePct / 12;

  const breakdown = [
    {
      key: "principal",
      label: "Principal repaid",
      amountInr: loanAmountInr,
    },
    {
      key: "interest",
      label: "Interest",
      amountInr: totalInterestInr,
    },
    {
      key: "downPayment",
      label: "Down payment",
      amountInr: downPaymentInr,
    },
    {
      key: "fees",
      label: "Processing fee",
      amountInr: processingFeeInr,
    },
  ];

  if (balloonPaymentInr > 0) {
    breakdown.push({
      key: "balloon",
      label: "Balloon payment",
      amountInr: balloonPaymentInr,
    });
  }

  return {
    vehiclePriceInr,
    downPaymentPct,
    downPaymentInr,
    loanAmountInr,
    loanTenureYears,
    interestRatePct,
    monthlyRate,
    months,
    monthlyEmi,
    totalInterestInr,
    processingFeePct,
    processingFeeInr,
    balloonPaymentInr,
    totalOutflowInr,
    affordability,
    breakdown,
  };
}

/**
 * @typedef {Object} EmiCalculationResult
 * @property {number} vehiclePriceInr
 * @property {number} downPaymentPct
 * @property {number} downPaymentInr
 * @property {number} loanAmountInr
 * @property {number} loanTenureYears
 * @property {number} interestRatePct
 * @property {number} monthlyRate
 * @property {number} months
 * @property {number} monthlyEmi
 * @property {number} totalInterestInr
 * @property {number} processingFeePct
 * @property {number} processingFeeInr
 * @property {number} balloonPaymentInr
 * @property {number} totalOutflowInr
 * @property {{ label: string, tone: string, ratio: number }} affordability
 * @property {Array<{ key: string, label: string, amountInr: number }>} breakdown
 */

/**
 * @param {EmiCalculationResult} result
 * @returns {string[]}
 */
export function generateEmiInsights(result) {
  const insights = [];
  const {
    totalInterestInr,
    loanTenureYears,
    downPaymentPct,
    monthlyEmi,
    loanAmountInr,
  } = result;

  if (totalInterestInr >= 10000) {
    const lakh = (totalInterestInr / 100000).toFixed(2);
    insights.push(
      `Interest contributes approximately ₹${lakh} lakh over the loan tenure.`
    );
  }

  if (loanTenureYears >= 4) {
    insights.push(
      "Choosing a shorter tenure reduces total interest but increases monthly EMI."
    );
  }

  if (downPaymentPct < 25 && loanAmountInr > 0) {
    insights.push(
      "Lower down payments improve affordability but increase total borrowing cost."
    );
  }

  if (!insights.length && monthlyEmi > 0) {
    insights.push(
      "Adjust tenure and down payment to balance monthly EMI with total loan cost."
    );
  }

  return insights.slice(0, 3);
}

/**
 * @param {number} inr
 * @returns {string}
 */
export function formatEmiLakh(inr) {
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
export function formatEmiMonthly(inr) {
  const amount = parseNumber(inr);
  if (amount == null) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}/month`;
}

/**
 * @param {number} inr
 * @returns {string}
 */
export function formatEmiInr(inr) {
  const amount = parseNumber(inr);
  if (amount == null) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
