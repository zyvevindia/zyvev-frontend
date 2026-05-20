/**
 * Vehicle image resolution with Cloudinary-first delivery and fallbacks.
 */

import { LOCAL_FALLBACK_EV, ROLE_ASPECT } from "../config/media.js";
import {
  coerceCatalogMediaToUrl,
  familyCatalogUrl,
  isPlaceholderMediaUrl,
} from "../media/cloudinary.js";
import {
  isManifestGuessCatalogUrl,
  isValidImageUrl,
  sanitizeImageUrl,
} from "./imageUrl.js";
import {
  getProductionFamilyMedia,
  isProductionFamilySlug,
  resolveFamilySlugFromCar,
  resolveFamilySlugFromVariantSlug,
} from "../media/familyMediaManifest.js";
import { pickMediaFields } from "../media/vehicleMediaSchema.js";

/** @deprecated use ROLE_ASPECT from config/media */
export const IMAGE_ASPECT = ROLE_ASPECT;

export const LOCAL_FALLBACK_EV_EXPORT = LOCAL_FALLBACK_EV;

export function brandFallbackUrl() {
  return LOCAL_FALLBACK_EV;
}

function slugFromCar(car) {
  return (
    car?.slug ||
    car?.catalogMeta?.slug ||
    ""
  ).toLowerCase();
}

