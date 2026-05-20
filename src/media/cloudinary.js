/**
 * Cloudinary URL builders and detection.
 */

import {
  CLOUDINARY_BASE,
  CLOUDINARY_CLOUD_NAME,
  CATALOG_MEDIA_PREFIX,
  DEFAULT_CLOUDINARY_CLOUD_NAME,
  DEFAULT_IMAGE_FORMAT,
  DEFAULT_IMAGE_QUALITY,
  LEGACY_CATALOG_CDN_HOST,
} from "../config/media.js";
import { isValidCatalogAssetFilename } from "../utils/imageUrl.js";
import { isProductionFamilySlug } from "./productionFamilies.js";

const UPLOAD_SEGMENT = "/image/upload/";

const WRONG_CLOUD_SEGMENT = new RegExp(
  `^https://res\\.cloudinary\\.com/(?:evsavari|catalog)/`,
  "i"
);

/**
 * Fix delivery URLs where catalog folder prefix was used as cloud name.
 * @param {unknown} url
 * @returns {string|null}
 */
export function normalizeCloudinaryDeliveryUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("res.cloudinary.com")) return trimmed;
  if (WRONG_CLOUD_SEGMENT.test(trimmed)) {
    return trimmed.replace(
      WRONG_CLOUD_SEGMENT,
      `https://res.cloudinary.com/${DEFAULT_CLOUDINARY_CLOUD_NAME}/`
    );
  }
  return trimmed;
}

export function isCloudinaryUrl(url = "") {
  return (
    typeof url === "string" &&
    url.includes("res.cloudinary.com")
  );
}

export function isLegacyCatalogCdnUrl(url = "") {
  return (
    typeof url === "string" &&
    url.includes(LEGACY_CATALOG_CDN_HOST)
  );
}

export function isPlaceholderMediaUrl(url = "") {
  if (!url || typeof url !== "string") return true;
  if (isLegacyCatalogCdnUrl(url)) return true;
  if (/unsplash\.com|picsum\.photos|via\.placeholder/i.test(url)) {
    return true;
  }
  const lower = url.trim().toLowerCase();
  return (
    lower === "hero" ||
    lower === "compare-thumb" ||
    lower === "listing-thumb"
  );
}

/**
 * Build transform segment (no leading/trailing slashes).
 */
export function buildTransformString({
  width,
  height,
  quality = DEFAULT_IMAGE_QUALITY,
  format = DEFAULT_IMAGE_FORMAT,
  crop = "limit",
  /** Omit dpr on base catalog URLs — dpr_auto can 404 on some renamed assets. */
  dpr = null,
} = {}) {
  const parts = [
    `f_${format}`,
    `q_${quality}`,
    crop ? `c_${crop}` : null,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    dpr ? `dpr_${dpr}` : null,
  ].filter(Boolean);
  return parts.join(",");
}

/**
 * Insert transforms after /upload/ without duplicating existing transforms.
 */
export function applyCloudinaryTransforms(
  url = "",
  options = {}
) {
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  const transform = buildTransformString(options);
  if (!transform) return url;

  const marker = UPLOAD_SEGMENT;
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const afterUpload = url.slice(idx + marker.length);
  if (/^f_|^q_|^w_|^c_/.test(afterUpload)) {
    return url;
  }

  return `${url.slice(0, idx + marker.length)}${transform}/${afterUpload}`;
}

/**
 * Delivery URL from public_id (no version — Cloudinary resolves latest).
 */
export function cloudinaryDeliveryUrl(
  publicId,
  options = {}
) {
  const id = String(publicId || "")
    .replace(/^\/+/, "")
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");

  if (!id || id.length <= 6) return null;
  if (/^(compare-thumb|listing-thumb|hero)$/i.test(id)) return null;

  const transform = buildTransformString(options);
  return normalizeCloudinaryDeliveryUrl(
    `${CLOUDINARY_BASE}/image/upload/${transform}/${id}`
  );
}

/**
 * Canonical catalog asset public_id: evsavari/catalog/families/{family}/{file}
 */
export function familyCatalogPublicId(familySlug, filename) {
  const family = String(familySlug || "").trim().toLowerCase();
  const file = String(filename || "").trim();
  if (!family || !isValidCatalogAssetFilename(file)) return null;
  return `${CATALOG_MEDIA_PREFIX}/families/${family}/${file}`;
}

export function familyCatalogUrl(familySlug, filename, options = {}) {
  if (!isProductionFamilySlug(familySlug)) return null;
  const publicId = familyCatalogPublicId(familySlug, filename);
  if (!publicId) return null;
  return cloudinaryDeliveryUrl(publicId, options);
}

export function variantCatalogPublicId(variantSlug, filename) {
  const slug = String(variantSlug || "").trim().toLowerCase();
  const file = String(filename || "").trim();
  if (!slug || !isValidCatalogAssetFilename(file)) return null;
  return `${CATALOG_MEDIA_PREFIX}/variants/${slug}/${file}`;
}

/** Speculative variant paths are not requested at runtime (avoid CDN 404s). */
export function variantCatalogUrl() {
  return null;
}

/**
 * Resolve API/catalog media value to a delivery URL (never invent bare role tokens).
 * @param {unknown} value
 * @returns {string|null}
 */
export function coerceCatalogMediaToUrl(value) {
  if (value == null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return normalizeCloudinaryDeliveryUrl(trimmed);
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  const publicId = trimmed
    .replace(/^\/+/, "")
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");

  if (
    publicId.startsWith(`${CATALOG_MEDIA_PREFIX}/`) ||
    publicId.startsWith("evsavari/catalog/")
  ) {
    return cloudinaryDeliveryUrl(publicId);
  }

  if (/^(compare-thumb|listing-thumb|hero)(\.(jpg|jpeg|png|webp|avif))?$/i.test(publicId)) {
    return null;
  }

  return null;
}

export { CLOUDINARY_CLOUD_NAME, CLOUDINARY_BASE };
