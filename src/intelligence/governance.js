/**
 * Data governance helpers — never fabricate OEM facts.
 */

export const UNAVAILABLE = null;

export function isPresent(value) {
  if (value === UNAVAILABLE || value === undefined) return false;
  if (value === null) return false;
  if (typeof value === "string" && !value.trim()) return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;
  return true;
}

export function formatUnavailable(label = "Data unavailable") {
  return { display: label, available: false, estimated: false };
}

/**
 * @param {*} value
 * @param {{ suffix?: string, estimated?: boolean, unavailableLabel?: string }} opts
 */
export function formatIntelligenceValue(value, opts = {}) {
  const {
    suffix = "",
    estimated = false,
    unavailableLabel = "—",
  } = opts;

  if (!isPresent(value)) {
    return {
      display: unavailableLabel,
      available: false,
      estimated: false,
      raw: UNAVAILABLE,
    };
  }

  const display =
    typeof value === "number"
      ? `${value.toLocaleString("en-IN")}${suffix}`
      : `${value}${suffix}`;

  return {
    display: estimated ? `~${display}` : display,
    available: true,
    estimated,
    raw: value,
  };
}

export function pickFirstPresent(...candidates) {
  for (const c of candidates) {
    if (isPresent(c)) return c;
  }
  return UNAVAILABLE;
}

export function parseKwhFromText(text) {
  if (!text) return UNAVAILABLE;
  const match = String(text).match(/([\d.]+)\s*kwh/i);
  return match ? Number(match[1]) : UNAVAILABLE;
}

export function parseMinutesFromText(text) {
  if (!text) return UNAVAILABLE;
  const s = String(text);
  const dcMatch = s.match(/(\d+)\s*(?:min|minutes)/i);
  if (dcMatch) return Number(dcMatch[1]);
  const hourMatch = s.match(/([\d.]+)\s*h(?:our|rs)?/i);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);
  return UNAVAILABLE;
}

export function inferConnectorFromText(text) {
  if (!text) return UNAVAILABLE;
  const s = String(text).toUpperCase();
  if (s.includes("CCS2") || s.includes("CCS 2")) return "CCS2";
  if (s.includes("TYPE 2") || s.includes("TYPE-2")) return "Type 2";
  if (s.includes("CHADEMO")) return "CHAdeMO";
  if (s.includes("GB/T")) return "GB/T";
  return UNAVAILABLE;
}
