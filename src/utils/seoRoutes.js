/**
 * SEO decision page routing — /cars/:slug when slug is reserved.
 */

import { SITE_ORIGIN } from "../config.js";
import { SEO_SLUG_SET } from "../data/seoPageSlugs.js";

export const SEO_PAGE_PREFIX = "/cars";

export function normalizeSeoSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase();
}

export function isSeoPageSlug(slug) {
  return SEO_SLUG_SET.has(normalizeSeoSlug(slug));
}

export function seoPagePath(slug) {
  const normalized = normalizeSeoSlug(slug);
  if (!normalized) return SEO_PAGE_PREFIX;
  return `${SEO_PAGE_PREFIX}/${normalized}`;
}

export function canonicalSeoPageUrl(slug, siteOrigin = SITE_ORIGIN) {
  return `${siteOrigin}${seoPagePath(slug)}`;
}
