/**
 * Hero quick-spec metrics — performance vs verified safety (detail page).
 * Extensible for Bharat NCAP, Global NCAP, ADAS, airbags, structural scores.
 */

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
  const safety = catalogMeta?.safety;
  if (!safety || typeof safety !== "object") return null;

  const bharat = safety.bharatNcap;
  if (bharat?.stars != null && Number.isFinite(Number(bharat.stars))) {
    const stars = Number(bharat.stars);
    const suffix = bharat.ratingYear ? ` (${bharat.ratingYear})` : "";
    return `${stars}★ Bharat NCAP${suffix}`;
  }

  const global = safety.globalNcap;
  if (global?.stars != null && Number.isFinite(Number(global.stars))) {
    const stars = Number(global.stars);
    const suffix = global.ratingYear ? ` (${global.ratingYear})` : "";
    return `${stars}★ Global NCAP${suffix}`;
  }

  const adas = safety.adas;
  if (adas?.level != null && adas?.verified === true) {
    return `ADAS Level ${adas.level}`;
  }

  if (
    safety.structuralScore != null &&
    Number.isFinite(Number(safety.structuralScore)) &&
    safety.structuralScoreVerified === true
  ) {
    return `Structural safety ${Number(safety.structuralScore)}/100`;
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