function uniqueUrls(urls, options = {}) {
  const { role = "listing" } = options;
  const seen = new Set();
  return urls.filter((u) => {
    const clean = sanitizeImageUrl(u);
    if (!clean || seen.has(clean)) return false;
    if (isPlaceholderMediaUrl(clean)) return false;
    if (isManifestGuessCatalogUrl(clean)) return false;
    if (clean.includes("/catalog/families/")) {
      const familyMatch = clean.match(/\/catalog\/families\/([a-z0-9-]+)\//i);
      const family = familyMatch?.[1]?.toLowerCase();
      if (family && !isProductionFamilySlug(family)) return false;
    }
    if (
      role === "compare" &&
      clean.includes("/catalog/variants/")
    ) {
      return false;
    }
    seen.add(clean);
    return true;
  });
}

export { isValidImageUrl, sanitizeImageUrl };

/**
 * Resolve the best compare/listing/hero image from catalog fields (API first, then tier-1 manifest).
 * @param {object|null|undefined} car
 * @param {"compare"|"listing"|"hero"|"og"|"gallery"|"interior"} [role]
 * @returns {string|null}
 */
export function resolveCatalogImageUrl(car, role = "compare") {
  if (!car || typeof car !== "object") return null;

  const meta = car.catalogMeta?.media || {};

  const fieldLists = {
    compare: [
      car.compareThumbnail,
      meta.compareThumbnail,
      car.image,
      car.listingThumbnail,
      meta.listingThumbnail,
    ],
    listing: [
      car.listingThumbnail,
      meta.listingThumbnail,
      car.image,
      car.heroImage,
      meta.heroImage,
    ],
    hero: [
      car.heroImage,
      meta.heroImage,
      car.image,
      car.listingThumbnail,
      meta.listingThumbnail,
    ],
    og: [car.ogImage, meta.ogImage, car.heroImage, meta.heroImage],
  };

  const fields = fieldLists[role] || fieldLists.listing;

  const sanitizeOpts = { role };

  for (const raw of fields) {
    const url = sanitizeImageUrl(raw, sanitizeOpts);
    if (url) return url;
  }

  const familySlug = resolveFamilySlugFromCar(car);
  if (!familySlug || !isProductionFamilySlug(familySlug)) {
    return null;
  }

  const block = getProductionFamilyMedia(familySlug);
  if (!block) return null;

  const manifestOrder =
    role === "compare"
      ? [block.compareThumbnail, block.listingThumbnail]
      : role === "hero"
        ? [block.heroImage, block.listingThumbnail]
        : role === "og"
          ? [block.ogImage, block.heroImage]
          : [block.listingThumbnail, block.heroImage];

  for (const raw of manifestOrder) {
    const url = sanitizeImageUrl(raw, sanitizeOpts);
    if (url) return url;
  }

  return null;
}

function familyMediaForRole(familySlug, role) {
  const block = getProductionFamilyMedia(familySlug);
  if (!block) return [];

  if (role === "compare") {
    return [block.compareThumbnail, block.listingThumbnail];
  }
  if (role === "og") {
    return [block.ogImage, block.heroImage];
  }
  if (role === "hero") {
    return [block.heroImage, block.listingThumbnail];
  }
  if (role === "gallery") {
    return [...(block.gallery || []), ...(block.interior || [])];
  }
  if (role === "interior") {
    return block.interior || [];
  }

  return [
    block.listingThumbnail,
    block.heroImage,
    block.compareThumbnail,
  ];
}

function variantCdnFallbacks() {
  return [];
}

function finalizeFallbackChain(urls, options = {}) {
  const { role = "listing", allowLocalFallback = true } = options;
  const resolved = uniqueUrls(urls, { role });
  if (resolved.length > 0) {
    return allowLocalFallback
      ? uniqueUrls([...resolved, LOCAL_FALLBACK_EV], { role })
      : resolved;
  }
  return allowLocalFallback ? [LOCAL_FALLBACK_EV] : [];
}

export function buildImageFallbackChain(car, role = "listing") {
  const slug = slugFromCar(car);
  const familySlug =
    resolveFamilySlugFromCar(car) ||
    resolveFamilySlugFromVariantSlug(slug);
  const meta = car?.catalogMeta?.media || {};
  const fieldValues = pickMediaFields(car, role);

  const familyUrls =
    familySlug && isProductionFamilySlug(familySlug)
      ? familyMediaForRole(familySlug, role)
      : [];

  const variantUrls = variantCdnFallbacks();

  if (role === "compare") {
    const resolved = resolveCatalogImageUrl(car, "compare");
    return resolved ? [resolved] : [];
  }

  if (role === "og") {
    return finalizeFallbackChain([
      car?.ogImage,
      meta.ogImage,
      ...fieldValues,
      ...familyUrls,
      car?.heroImage,
      meta.heroImage,
      familySlug ? familyCatalogUrl(familySlug, "og.jpg") : null,
      ...variantUrls,
      LOCAL_FALLBACK_EV,
    ]);
  }

  if (role === "hero") {
    return finalizeFallbackChain([
      car?.heroImage,
      meta.heroImage,
      ...fieldValues,
      ...familyUrls,
      car?.image,
      car?.listingThumbnail,
      meta.listingThumbnail,
      ...variantUrls,
      LOCAL_FALLBACK_EV,
    ]);
  }

  if (role === "gallery") {
    return finalizeFallbackChain([
      ...(car?.galleryImages || []),
      ...(meta.gallery || []),
      ...fieldValues,
      ...familyUrls,
      ...variantUrls,
      LOCAL_FALLBACK_EV,
    ]);
  }

  if (role === "interior") {
    return finalizeFallbackChain([
      ...(meta.interior || []),
      ...fieldValues,
      ...(getProductionFamilyMedia(familySlug)?.interior || []),
      LOCAL_FALLBACK_EV,
    ]);
  }

  return finalizeFallbackChain([
    car?.listingThumbnail,
    meta.listingThumbnail,
    ...fieldValues,
    ...familyUrls,
    car?.heroImage,
    meta.heroImage,
    car?.image,
    ...variantUrls,
    LOCAL_FALLBACK_EV,
  ]);
}

export function getListingImage(car) {
  return buildImageFallbackChain(car, "listing")[0] || LOCAL_FALLBACK_EV;
}

export function getCompareThumbnail(car) {
  return buildImageFallbackChain(car, "compare")[0] || LOCAL_FALLBACK_EV;
}

export function getHeroImage(car) {
  return buildImageFallbackChain(car, "hero")[0] || LOCAL_FALLBACK_EV;
}

export function getOgImage(car) {
  return buildImageFallbackChain(car, "og")[0] || LOCAL_FALLBACK_EV;
}

export function resolveVehicleImage(car, role = "listing") {
  return buildImageFallbackChain(car, role)[0] || LOCAL_FALLBACK_EV;
}
