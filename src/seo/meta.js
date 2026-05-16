/**
 * Dynamic meta tag generation — consistent title/description rules.
 */

import { SITE_ORIGIN } from "../config";

const BRAND_SUFFIX = " | EVSavari";
const DEFAULT_DESCRIPTION =
  "Compare electric cars, charging guides, and ownership insights on EVSavari — India's EV discovery platform.";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-banner.jpg`;

export function formatPageTitle(title, { withBrand = true } = {}) {
  const raw = String(title || "").trim();
  if (!raw) return withBrand ? `EVSavari${BRAND_SUFFIX.trim()}` : "EVSavari";
  if (!withBrand) return raw;
  if (raw.endsWith(BRAND_SUFFIX)) return raw;
  return `${raw}${BRAND_SUFFIX}`;
}

export function stripBrandSuffix(title) {
  return String(title || "").replace(/ \| EVSavari$/, "").trim();
}

/**
 * @returns {{ title, description, canonical, keywords, robots, ogType, image }}
 */
export function buildPageMeta({
  title,
  description,
  canonical,
  keywords,
  robots = "index, follow",
  ogType = "website",
  image = DEFAULT_OG_IMAGE,
  h1,
}) {
  const metaTitle = formatPageTitle(title);
  const metaDescription =
    String(description || "").trim() || DEFAULT_DESCRIPTION;

  return {
    title: metaTitle,
    description: metaDescription.slice(0, 160),
    canonical: canonical || SITE_ORIGIN,
    keywords:
      keywords ||
      "electric vehicles India, EV comparison, EV guides, EVSavari",
    robots,
    ogType,
    image,
    h1: h1 || stripBrandSuffix(metaTitle),
  };
}

export function buildGuidePageMeta(seoPage, canonicalUrl) {
  return buildPageMeta({
    title: seoPage.title,
    description: seoPage.metaDescription,
    canonical: canonicalUrl,
    ogType: "article",
    h1: stripBrandSuffix(seoPage.title),
  });
}
