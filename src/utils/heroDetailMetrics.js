/**
 * Hero quick-spec metrics — verified acceleration & charging summaries (detail page).
 */

import {
  formatChargingDurationNumber,
} from "./formatChargingDuration.js";
import {
  normalizeSafetyMetadata,
  SAFETY_FIELD_STATUS,
} from "../intelligence/safetyMetadata.js";

const EMPTY_VALUES = new Set(["", "—", "N/A", "n/a", "na", "null", "undefined"]);

/**
 * @param {unknown} raw
 */
function looksLikeTopSpeedValue(raw) {
  if (raw == null) return true;
  const s = String(raw).trim();
  if (!s || EMPTY_VALUES.has(s)) return true;
  if (/0\s*[-–]\s*100|0\s*[-–]\s*60|0-100|0-60/i.test(s)) return false;
  if (/^\d+(\.\d+)?\s*s(ec)?\.?$/i.test(s) && !/km/i.test(s)) return false;
  return /km\s*\/\s*h|kmph|\bkph\b|top\s*speed/i.test(s);
}

/**
 * @param {number} seconds
 * @param {"0–100" | "0–60"} band
 */
function accelFromSeconds(seconds, band) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0 || n > 60) return null;
  return { band, seconds: n, verified: true };
}

/**
 * @param {string} text
 * @param {boolean} [allowUnverified]
 */
function parseAccelerationString(text, allowUnverified = false) {
  const s = String(text || "").trim();
  if (!s || looksLikeTopSpeedValue(s)) return null;

  const m100Lead = s.match(
    /(\d+(?:\.\d+)?)\s*s(?:ec)?\.?\s*\(?\s*0\s*[-–]\s*100/i
  );
  if (m100Lead) {
    return accelFromSeconds(m100Lead[1], "0–100");
  }

  const m100Trail = s.match(/0\s*[-–]\s*100[^0-9]*(\d+(?:\.\d+)?)\s*s/i);
  if (m100Trail) {
    return accelFromSeconds(m100Trail[1], "0–100");
  }

  const m60Lead = s.match(
    /(\d+(?:\.\d+)?)\s*s(?:ec)?\.?\s*\(?\s*0\s*[-–]\s*60/i
  );
  if (m60Lead) {
    return accelFromSeconds(m60Lead[1], "0–60");
  }

  const m60Trail = s.match(/0\s*[-–]\s*60[^0-9]*(\d+(?:\.\d+)?)\s*s/i);
  if (m60Trail) {
    return accelFromSeconds(m60Trail[1], "0–60");
  }

  if (allowUnverified) {
    const legacy = formatHeroAccelerationLabelLegacy(s);
    if (legacy) {
      const band = /0\s*[-–]\s*60|0-60/i.test(legacy) ? "0–60" : "0–100";
      const sec = legacy.match(/(\d+(?:\.\d+)?)/);
      if (sec) return accelFromSeconds(sec[1], band);
    }
  }

  return null;
}

/** @deprecated internal — legacy label cleanup for ops completeness */
function formatHeroAccelerationLabelLegacy(raw) {
  const s = String(raw).trim();
  if (!s || EMPTY_VALUES.has(s) || looksLikeTopSpeedValue(s)) return null;

  const normalized = s.replace(/\s*\(\s*0\s*[-–]\s*100\s*\)/i, "").trim();
  if (/^\d+(\.\d+)?\s*s(ec)?\.?$/i.test(normalized)) {
    return `${normalized.replace(/\s*sec\.?$/i, "s")} (0–100)`;
  }

  if (/0\s*[-–]\s*100|0-100/i.test(s)) {
    return s.replace(/0\s*-\s*100/gi, "0–100");
  }

  return null;
}

/**
 * Ops / audit helper — returns display label or null (never top speed).
 * @param {unknown} raw
 */
export function formatHeroAccelerationLabel(raw) {
  const parsed = parseAccelerationString(String(raw ?? ""), false);
  return formatVerifiedAccelerationDisplay(parsed);
}

/**
 * @param {{ variant?: object | null, catalogMeta?: object | null }} params
 * @returns {{ band: string, seconds: number, verified: boolean } | null}
 */
export function parseVerifiedAcceleration({
  variant = null,
  catalogMeta = null,
} = {}) {
  const meta = catalogMeta || variant?.catalogMeta || {};
  const perf = meta.performance || {};
  const specs = variant?.specifications || variant?.specs || {};

  const from100 = accelFromSeconds(
    perf.acceleration0to100 ?? specs.acceleration0to100,
    "0–100"
  );
  if (from100) return from100;

  const from60 = accelFromSeconds(
    perf.acceleration0to60 ??
      perf.acceleration0To60 ??
      specs.acceleration0to60,
    "0–60"
  );
  if (from60) return from60;

  const variantAccel =
    variant?.accel0To100 ||
    variant?.compareSpecs?.acceleration0to100 ||
    specs.acceleration;

  const parsedVariant = parseAccelerationString(
    variantAccel || specs.acceleration || perf.acceleration,
    meta.verified === true
  );
  if (parsedVariant) return parsedVariant;

  return null;
}

/**
 * @param {{ band: string, seconds: number } | null} parsed
 * @returns {string | null}
 */
export function formatVerifiedAccelerationDisplay(parsed) {
  if (!parsed?.verified || parsed.seconds == null) return null;
  const sec =
    Number(parsed.seconds) % 1 === 0
      ? String(parsed.seconds)
      : String(parsed.seconds);
  return `${parsed.band} in ${sec}s`;
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parseMinutesValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }
  const s = String(value);
  const range = s.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*min/i);
  if (range) {
    return Math.min(Number(range[1]), Number(range[2]));
  }
  const single = s.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (single) return Number(single[1]);
  const num = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(num) && num > 0 && num < 300 ? num : null;
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parseAcHoursValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }
  const s = String(value);
  const hrs = s.match(/(\d+(?:\.\d+)?)\s*h(?:r|our)?s?/i);
  if (hrs) return Number(hrs[1]);
  const num = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(num) && num > 0 && num <= 24 ? num : null;
}

