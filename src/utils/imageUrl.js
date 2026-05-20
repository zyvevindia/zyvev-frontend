import {
  coerceCatalogMediaToUrl,
  isRejectedCatalogMediaRef,
} from "../media/cloudinary.js";

/**
 * Guards against symbolic media role labels used as image src
 * (e.g. "compare-thumb" → /compare/slug/compare-thumb → 404).
 */

const INVALID_PLACEHOLDER_TOKENS = [
  "compare-thumb",
  "listing-thumb",
  "hero",
];

/** Bare asset filenames — never valid as browser src (resolve via Cloudinary helper). */
const BARE_ASSET_FILENAME =
  /^(compare-thumb|listing-thumb|hero)(\.(jpg|jpeg|png|webp|avif))?$/i;

/**
 * Bare role token (not a delivery URL).
 * @param {unknown} value
 */
export function isSymbolicMediaToken(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    INVALID_PLACEHOLDER_TOKENS.includes(trimmed.toLowerCase()) ||
    BARE_ASSET_FILENAME.test(trimmed)
  );
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
 * @returns {string|null}
 */
export function sanitizeImageUrl(url) {
  if (url == null) return null;
  if (isRejectedCatalogMediaRef(url)) return null;
  if (typeof url === "string" && isSymbolicMediaToken(url)) return null;
  const resolved = coerceCatalogMediaToUrl(url);
  if (!resolved || isRejectedCatalogMediaRef(resolved)) return null;
  return isValidImageUrl(resolved) ? resolved : null;
}

/**
 * @param {object|null|undefined} car
 * @returns {object|null|undefined}
 */
export function sanitizeCarImageFields(car) {
  if (!car || typeof car !== "object") return car;

  const meta = car.catalogMeta;
  const media =
    meta && typeof meta === "object" && meta.media
      ? meta.media
      : null;

  const cleanMeta =
    media && typeof media === "object"
      ? {
          ...meta,
          media: {
            ...media,
            heroImage: sanitizeImageUrl(media.heroImage),
            listingThumbnail: sanitizeImageUrl(media.listingThumbnail),
            compareThumbnail: sanitizeImageUrl(media.compareThumbnail),
            ogImage: sanitizeImageUrl(media.ogImage),
          },
        }
      : meta;

  return {
    ...car,
    image: sanitizeImageUrl(car.image),
    heroImage: sanitizeImageUrl(car.heroImage),
    listingThumbnail: sanitizeImageUrl(car.listingThumbnail),
    compareThumbnail: sanitizeImageUrl(car.compareThumbnail),
    ogImage: sanitizeImageUrl(car.ogImage),
    ...(cleanMeta !== meta ? { catalogMeta: cleanMeta } : {}),
  };
}
