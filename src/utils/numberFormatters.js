/**
 * Shared numeric presentation helpers for ownership tools.
 * Display only — does not alter calculator inputs or formulas.
 */

const INDIAN_DECIMAL_OPTIONS = Object.freeze({
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function parseNumeric(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatCurrencyAmount(value) {
  const amount = parseNumeric(value);
  if (amount == null) return "—";
  return `₹${amount.toLocaleString("en-IN", INDIAN_DECIMAL_OPTIONS)}`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatCostPerKm(value) {
  const rate = parseNumeric(value);
  if (rate == null) return "—";
  return `₹${rate.toFixed(2)}/km`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatEfficiency(value) {
  const efficiency = parseNumeric(value);
  if (efficiency == null) return "—";
  return `${efficiency.toFixed(2)} km/kWh`;
}

const PERCENTAGE_OPTIONS = Object.freeze({
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatPercentage(value) {
  const pct = parseNumeric(value);
  if (pct == null) return "—";
  return `${pct.toLocaleString("en-IN", PERCENTAGE_OPTIONS)}%`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatFuelEfficiency(value) {
  const efficiency = parseNumeric(value);
  if (efficiency == null) return "—";
  return `${efficiency.toFixed(2)} km/l`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatPlainNumber(value) {
  const num = parseNumeric(value);
  if (num == null) return "—";
  return num.toLocaleString("en-IN", INDIAN_DECIMAL_OPTIONS);
}

/**
 * Large ownership totals shown in lakh / crore.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatCurrencyLakh(value) {
  const amount = parseNumeric(value);
  if (amount == null) return "—";
  const lakh = amount / 100000;
  if (lakh >= 100) {
    return `₹${(lakh / 100).toFixed(2)} Cr`;
  }
  return `₹${lakh.toFixed(2)} lakh`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatElectricityTariff(value) {
  const rate = parseNumeric(value);
  if (rate == null) return "—";
  return `₹${rate.toLocaleString("en-IN", INDIAN_DECIMAL_OPTIONS)}/kWh`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatPetrolPricePerLitre(value) {
  const rate = parseNumeric(value);
  if (rate == null) return "—";
  return `₹${rate.toLocaleString("en-IN", INDIAN_DECIMAL_OPTIONS)}/litre`;
}
