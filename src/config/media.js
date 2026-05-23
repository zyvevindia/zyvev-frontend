/**
 * EVSavari media delivery configuration (Cloudinary).
 */

/** Production Cloudinary account (override via VITE_CLOUDINARY_CLOUD_NAME). */
export const DEFAULT_CLOUDINARY_CLOUD_NAME = "dznvmumze";

/**
 * Folder prefix inside Cloudinary — NOT the cloud name.
 * @see CATALOG_FOLDER
 */
export const CATALOG_MEDIA_PREFIX = "evsavari/catalog";

/** Values that must never be used as res.cloudinary.com cloud segment. */
const INVALID_CLOUDINARY_CLOUD_NAMES = new Set([
  "evsavari",
  "catalog",
  "evsavari-catalog",
]);

/**
 * Resolve Cloudinary cloud name from env, ignoring mistaken folder-prefix values.
 */
function readEnv(key) {
  if (typeof import.meta !== "undefined" && import.meta.env?.[key] != null) {
    return String(import.meta.env[key]);
  }
  if (typeof process !== "undefined" && process.env?.[key] != null) {
    return String(process.env[key]);
  }
  return "";
}

export function resolveCloudinaryCloudName() {
  const fromEnv = readEnv("VITE_CLOUDINARY_CLOUD_NAME").trim();
  if (
    fromEnv &&
    !INVALID_CLOUDINARY_CLOUD_NAMES.has(fromEnv.toLowerCase())
  ) {
    return fromEnv;
  }
  return DEFAULT_CLOUDINARY_CLOUD_NAME;
}

export const CLOUDINARY_CLOUD_NAME = resolveCloudinaryCloudName();

export const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;

/**
 * Legacy custom CDN host (offline) — rewritten to res.cloudinary.com at runtime.
 * Do not use for new URLs.
 */
export const LEGACY_CATALOG_CDN_HOST = "cdn.evsavari.com";

export const LOCAL_FALLBACK_EV = "/fallback-ev.svg";

/** Default transform profile for catalog imagery */
export const DEFAULT_IMAGE_QUALITY = "auto";

export const DEFAULT_IMAGE_FORMAT = "auto";

/** Responsive width breakpoints (px) */
export const RESPONSIVE_WIDTHS = [320, 480, 640, 800, 1024, 1200, 1600];

export const ROLE_ASPECT = {
  listing: "16 / 10",
  compare: "16 / 10",
  hero: "16 / 10",
  gallery: "16 / 10",
  interior: "16 / 10",
  og: "1.91 / 1",
};

/** Cloudinary folder prefix for catalog uploads */
export const CATALOG_FOLDER = "evsavari/catalog";

export const FAMILY_MEDIA_FOLDER = `${CATALOG_FOLDER}/families`;
