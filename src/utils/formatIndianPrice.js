/**
 * Indian-market price formatting (Lakh / Crore).
 */

export function inrToLakh(inr) {
  if (inr == null || Number.isNaN(Number(inr))) return null;
  return Number(inr) / 100000;
}

export function formatLakhAmount(inr, { decimals = 1 } = {}) {
  const lakh = inrToLakh(inr);
  if (lakh == null) return null;
  if (lakh >= 100) {
    const crore = lakh / 100;
    return `${crore.toFixed(decimals)} Cr`;
  }
  const fixed =
    decimals === 0
      ? String(Math.round(lakh))
      : lakh.toFixed(decimals);
  const trimmed = fixed.replace(/\.0$/, "");
  return `${trimmed} Lakh`;
}

/**
 * @param {number} inr
 * @param {{ prefix?: string, decimals?: number }} opts
 * @returns {string} e.g. "Starts at ₹18 Lakh"
 */
export function formatIndianPrice(
  inr,
  { prefix = "Starts at ", decimals = 1 } = {}
) {
  const lakhLabel = formatLakhAmount(inr, { decimals });
  if (!lakhLabel) return "Price on request";
  return `${prefix}₹${lakhLabel}`;
}

/** Compact card line: "₹18.0 Lakh" */
export function formatIndianPriceCompact(inr, { decimals = 1 } = {}) {
  const lakhLabel = formatLakhAmount(inr, { decimals });
  if (!lakhLabel) return "Price on request";
  return `₹${lakhLabel}`;
}
