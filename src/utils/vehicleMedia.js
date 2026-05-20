/**
 * Vehicle image resolution with Cloudinary-first delivery and fallbacks.
 */

import { LOCAL_FALLBACK_EV, ROLE_ASPECT } from "../config/media.js";
import {
  familyCatalogUrl,
  isPlaceholderMediaUrl,
  variantCatalogUrl,
} from "../media/cloudinary.js";
import { isValidImageUrl, sanitizeImageUrl } from "./imageUrl.js";
import {
  getProductionFamilyMedia,
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

function uniqueUrls(urls) {
  const seen = new Set();
  return urls.filter((u) => {
    const clean = sanitizeImageUrl(u);
    if (!clean || seen.has(clean)) return false;
    if (isPlaceholderMediaUrl(clean)) return false;
    seen.add(clean);
    return true;
  });
}

export { isValidImageUrl, sanitizeImageUrl };

function familyMediaForRole(familySlug, role) {
  const block = getProductionFamilyMedia(familySlug);
  if (!block) return [];

  if (role === "compare") {
    return [
      block.compareThumbnail,
      block.listingThumbnail,
      block.heroImage,
    ];
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

function variantCdnFallbacks(slug, role) {
  if (!slug) return [];
  const files =
    role === "compare"
      ? ["compare-thumb.jpg", "listing-thumb.jpg", "hero.jpg"]
      : role === "hero"
        ? ["hero.jpg", "listing-thumb.jpg"]
        : role === "og"
          ? ["og.jpg", "hero.jpg"]
          : ["listing-thumb.jpg", "hero.jpg"];

  return files.map((f) => variantCatalogUrl(slug, f));
}

function finalizeFallbackChain(urls) {
  const resolved = uniqueUrls(urls);
  if (resolved.length > 0) {
    return uniqueUrls([...resolved, LOCAL_FALLBACK_EV]);
  }
  return [LOCAL_FALLBACK_EV];
}

export function buildImageFallbackChain(car, role = "listing") {
  const slug = slugFromCar(car);
  const familySlug =
    resolveFamilySlugFromCar(car) ||
    resolveFamilySlugFromVariantSlug(slug);
  const meta = car?.catalogMeta?.media || {};
  const fieldValues = pickMediaFields(car, role);

  const familyUrls = familySlug
    ? familyMediaForRole(familySlug, role)
    : [];

  const variantUrls = variantCdnFallbacks(slug, role);

  if (role === "compare") {
    return finalizeFallbackChain([
      car?.compareThumbnail,
      meta.compareThumbnail,
      ...fieldValues,
      ...familyUrls,
      car?.listingThumbnail,
      meta.listingThumbnail,
      car?.heroImage,
      meta.heroImage,
      car?.image,
      ...variantUrls,
      LOCAL_FALLBACK_EV,
    ]);
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
