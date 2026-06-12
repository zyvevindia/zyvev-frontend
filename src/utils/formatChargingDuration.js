/**
 * Buyer-facing charging duration formatting (display only — never mutate source data).
 */

/**
 * Format a charging duration number for display.
 * Round to max 2 decimal places, preserve meaningful hundredths, strip trailing zeros.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatChargingDurationNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");

  const rounded = Math.round(n * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

const DURATION_NUMBER_PATTERN =
  /(\d+(?:\.\d+)?)(?=\s*(?:min(?:ute)?s?|hrs|hours|hr|h(?:our)?s?)\b)/gi;

/**
 * Format decimal durations inside charging copy (e.g. specs.chargingTime strings).
 * @param {unknown} text
 * @returns {string}
 */
export function formatChargingDurationDisplay(text) {
  if (text == null || text === "") return text;
  return String(text).replace(DURATION_NUMBER_PATTERN, (match) =>
    formatChargingDurationNumber(match)
  );
}

/**
 * True when a compare/spec row value likely contains charging durations.
 * @param {{ id?: string, group?: string }} row
 * @param {unknown} raw
 */
/**
 * Format AC 0–100% duration as buyer-facing "9 hr 24 min" copy.
 * @param {unknown} hours
 * @returns {string | null}
 */
export function formatAcChargeDurationLabel(hours) {
  if (hours == null || hours === "") return null;
  const total = Number(hours);
  if (!Number.isFinite(total) || total <= 0) return null;

  const wholeHours = Math.floor(total);
  const minutes = Math.round((total - wholeHours) * 60);

  if (wholeHours > 0 && minutes > 0) {
    return `${wholeHours} hr ${minutes} min`;
  }
  if (wholeHours > 0) return `${wholeHours} hr`;
  if (minutes > 0) return `${minutes} min`;
  return null;
}

/**
 * @param {unknown} bhp
 * @returns {string | null}
 */
export function formatPowerBhpLabel(bhp) {
  if (bhp == null || bhp === "") return null;
  const n = Number(bhp);
  if (!Number.isFinite(n) || n <= 0) return null;
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded)
    ? `${rounded} bhp`
    : `${rounded.toFixed(1)} bhp`;
}

export function shouldFormatChargingDurationCell(row, raw) {
  if (raw == null || raw === "") return false;
  if (row?.group === "charging") return true;
  if (row?.id === "ac_charging" || row?.id === "dc_charging") return true;
  if (
    typeof raw === "string" &&
    DURATION_NUMBER_PATTERN.test(raw)
  ) {
    DURATION_NUMBER_PATTERN.lastIndex = 0;
    return true;
  }
  return false;
}
