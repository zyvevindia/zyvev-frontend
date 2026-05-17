/**
 * Cloudinary URL builders and detection.
 */

import {
  CLOUDINARY_BASE,
  CLOUDINARY_CLOUD_NAME,
  DEFAULT_IMAGE_FORMAT,
  DEFAULT_IMAGE_QUALITY,
  LEGACY_CATALOG_CDN_HOST,
} from "../config/media.js";

const UPLOAD_SEGMENT = "/image/upload/";

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
  return /unsplash\.com|picsum\.photos|via\.placeholder/i.test(url);
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

  const transform = buildTransformString(options);
  return `${CLOUDINARY_BASE}/image/upload/${transform}/${id}`;
}

/**
 * Canonical catalog asset public_id: evsavari/catalog/families/{family}/{file}
 */
export function familyCatalogPublicId(familySlug, filename) {
  const family = String(familySlug || "").trim().toLowerCase();
  const file = String(filename || "hero.jpg");
  return `evsavari/catalog/families/${family}/${file}`;
}

export function familyCatalogUrl(familySlug, filename, options = {}) {
  return cloudinaryDeliveryUrl(
    familyCatalogPublicId(familySlug, filename),
    options
  );
}

export function variantCatalogPublicId(variantSlug, filename) {
  const slug = String(variantSlug || "").trim().toLowerCase();
  const file = String(filename || "hero.jpg");
  return `evsavari/catalog/variants/${slug}/${file}`;
}

export function variantCatalogUrl(variantSlug, filename, options = {}) {
  return cloudinaryDeliveryUrl(
    variantCatalogPublicId(variantSlug, filename),
    options
  );
}

export { CLOUDINARY_CLOUD_NAME, CLOUDINARY_BASE };
