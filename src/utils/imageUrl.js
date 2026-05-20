/**
 * Guards against symbolic media role labels used as image src
 * (e.g. "compare-thumb" → /compare/slug/compare-thumb → 404).
 */

const INVALID_PLACEHOLDER_TOKENS = [
  "compare-thumb",
  "listing-thumb",
  "hero",
];

/**
 * Bare role token (not a delivery URL).
 * @param {unknown} value
 */
export function isSymbolicMediaToken(value) {
  if (typeof value !== "string") return false;
  return INVALID_PLACEHOLDER_TOKENS.includes(value.trim().toLowerCase());
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

  if (INVALID_PLACEHOLDER_TOKENS.includes(trimmed.toLowerCase())) {
    return false;
  }

  return (
    trimmed.startsWith("http") ||
    trimmed.startsWith("/") ||
    trimmed.includes(".jpg") ||
    trimmed.includes(".jpeg") ||
    trimmed.includes(".png") ||
    trimmed.includes(".webp") ||
    trimmed.includes(".avif") ||
    trimmed.includes(".svg") ||
    trimmed.includes("cloudinary")
  );
}

/**
 * @param {unknown} url
 * @returns {string|null}
 */
export function sanitizeImageUrl(url) {
  return isValidImageUrl(url) ? url.trim() : null;
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
