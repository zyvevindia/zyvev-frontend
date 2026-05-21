/**
 * Responsive srcset / picture helpers for Cloudinary delivery.
 */

import { RESPONSIVE_WIDTHS } from "../config/media.js";
import {
  applyCloudinaryTransforms,
  bypassLegacyCatalogCdn,
  isCloudinaryUrl,
  isLegacyCatalogCdnUrl,
} from "./cloudinary.js";

function responsiveDeliveryUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (isLegacyCatalogCdnUrl(url)) {
    return bypassLegacyCatalogCdn(url) || "";
  }
  return isCloudinaryUrl(url) ? url : bypassLegacyCatalogCdn(url) || "";
}

export function buildSrcSet(
  url,
  widths = RESPONSIVE_WIDTHS,
  format
) {
  const delivery = responsiveDeliveryUrl(url);
  if (!delivery || !isCloudinaryUrl(delivery)) return "";
  url = delivery;

  return widths
    .map((w) => {
      const optimized = applyCloudinaryTransforms(url, {
        width: w,
        ...(format ? { format } : {}),
      });
      return `${optimized} ${w}w`;
    })
    .join(", ");
}

export function buildResponsiveSources(url, widths = [480, 800, 1200]) {
  const delivery = responsiveDeliveryUrl(url);
  if (!delivery || !isCloudinaryUrl(delivery)) {
    return { avif: "", webp: "", default: "", srcSet: "" };
  }

  url = delivery;

  const srcSet = buildSrcSet(url, widths);
  const maxW = widths[widths.length - 1];
  const defaultUrl = applyCloudinaryTransforms(url, { width: maxW });

  if (!isCloudinaryUrl(url)) {
    return { avif: "", webp: "", default: "", srcSet: "" };
  }

  return {
    avif: applyCloudinaryTransforms(url, { width: maxW, format: "avif" }),
    webp: applyCloudinaryTransforms(url, { width: maxW, format: "webp" }),
    default: defaultUrl,
    srcSet,
    avifSrcSet: buildSrcSet(url, widths, "avif"),
    webpSrcSet: buildSrcSet(url, widths, "webp"),
  };
}

export const LISTING_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export const HERO_SIZES = "(max-width: 768px) 100vw,  min(1200px, 90vw)";

export const COMPARE_SIZES =
  "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px";
