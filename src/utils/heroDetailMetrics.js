/**
 * Hero quick-spec metrics — performance vs verified safety (detail page).
 * Extensible for Bharat NCAP, Global NCAP, ADAS, airbags, structural scores.
 */

import {
  normalizeSafetyMetadata,
  SAFETY_FIELD_STATUS,
} from "../intelligence/safetyMetadata.js";

const EMPTY_VALUES = new Set(["", "—", "N/A", "n/a", "na", "null", "undefined"]);

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function formatHeroAccelerationLabel(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || EMPTY_VALUES.has(s)) return null;

  const normalized = s.replace(/\s*\(\s*0\s*[-–]\s*100\s*\)/i, "").trim();
  if (/^\d+(\.\d+)?\s*s(ec)?\.?$/i.test(normalized)) {
    return `${normalized.replace(/\s*sec\.?$/i, "s")} (0–100)`;
  }

  if (/0\s*[-–]\s*100|0-100/i.test(s)) {
    return s.replace(/0\s*-\s*100/gi, "0–100");
  }

  return s;
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
 * Fourth hero card: acceleration when available, else verified safety, else empty acceleration slot.
 * @param {{ accelerationRaw?: unknown, catalogMeta?: object | null }} params
 * @returns {{ kind: "acceleration" | "safety", label: string, icon: string, value: string }}
 */
export function resolveHeroFourthQuickSpec({
  accelerationRaw,
  catalogMeta = null,
}) {
  const acceleration = formatHeroAccelerationLabel(accelerationRaw);
  if (acceleration) {
    return {
      kind: "acceleration",
      label: "Acceleration",
      icon: "⏱",
      value: acceleration,
    };
  }

  const safetyRating = resolveVerifiedSafetyRating(catalogMeta);
  if (safetyRating) {
    return {
      kind: "safety",
      label: "Safety",
      icon: "🛡",
      value: safetyRating,
    };
  }

  return {
    kind: "acceleration",
    label: "Acceleration",
    icon: "⏱",
    value: "—",
  };
}
