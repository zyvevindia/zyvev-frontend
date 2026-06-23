/**
 * Resolve a human-readable vehicle name for comparison output.
 */

import { KNOWN_VEHICLE_NAMES } from "./constants.js";

/**
 * @param {string} value
 * @returns {string}
 */
function preserveOemCasing(value) {
  return String(value || "").replace(
    /\b(mg|byd|bmw|ev|kia|tata|mahindra|hyundai|citroen|mercedes|volvo)\b/gi,
    (match) => {
      const upper = match.toUpperCase();
      if (upper === "MG") return "MG";
      if (upper === "BYD") return "BYD";
      if (upper === "EV") return "EV";
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    }
  );
}

/**
 * @param {string} slug
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} scoreProfile
 * @param {object|null|undefined} intelligenceCar
 * @returns {string}
 */
export function resolveVehicleName(slug, scoreProfile, intelligenceCar = null) {
  const normalizedSlug = String(slug || scoreProfile?.vehicleSlug || "")
    .trim()
    .toLowerCase();

  if (KNOWN_VEHICLE_NAMES[normalizedSlug]) {
    return KNOWN_VEHICLE_NAMES[normalizedSlug];
  }

  const summary = scoreProfile?.explanation?.summary || "";
  const summaryNameMatch = summary.match(
    /\b(?:the\s+)?((?:Tata\s+)?Nexon EV|Curvv EV|Tiago EV|Comet EV|BYD Seal|BE 6|Ioniq 5)\b/i
  );
  if (summaryNameMatch?.[1]) {
    return preserveOemCasing(
      summaryNameMatch[1].replace(/^Tata\s+/i, "").trim()
    );
  }

  const candidates = [
    intelligenceCar?.displayName,
    intelligenceCar?.name,
    intelligenceCar?.catalogMeta?.displayName,
    intelligenceCar?.fields?.displayName,
    KNOWN_VEHICLE_NAMES[normalizedSlug],
  ]
    .map((value) => preserveOemCasing(String(value || "").trim()))
    .filter(Boolean);

  if (candidates.length) {
    return candidates[0];
  }

  if (normalizedSlug) {
    return preserveOemCasing(
      normalizedSlug
        .split("-")
        .filter((part) => part !== "ev" && part.length > 1)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
        .concat(normalizedSlug.includes("-ev") ? " EV" : "")
        .trim()
    );
  }

  return "This EV";
}
