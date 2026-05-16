/**
 * Canonical vehicle detail routing — /cars/:slug
 */

import { SITE_ORIGIN } from "../config";

import { extractFamilySlug } from "./modelFamily";

export const CANONICAL_VEHICLE_PREFIX = "/cars";
export const LEGACY_VEHICLE_PREFIX = "/car";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalize slug for URLs and API lookup (deterministic).
 */
export function normalizeVehicleSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidVehicleSlug(slug) {
  const n = normalizeVehicleSlug(slug);
  return n.length > 0 && SLUG_PATTERN.test(n);
}

/** Deterministic legacy aliases only — no fuzzy matching */
export const LEGACY_SLUG_ALIASES = {
  "tata-nexon-ev-long-range": "tata-nexon-ev-empowered-lr",
  "tata-nexon-ev-lr": "tata-nexon-ev-empowered-lr",
};

export function resolveSlugCandidates(rawSlug) {
  const normalized = normalizeVehicleSlug(rawSlug);
  const candidates = [];

  if (normalized) candidates.push(normalized);

  const rawLower = String(rawSlug || "")
    .trim()
    .toLowerCase();
  if (rawLower && rawLower !== normalized) {
    candidates.push(rawLower);
  }

  const alias = LEGACY_SLUG_ALIASES[normalized];
  if (alias) candidates.push(alias);

  return [...new Set(candidates.filter(Boolean))];
}

/**
 * In-app path for vehicle detail (canonical).
 */
/**
 * Canonical in-app path — always model-family slug for discovery cards.
 */
export function vehicleFamilyPath(familySlug, variantSlug) {
  const family = normalizeVehicleSlug(familySlug);
  if (!family) {
    return CANONICAL_VEHICLE_PREFIX;
  }

  const base = `${CANONICAL_VEHICLE_PREFIX}/${family}`;
  const variant = normalizeVehicleSlug(variantSlug);

  if (variant && variant !== family) {
    return `${base}?variant=${encodeURIComponent(variant)}`;
  }

  return base;
}

export function vehicleDetailPath(slugOrCar, idFallback) {
  const slug =
    typeof slugOrCar === "string"
      ? slugOrCar
      : slugOrCar?.familySlug ||
        slugOrCar?.slug;

  const normalized = normalizeVehicleSlug(slug);

  if (normalized) {
    const family = extractFamilySlug(normalized);
    const variant =
      typeof slugOrCar === "object" && slugOrCar?.variantSlug
        ? slugOrCar.variantSlug
        : normalized !== family
          ? normalized
          : undefined;
    return vehicleFamilyPath(family || normalized, variant);
  }

  if (idFallback) {
    return `${CANONICAL_VEHICLE_PREFIX}/${idFallback}`;
  }

  return CANONICAL_VEHICLE_PREFIX;
}

/**
 * Absolute canonical URL for SEO (always /cars/:slug).
 */
export function canonicalVehicleUrl(
  slug,
  siteOrigin = SITE_ORIGIN
) {
  const normalized = normalizeVehicleSlug(slug);
  if (!normalized) {
    return `${siteOrigin}${CANONICAL_VEHICLE_PREFIX}`;
  }
  return `${siteOrigin}${CANONICAL_VEHICLE_PREFIX}/${normalized}`;
}

export function isLegacyVehiclePath(pathname) {
  return (
    pathname?.startsWith(`${LEGACY_VEHICLE_PREFIX}/`) &&
    !pathname?.startsWith(`${CANONICAL_VEHICLE_PREFIX}/`)
  );
}
