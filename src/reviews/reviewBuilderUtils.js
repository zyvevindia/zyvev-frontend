/**
 * Shared helpers for review intelligence builders.
 */

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { buildConfidenceLabels } from "../intelligence/buildConfidenceLabels.js";
import { CONFIDENCE_LABELS } from "../intelligence/confidenceRules.js";
import { REVIEW_CONFIDENCE } from "./constants.js";

/**
 * @param {string|null|undefined} slug
 * @returns {string}
 */
function normalizeReviewSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * @param {object|null|undefined} vehicle
 * @param {string} slug
 * @returns {string}
 */
function resolveReviewBrand(vehicle, slug) {
  const candidates = [
    vehicle?.brand,
    vehicle?.catalogMeta?.brand,
    vehicle?.catalogMeta?.manufacturer,
  ];

  for (const candidate of candidates) {
    const brand = String(candidate || "").trim();
    if (brand && !/^ev brand$/i.test(brand)) {
      return brand;
    }
  }

  const segment = slug.split("-")[0] || "";
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "";
}

/**
 * @param {string} rawSlug
 * @returns {string}
 */
function extractFamilySlug(rawSlug) {
  const slug = normalizeReviewSlug(rawSlug);
  if (!slug) return "";

  if (TIER1_MODEL_FAMILY_SLUGS.includes(slug)) {
    return slug;
  }

  for (const family of TIER1_MODEL_FAMILY_SLUGS) {
    if (slug.startsWith(`${family}-`)) {
      return family;
    }
  }

  return slug;
}

/**
 * @param {string} familySlug
 * @param {string} [brandLabel]
 * @returns {string}
 */
function formatFamilyName(familySlug, brandLabel = "") {
  const slug = normalizeReviewSlug(familySlug);
  if (!slug) return "Electric Vehicle";

  const family = TIER1_MODEL_FAMILY_SLUGS.find(
    (item) => item === slug || slug.startsWith(`${item}-`)
  );
  const modelPart = family
    ? family.replace(/^[a-z]+-/, "")
    : slug.replace(/^[a-z]+-/, "");

  const modelTitle = modelPart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const brand =
    brandLabel && !/^ev brand$/i.test(String(brandLabel).trim())
      ? String(brandLabel).trim()
      : slug.split("-")[0].charAt(0).toUpperCase() + slug.split("-")[0].slice(1);

  return `${brand} ${modelTitle}`.trim();
}

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

  const brand = resolveReviewBrand(
    {
      ...(vehicle || {}),
      familySlug: slug,
      slug,
    },
    slug
  );

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
