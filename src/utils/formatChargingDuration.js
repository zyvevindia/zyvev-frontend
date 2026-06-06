/**
 * Buyer-facing charging duration formatting (display only — never mutate source data).
 */

/**
 * Format a charging duration number with human-friendly precision.
 * Max 2 decimal places, strip trailing zeros, shortest meaningful form.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatChargingDurationNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");

  const rounded2 = Math.round(n * 100) / 100;
  const cents = Math.round((rounded2 - Math.trunc(rounded2)) * 100);

  if (cents === 0) {
    return String(Math.trunc(rounded2));
  }

  if (cents % 10 === 0) {
    const one = Math.round(n * 10) / 10;
    return Number.isInteger(one)
      ? String(one)
      : one.toFixed(1).replace(/\.0$/, "");
  }

  if (cents === 33 || cents === 34) {
    const one = Math.round(n * 10) / 10;
    return one.toFixed(1).replace(/\.0$/, "");
  }

  return rounded2.toFixed(2).replace(/\.?0+$/, "");
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
