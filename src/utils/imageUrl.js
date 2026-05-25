import {
  bypassLegacyCatalogCdn,
  coerceCatalogMediaToUrl,
  isBlockedCatalogDeliveryUrl,
  isLegacyCatalogCdnUrl,
  isRejectedCatalogMediaRef,
} from "../media/cloudinary.js";
import { isSpeculativeOptionalCatalogUrl } from "../media/catalogMediaAvailability.js";

/**
 * Guards against symbolic media role labels used as image src
 * (e.g. "compare-thumb" → /compare/slug/compare-thumb → 404).
 */

/** Bare strings that must never be used as image src or Cloudinary public IDs. */
export const BARE_INVALID_IMAGE_VALUES = new Set([
  "",
  "hero",
  "hero.jpg",
  "placeholder",
  "placeholder.jpg",
  "compare-thumb",
  "compare-thumb.jpg",
  "listing-thumb",
  "listing-thumb.jpg",
]);

/**
 * Strict equality check for fake fallback filenames (not URL/path substrings).
 * @param {unknown} value
 */
export function isBareInvalidImageValue(value) {
  if (value == null) return true;
  if (typeof value !== "string") return false;
  return BARE_INVALID_IMAGE_VALUES.has(value.trim().toLowerCase());
}

/**
 * Bare role token (not a delivery URL).
 * @param {unknown} value
 */
export function isSymbolicMediaToken(value) {
  return typeof value === "string" && isBareInvalidImageValue(value);
}

/**
 * Catalog asset filename (not a bare role token).
 * @param {unknown} filename
 */
export function isValidCatalogAssetFilename(filename) {
  if (typeof filename !== "string") return false;
  const trimmed = filename.trim();
  if (trimmed.length <= 6 || isSymbolicMediaToken(trimmed)) return false;
  return (
    trimmed.includes("/") ||
    trimmed.includes(".jpg") ||
    trimmed.includes(".jpeg") ||
    trimmed.includes(".png") ||
    trimmed.includes(".webp") ||
    trimmed.includes(".avif")
  );
}

/**
 * Speculative catalog URL that should not be requested (variant guesses).
 * Full Cloudinary family delivery URLs are allowed.
 * @param {unknown} url
 */
export function isManifestGuessCatalogUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (isSymbolicMediaToken(trimmed)) return true;
  if (
    trimmed.includes("res.cloudinary.com") &&
    trimmed.includes("/catalog/variants/")
  ) {
    return true;
  }
  if (isSpeculativeOptionalCatalogUrl(trimmed)) return true;
  return false;
}

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();
  if (!trimmed) return false;

  if (isSymbolicMediaToken(trimmed)) return false;
  if (isLegacyCatalogCdnUrl(trimmed)) return false;

  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.includes("cloudinary")
  );
}

/**
 * @param {unknown} url
 * @param {{ role?: string }} [options]
 * @returns {string|null}
 */
export function sanitizeImageUrl(url, options = {}) {
  if (url == null) return null;
  if (isRejectedCatalogMediaRef(url)) return null;
  if (typeof url === "string" && isSymbolicMediaToken(url)) return null;

  if (typeof url === "string" && isLegacyCatalogCdnUrl(url)) {
    const migrated = bypassLegacyCatalogCdn(url);
    if (!migrated || isLegacyCatalogCdnUrl(migrated)) return null;
    url = migrated;
  }

  const resolved = coerceCatalogMediaToUrl(url);
  if (!resolved || isRejectedCatalogMediaRef(resolved)) return null;
  if (isBlockedCatalogDeliveryUrl(resolved)) return null;
  if (isLegacyCatalogCdnUrl(resolved)) return null;
  if (
    isSpeculativeOptionalCatalogUrl(resolved, {
      catalogMeta: options.catalogMeta,
      familySlug: options.familySlug,
    })
  ) {
    return null;
  }
  return isValidImageUrl(resolved) ? resolved : null;
}

/**
 * @param {object|null|undefined} car
 * @returns {object|null|undefined}
 */
export function sanitizeCarImageFields(car) {
  if (!car || typeof car !== "object") return car;

  const guard = {
    catalogMeta: car.catalogMeta,
    familySlug:
      car.familySlug ||
      car.catalogMeta?.familySlug ||
      car.catalogMeta?.slug,
  };

  const sanitizeOpts = guard;

  const meta = car.catalogMeta;
  const media =
    meta && typeof meta === "object" && meta.media
      ? meta.media
      : null;

  const cleanGallery = (items) =>
    Array.isArray(items)
      ? items
          .map((u) => sanitizeImageUrl(u, sanitizeOpts))
          .filter(Boolean)
      : items;

  const cleanMeta =
    media && typeof media === "object"
      ? {
          ...meta,
          media: {
            ...media,
            heroImage: sanitizeImageUrl(media.heroImage, sanitizeOpts),
            listingThumbnail: sanitizeImageUrl(
              media.listingThumbnail,
              sanitizeOpts
            ),
            compareThumbnail: sanitizeImageUrl(
              media.compareThumbnail,
              sanitizeOpts
            ),
            ogImage: sanitizeImageUrl(media.ogImage, sanitizeOpts),
            gallery: cleanGallery(media.gallery),
            interior: cleanGallery(media.interior),
          },
        }
      : meta;

  return {
    ...car,
    image: sanitizeImageUrl(car.image, sanitizeOpts),
    heroImage: sanitizeImageUrl(car.heroImage, sanitizeOpts),
    listingThumbnail: sanitizeImageUrl(car.listingThumbnail, sanitizeOpts),
    compareThumbnail: sanitizeImageUrl(car.compareThumbnail, sanitizeOpts),
    ogImage: sanitizeImageUrl(car.ogImage, sanitizeOpts),
    galleryImages: cleanGallery(car.galleryImages),
    ...(cleanMeta !== meta ? { catalogMeta: cleanMeta } : {}),
  };
}
