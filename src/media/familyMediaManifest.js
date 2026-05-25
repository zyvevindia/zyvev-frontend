/**
 * Production family media — Cloudinary public assets for soft launch.
 * Upload targets: evsavari/catalog/families/{familySlug}/
 */

import {
  familyCatalogAssetUrl,
  familyCatalogUrl,
} from "./cloudinary.js";
import { PRODUCTION_FAMILY_SLUGS } from "./productionFamilies.js";

const FAMILIES = [...PRODUCTION_FAMILY_SLUGS];

/**
 * Core production assets only — optional gallery/interior/charging are not
 * probed until verified (see catalogMediaAvailability.js).
 */
function familyMediaBlock(familySlug) {
  return {
    heroImage: familyCatalogAssetUrl(familySlug, "hero"),
    listingThumbnail: familyCatalogAssetUrl(familySlug, "listing-thumb"),
    compareThumbnail: familyCatalogAssetUrl(familySlug, "compare-thumb"),
    ogImage: null,
    gallery: [],
    interior: [],
    charging: [],
  };
}

/** @type {Record<string, ReturnType<typeof familyMediaBlock>>} */
export const PRODUCTION_FAMILY_MEDIA = Object.fromEntries(
  FAMILIES.map((slug) => [slug, familyMediaBlock(slug)])
);

export { PRODUCTION_FAMILY_SLUGS, isProductionFamilySlug } from "./productionFamilies.js";

const FAMILY_PREFIXES = [...PRODUCTION_FAMILY_SLUGS].sort(
  (a, b) => b.length - a.length
);

/**
 * Map variant slug → family slug (longest prefix match).
 */
export function resolveFamilySlugFromVariantSlug(variantSlug = "") {
  const slug = String(variantSlug || "").trim().toLowerCase();
  if (!slug) return null;
  if (PRODUCTION_FAMILY_MEDIA[slug]) return slug;
  for (const family of FAMILY_PREFIXES) {
    if (slug === family || slug.startsWith(`${family}-`)) {
      return family;
    }
  }
  return null;
}

export function resolveFamilySlugFromCar(car = {}) {
  const explicit =
    car?.familySlug ||
    car?.catalogMeta?.familySlug;
  if (explicit) return String(explicit).toLowerCase();

  const brand =
    car?.brandSlug ||
    car?.catalogMeta?.brandSlug ||
    String(car?.brand || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  const model =
    car?.modelSlug ||
    car?.catalogMeta?.modelSlug ||
    car?.identity?.modelSlug;

  if (brand && model) {
    const composed = `${brand}-${model}`.toLowerCase();
    if (PRODUCTION_FAMILY_MEDIA[composed]) return composed;
    return composed;
  }

  return resolveFamilySlugFromVariantSlug(
    car?.slug || car?.catalogMeta?.slug || ""
  );
}

export function getProductionFamilyMedia(familySlug) {
  const key = resolveFamilySlugFromVariantSlug(familySlug) || familySlug;
  return PRODUCTION_FAMILY_MEDIA[key] || null;
}
