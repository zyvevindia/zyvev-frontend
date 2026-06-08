/**
 * Indian-market price formatting (Lakh / Crore).
 * Preserves ex-showroom precision up to 2 decimal places in lakh (no whole-lakh rounding).
 */

export function inrToLakh(inr) {
  if (inr == null || Number.isNaN(Number(inr))) return null;
  return Number(inr) / 100000;
}

function trimFractionalZeros(value) {
  return String(value)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function formatScaledFraction(remainder, unitInr, maxDecimals) {
  if (!remainder || maxDecimals <= 0) return "";

  const scale = 10 ** maxDecimals;
  const fraction = Math.round((remainder * scale) / unitInr);
  if (fraction <= 0) return "";

  const fracStr = String(fraction).padStart(maxDecimals, "0");
  const trimmed = fracStr.replace(/0+$/, "");
  return trimmed ? `.${trimmed}` : "";
}

/**
 * @param {number} inr
 * @param {{ decimals?: number, maxDecimals?: number }} opts
 */
export function formatLakhAmount(inr, { decimals, maxDecimals = 2 } = {}) {
  const resolvedMax =
    typeof decimals === "number" ? decimals : maxDecimals;

  const n = Math.round(Number(inr));
  if (!Number.isFinite(n) || n < 0) return null;

  if (n >= 10000000) {
    const croreWhole = Math.floor(n / 10000000);
    const remainder = n % 10000000;
    const fraction = formatScaledFraction(
      remainder,
      10000000,
      resolvedMax
    );
    if (!fraction) {
      return `${croreWhole} Cr`;
    }
    return `${trimFractionalZeros(`${croreWhole}${fraction}`)} Cr`;
  }

  const lakhWhole = Math.floor(n / 100000);
  const remainder = n % 100000;
  const fraction = formatScaledFraction(remainder, 100000, resolvedMax);

  if (!fraction) {
    return `${lakhWhole} Lakh`;
  }

  return `${lakhWhole}${fraction} Lakh`;
}

/**
 * @param {number} inr
 * @param {{ prefix?: string, decimals?: number, maxDecimals?: number }} opts
 * @returns {string} e.g. "Starts at ₹6.99 Lakh"
 */
export function formatIndianPrice(
  inr,
  { prefix = "Starts at ", decimals, maxDecimals = 2 } = {}
) {
  const lakhLabel = formatLakhAmount(inr, { decimals, maxDecimals });
  if (!lakhLabel) return "Price on request";
  return `${prefix}₹${lakhLabel}`;
}

/** Compact card line: "₹6.99 Lakh" */
export function formatIndianPriceCompact(inr, { decimals, maxDecimals = 2 } = {}) {
  const lakhLabel = formatLakhAmount(inr, { decimals, maxDecimals });
  if (!lakhLabel) return "Price on request";
  return `₹${lakhLabel}`;
}
