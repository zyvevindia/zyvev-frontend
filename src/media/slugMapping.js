/**
 * Normalized slug mapping — vehicle, family, compare, Cloudinary public IDs.
 */

import {
  PRODUCTION_FAMILY_SLUGS,
  resolveFamilySlugFromCar,
  resolveFamilySlugFromVariantSlug,
} from "./familyMediaManifest.js";
import { CATALOG_MEDIA_PREFIX } from "../config/media.js";

export { resolveFamilySlugFromCar, resolveFamilySlugFromVariantSlug };

/** @param {string} slug */
export function normalizeVehicleSlug(slug = "") {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Compare pair slug from two vehicle slugs (sorted, deterministic).
 * @param {string[]} slugs
 */
export function normalizeComparePairSlug(slugs = []) {
  const parts = slugs.map(normalizeVehicleSlug).filter(Boolean).sort();
  if (parts.length < 2) return "";
  return parts.join("-vs-");
}

/**
 * Cloudinary family public_id prefix for a family slug.
 * @param {string} familySlug
 */
export function familyMediaPublicIdPrefix(familySlug) {
  const family = normalizeVehicleSlug(familySlug);
  if (!family) return null;
  return `${CATALOG_MEDIA_PREFIX}/families/${family}`;
}

/**
 * Whether manifest, API slug, and variant slug align to a known family.
 * @param {object} car
 */
export function resolveMediaSlugMapping(car = {}) {
  const variantSlug = normalizeVehicleSlug(
    car?.slug || car?.catalogMeta?.slug || ""
  );
  const explicitFamily = normalizeVehicleSlug(
    car?.familySlug || car?.catalogMeta?.familySlug || ""
  );
  const resolvedFamily =
    resolveFamilySlugFromCar(car) ||
    resolveFamilySlugFromVariantSlug(variantSlug);
  const inManifest = PRODUCTION_FAMILY_SLUGS.includes(resolvedFamily);
  const mismatch =
    explicitFamily &&
    resolvedFamily &&
    explicitFamily !== resolvedFamily &&
    !explicitFamily.startsWith(`${resolvedFamily}-`);

  return {
    variantSlug,
    explicitFamily: explicitFamily || null,
    resolvedFamily: resolvedFamily || null,
    inManifest,
    mismatch: Boolean(mismatch),
    publicIdPrefix: resolvedFamily
      ? familyMediaPublicIdPrefix(resolvedFamily)
      : null,
  };
}
