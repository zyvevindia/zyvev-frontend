/**
 * Guards against symbolic media role labels being used as image src
 * (e.g. "compare-thumb" → /compare/slug/compare-thumb → 404).
 */

const SYMBOLIC_MEDIA_TOKENS = new Set([
  "hero",
  "listing",
  "compare",
  "gallery",
  "interior",
  "og",
  "compare-thumb",
  "listing-thumb",
  "hero-image",
  "hero.jpg",
  "listing-thumb.jpg",
  "compare-thumb.jpg",
]);

const SYMBOLIC_MEDIA_PATTERN =
  /^(compare-thumb|listing-thumb|hero)(\.(jpg|jpeg|png|webp))?$/i;

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (typeof url !== "string") return false;

  const trimmed = url.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (SYMBOLIC_MEDIA_TOKENS.has(lower)) return false;
  if (SYMBOLIC_MEDIA_PATTERN.test(trimmed)) return false;

  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.includes(".webp") ||
    trimmed.includes(".jpg") ||
    trimmed.includes(".jpeg") ||
    trimmed.includes(".png") ||
    trimmed.includes(".avif") ||
    trimmed.includes(".svg")
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