/**
 * @param {number} hours
 */
function formatAcHoursLabel(hours) {
  const formatted = formatChargingDurationNumber(hours);
  return formatted || null;
}

/**
 * Buyer-friendly hero charging: shortest DC 10–80 → longest AC full charge.
 * @param {object | null} variant
 * @param {object | null} catalogMeta
 * @returns {string | null}
 */
export function resolveHeroChargingSummary(variant = null, catalogMeta = null) {
  const meta = catalogMeta || variant?.catalogMeta || {};
  const intel = meta.chargingIntelligence || {};
  const prac = meta.chargingPracticality || {};
  const eco = meta.chargingEcosystem || {};
  const curve = eco.fastChargeCurve || {};
  const variantCharging = variant?.chargingMeta || {};

  const dcCandidates = [
    intel.dcTime10to80Minutes,
    prac.dcTime10to80Minutes,
    curve.time10to80Min,
    variantCharging.dcTime10to80Minutes,
  ]
    .map(parseMinutesValue)
    .filter((n) => n != null);

  const acCandidates = [
    prac.acFullChargeHours,
    intel.acTime0to100Hours,
    variantCharging.acTime0to100Hours,
    parseAcHoursValue(meta.chargingSummary),
  ]
    .map((v) =>
      typeof v === "number" ? (v > 0 ? v : null) : parseAcHoursValue(v)
    )
    .filter((n) => n != null);

  const dcMin =
    dcCandidates.length > 0 ? Math.min(...dcCandidates) : null;
  const acMax =
    acCandidates.length > 0 ? Math.max(...acCandidates) : null;

  if (dcMin == null && acMax == null) return null;

  const dcPart =
    dcMin != null ? `${Math.round(dcMin)} min` : null;
  const acPart =
    acMax != null ? `${formatAcHoursLabel(acMax)} hrs` : null;

  if (dcPart && acPart) return `${dcPart} – ${acPart}`;
  return dcPart || acPart;
}

/**
 * Verified safety ratings only — no inferred or feature-list fallbacks.
 * @param {object | null | undefined} catalogMeta
 * @returns {string | null}
 */
export function resolveVerifiedSafetyRating(catalogMeta) {
  const normalized = normalizeSafetyMetadata(catalogMeta?.safety);
  const bharat = normalized.bharatNcap;
  if (
    bharat.status === SAFETY_FIELD_STATUS.VERIFIED &&
    bharat.stars != null
  ) {
    const suffix = bharat.ratingYear ? ` (${bharat.ratingYear})` : "";
    return `${bharat.stars}★ Bharat NCAP${suffix}`;
  }

  const global = normalized.globalNcap;
  if (
    global.status === SAFETY_FIELD_STATUS.VERIFIED &&
    global.stars != null
  ) {
    const suffix = global.ratingYear ? ` (${global.ratingYear})` : "";
    return `${global.stars}★ Global NCAP${suffix}`;
  }

  const adas = normalized.adas;
  if (
    adas.status === SAFETY_FIELD_STATUS.VERIFIED &&
    adas.level != null
  ) {
    return `ADAS Level ${adas.level}`;
  }

  const structural = catalogMeta?.safety?.structuralScore;
  if (
    structural != null &&
    Number.isFinite(Number(structural)) &&
    catalogMeta?.safety?.structuralScoreVerified === true
  ) {
    return `Structural safety ${Number(structural)}/100`;
  }

  return null;
}

/**
 * Fourth hero card — verified acceleration, else verified safety, else hidden.
 * @param {{ variant?: object | null, catalogMeta?: object | null }} params
 * @returns {{ kind: "acceleration" | "safety", label: string, icon: string, value: string } | null}
 */
export function resolveHeroFourthQuickSpec({
  variant = null,
  catalogMeta = null,
} = {}) {
  const meta = catalogMeta || variant?.catalogMeta || null;
  const accelLabel = formatVerifiedAccelerationDisplay(
    parseVerifiedAcceleration({ variant, catalogMeta: meta })
  );

  if (accelLabel) {
    return {
      kind: "acceleration",
      label: "Acceleration",
      icon: "⏱",
      value: accelLabel,
    };
  }

  const safetyRating = resolveVerifiedSafetyRating(meta);
  if (safetyRating) {
    return {
      kind: "safety",
      label: "Safety",
      icon: "🛡",
      value: safetyRating,
    };
  }

  return null;
}
