/**
 * Image utilities — re-exports Cloudinary-aware helpers for backward compatibility.
 */

export {
  CLOUDINARY_BASE,
  CLOUDINARY_CLOUD_NAME,
  LEGACY_CATALOG_CDN_HOST as CATALOG_CDN_HOST,
  LOCAL_FALLBACK_EV,
  LOCAL_FALLBACK_EV as fallbackEVImage,
} from "../config/media.js";

export {
  isCloudinaryUrl as isCloudinaryImage,
  isLegacyCatalogCdnUrl as isCatalogCdnUrl,
  isPlaceholderMediaUrl,
  applyCloudinaryTransforms,
  cloudinaryDeliveryUrl,
  coerceCatalogMediaToUrl,
  isRejectedCatalogMediaRef,
  normalizeCloudinaryDeliveryUrl,
} from "../media/cloudinary.js";

export {
  buildSrcSet,
  buildResponsiveSources,
} from "../media/responsive.js";

import { applyCloudinaryTransforms } from "../media/cloudinary.js";
import { LOCAL_FALLBACK_EV } from "../config/media.js";

/** @deprecated use applyCloudinaryTransforms */
export function optimizeImage(url = "", { width = 800, quality = "auto", format = "auto" } = {}) {
  if (!url) return "";
  return applyCloudinaryTransforms(url, { width, quality, format });
}

/** @deprecated use buildResponsiveSources */
export function getResponsiveImage(url = "") {
  return {
    small: applyCloudinaryTransforms(url, { width: 480 }),
    medium: applyCloudinaryTransforms(url, { width: 800 }),
    large: applyCloudinaryTransforms(url, { width: 1200 }),
  };
}

export function getSafeImage(image) {
  if (!image || typeof image !== "string") {
    return LOCAL_FALLBACK_EV;
  }
  return image;
}
