/**
 * Responsive srcset / picture helpers for Cloudinary delivery.
 */

import { RESPONSIVE_WIDTHS } from "../config/media.js";
import { applyCloudinaryTransforms, isCloudinaryUrl } from "./cloudinary.js";

export function buildSrcSet(
  url,
  widths = RESPONSIVE_WIDTHS,
  format
) {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) {
    return `${url} ${widths[widths.length - 1] || 800}w`;
  }

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
  if (!url) {
    return { avif: "", webp: "", default: "", srcSet: "" };
  }

  const srcSet = buildSrcSet(url, widths);
  const maxW = widths[widths.length - 1];
  const defaultUrl = isCloudinaryUrl(url)
    ? applyCloudinaryTransforms(url, { width: maxW })
    : url;

  if (!isCloudinaryUrl(url)) {
    return {
      avif: defaultUrl,
      webp: defaultUrl,
      default: defaultUrl,
      srcSet,
      avifSrcSet: srcSet,
      webpSrcSet: srcSet,
    };
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
