/**
 * EVSavari media delivery configuration (Cloudinary).
 */

/** Production Cloudinary account (override via VITE_CLOUDINARY_CLOUD_NAME). */
export const DEFAULT_CLOUDINARY_CLOUD_NAME = "dznvmumze";

export const CLOUDINARY_CLOUD_NAME =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) ||
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  DEFAULT_CLOUDINARY_CLOUD_NAME;

export const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;

/** Legacy placeholder host — deprioritized in fallback chains */
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
