/**
 * Shared helpers for review intelligence builders.
 */

import { extractFamilySlug, formatFamilyName } from "../utils/modelFamily.js";
import { resolveVehicleBrand } from "../utils/vehicleDisplayName.js";
import { buildConfidenceLabels } from "../intelligence/buildConfidenceLabels.js";
import { CONFIDENCE_LABELS } from "../intelligence/confidenceRules.js";
import { REVIEW_CONFIDENCE } from "./constants.js";

/**
 * @template T
 * @param {() => T} buildFn
 * @param {T} [fallback]
 * @returns {T}
 */
export function safeReviewBuild(buildFn, fallback = null) {
  try {
    return buildFn();
  } catch {
    return fallback;
  }
}

/**
 * Map intelligence confidence labels to editorial review confidence.
 * @param {import("../intelligence/types.js").ConfidenceLabel | null | undefined} overall
 * @returns {import("./types.js").ReviewConfidence}
 */
export function mapIntelligenceConfidenceToReview(overall) {
  if (overall === CONFIDENCE_LABELS.VERIFIED) {
    return REVIEW_CONFIDENCE.VERIFIED;
  }
  if (overall === CONFIDENCE_LABELS.ESTIMATED) {
    return REVIEW_CONFIDENCE.ESTIMATED;
  }
  return REVIEW_CONFIDENCE.EDITORIAL;
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {import("./types.js").ReviewConfidence}
 */
export function resolveReviewConfidence(vehicle) {
  const labels = safeReviewBuild(() => buildConfidenceLabels(vehicle));
  return mapIntelligenceConfidenceToReview(labels?.overall);
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
export function resolveVehicleSlug(vehicle) {
  if (!vehicle || typeof vehicle !== "object") return "";

  return (
    vehicle.slug ||
    vehicle.familySlug ||
    vehicle.fields?.familySlug ||
    vehicle.id ||
    ""
  );
}

/**
 * @param {object|null|undefined} vehicle
 * @param {string} [familySlugOverride]
 * @returns {string}
 */
export function resolveReviewFamilyName(vehicle, familySlugOverride = "") {
  const slug =
    familySlugOverride ||
    extractFamilySlug(resolveVehicleSlug(vehicle)) ||
    resolveVehicleSlug(vehicle);

  if (!slug) return "Electric vehicle";

  const brand = resolveVehicleBrand({
    ...(vehicle || {}),
    familySlug: slug,
    slug,
  });

  return formatFamilyName(slug, brand);
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
export function resolveVehicleDisplayName(vehicle) {
  return resolveReviewFamilyName(vehicle);
}

/**
 * @deprecated Prefer resolveReviewFamilyName for review surfaces.
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
export function resolveVehicleVariantDisplayName(vehicle) {
  if (!vehicle || typeof vehicle !== "object") return "EV";

  return (
    vehicle.name ||
    vehicle.displayName ||
    vehicle.fields?.model ||
    vehicle.vehicle?.model ||
    resolveVehicleSlug(vehicle) ||
    "EV"
  );
}

/**
 * @param {number|null|undefined} cityScore
 * @returns {string|null}
 */
export function resolveCityDrivingNarrative(cityScore) {
  if (cityScore == null || !Number.isFinite(Number(cityScore))) {
    return null;
  }

  const score = Number(cityScore);

  if (score > 80) {
    return "Excels in stop-and-go urban traffic with easy daily use.";
  }
  if (score >= 65) {
    return "Well suited to urban commuting and local errands.";
  }
  if (score >= 50) {
    return "Capable for city use with sensible everyday range.";
  }

  return "Best kept to shorter city trips and local driving.";
}

/**
 * @param {string[]} parts
 * @returns {string}
 */
export function joinReviewSentences(parts = []) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * @param {string[]} items
 * @returns {string}
 */
export function joinReviewList(items = []) {
  const cleaned = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (!cleaned.length) return "";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned.at(-1)}`;
}
