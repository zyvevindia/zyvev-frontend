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
import {
  isBareInvalidImageValue,
  isValidCatalogAssetFilename,
} from "../utils/imageUrl.js";
import { isProductionFamilySlug } from "./productionFamilies.js";

const UPLOAD_SEGMENT = "/image/upload/";

const WRONG_CLOUD_SEGMENT = new RegExp(
  `^https://res\\.cloudinary\\.com/(?:evsavari|catalog)/`,
  "i"
);

/** Extensionless tier-1 asset tails (never pass *.jpg into delivery URLs). */
const FAMILY_ASSET_BASENAMES = new Set([
  "hero",
  "listing-thumb",
  "compare-thumb",
  "og",
]);

const CATALOG_ASSET_JPG_SUFFIX =
  /\/(compare-thumb|listing-thumb|hero)\.jpg(?=\/|\?|$)/gi;

/**
 * Reject empty values and bare fake filenames (never substring-match URLs).
 * @param {unknown} value
 */
export function isRejectedCatalogMediaRef(value) {
  if (value == null || typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return isBareInvalidImageValue(trimmed);
}

/** Cloudinary catalog path ending in /hero (extensionless public_id). */
const CATALOG_HERO_ASSET_PATH =
  /\/catalog\/families\/[a-z0-9-]+\/hero(\.jpg)?(\?|$)/i;

/**
 * Block delivery URLs for non–tier-1 families using catalog /hero (common 404).
 * Production family paths (compare-thumb, listing-thumb, hero) are allowed.
 * @param {unknown} url
 */
export function isBlockedCatalogDeliveryUrl(url) {
  if (!url || typeof url !== "string") return true;
  if (isRejectedCatalogMediaRef(url)) return true;

  const path = url.split("?")[0];
  if (!CATALOG_HERO_ASSET_PATH.test(path)) return false;

  const familyMatch = path.match(/\/catalog\/families\/([a-z0-9-]+)\//i);
  const family = familyMatch?.[1]?.toLowerCase();
  return Boolean(family && !isProductionFamilySlug(family));
}

/**
 * Derive Cloudinary public_id from a legacy CDN pathname.
 * @param {string} pathname
 * @returns {string|null}
 */
function publicIdFromLegacyCdnPathname(pathname = "") {
  const path = String(pathname).replace(/^\/+/, "");
  if (!path || path.includes("/_fallbacks/")) return null;

  const stripExt = (id) =>
    id.replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");

  if (path.startsWith(`${CATALOG_MEDIA_PREFIX}/`)) {
    return stripExt(path);
  }

  if (path.startsWith("catalog/")) {
    return stripExt(
      path.replace(/^catalog\//, `${CATALOG_MEDIA_PREFIX}/`)
    );
  }

  const catalogIdx = path.indexOf("catalog/");
  if (catalogIdx >= 0) {
    return stripExt(
      path
        .slice(catalogIdx)
        .replace(/^catalog\//, `${CATALOG_MEDIA_PREFIX}/`)
    );
  }

  return null;
}

/**
 * Map dead cdn.evsavari.com URLs to res.cloudinary.com delivery (CDN bypass).
 * @param {string} url
 * @returns {string|null}
 */
function rewriteLegacyCatalogCdnUrl(url) {
  if (!url?.includes?.(LEGACY_CATALOG_CDN_HOST)) return null;

  try {
    let absolute = String(url).trim();
    if (absolute.startsWith("//")) {
      absolute = `https:${absolute}`;
    }
    if (!/^https?:\/\//i.test(absolute)) return null;

    const publicId = publicIdFromLegacyCdnPathname(
      new URL(absolute).pathname
    );
    if (!publicId) return null;

    return cloudinaryDeliveryUrl(publicId);
  } catch {
    return null;
  }
}

/**
 * Never emit legacy CDN hosts — rewrite to Cloudinary or drop.
 * @param {unknown} url
 * @returns {string|null}
 */
export function bypassLegacyCatalogCdn(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!isLegacyCatalogCdnUrl(trimmed)) {
    return trimmed.includes("res.cloudinary.com")
      ? normalizeCloudinaryDeliveryUrl(trimmed)
      : trimmed;
  }
  return rewriteLegacyCatalogCdnUrl(trimmed);
}

/**
 * Fix delivery URLs where catalog folder prefix was used as cloud name.
 * Rewrites legacy cdn.evsavari.com hosts to res.cloudinary.com (CDN is offline).
 * @param {unknown} url
 * @returns {string|null}
 */
export function normalizeCloudinaryDeliveryUrl(url) {
  if (!url || typeof url !== "string") return null;
  let trimmed = url.trim();
  if (!trimmed) return null;
  if (isRejectedCatalogMediaRef(trimmed)) return null;

  if (trimmed.includes(LEGACY_CATALOG_CDN_HOST)) {
    const rewritten = rewriteLegacyCatalogCdnUrl(trimmed);
    if (!rewritten) return null;
    trimmed = rewritten;
  }

  if (trimmed.includes("res.cloudinary.com")) {
    if (WRONG_CLOUD_SEGMENT.test(trimmed)) {
      trimmed = trimmed.replace(
        WRONG_CLOUD_SEGMENT,
        `https://res.cloudinary.com/${DEFAULT_CLOUDINARY_CLOUD_NAME}/`
      );
    }
    trimmed = trimmed.replace(CATALOG_ASSET_JPG_SUFFIX, "/$1");
    if (isRejectedCatalogMediaRef(trimmed)) return null;
  }

  if (isLegacyCatalogCdnUrl(trimmed)) return null;

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
  if (!url) return "";

  if (isLegacyCatalogCdnUrl(url)) {
    url = bypassLegacyCatalogCdn(url) || "";
  }

  if (!url || !isCloudinaryUrl(url)) {
    return "";
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
  if (isRejectedCatalogMediaRef(publicId)) return null;

  const id = String(publicId || "")
    .replace(/^\/+/, "")
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");

  if (!id || id.length <= 6) return null;
  if (/^(compare-thumb|listing-thumb|hero)$/i.test(id)) return null;
  if (!id.includes("/") && !FAMILY_ASSET_BASENAMES.has(id)) return null;

  const transform = buildTransformString(options);
  const url = normalizeCloudinaryDeliveryUrl(
    `${CLOUDINARY_BASE}/image/upload/${transform}/${id}`
  );
  return url &&
    !isRejectedCatalogMediaRef(url) &&
    !isBlockedCatalogDeliveryUrl(url)
    ? url
    : null;
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

/**
 * Tier-1 family asset by extensionless basename (preferred over *.jpg filenames).
 * @param {string} familySlug
 * @param {"hero"|"listing-thumb"|"compare-thumb"|"og"} assetBasename
 */
export function familyCatalogAssetUrl(familySlug, assetBasename, options = {}) {
  if (!isProductionFamilySlug(familySlug)) return null;
  const family = String(familySlug || "").trim().toLowerCase();
  const asset = String(assetBasename || "").trim().toLowerCase();
  if (!family || !FAMILY_ASSET_BASENAMES.has(asset)) return null;
  const publicId = `${CATALOG_MEDIA_PREFIX}/families/${family}/${asset}`;
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

  let trimmed = value.trim();
  if (!trimmed || isRejectedCatalogMediaRef(trimmed)) return null;

  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    const url = normalizeCloudinaryDeliveryUrl(trimmed);
    return url &&
      !isRejectedCatalogMediaRef(url) &&
      !isBlockedCatalogDeliveryUrl(url) &&
      !isLegacyCatalogCdnUrl(url)
      ? url
      : null;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return isRejectedCatalogMediaRef(trimmed) ? null : trimmed;
  }

  const publicId = trimmed
    .replace(/^\/+/, "")
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");

  if (isRejectedCatalogMediaRef(publicId)) return null;

  if (
    publicId.startsWith(`${CATALOG_MEDIA_PREFIX}/`) ||
    publicId.startsWith("evsavari/catalog/")
  ) {
    return cloudinaryDeliveryUrl(publicId);
  }

  return null;
}

export { CLOUDINARY_CLOUD_NAME, CLOUDINARY_BASE };
