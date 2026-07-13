/**
 * Landing metadata — reuses Sprint 2.1 pageMetadata/meta pipeline only.
 */

import { buildPageMeta } from "../../seo/meta.js";
import { buildBrandPageMeta } from "../../seo/pageMetadata.js";
import { resolveLandingCanonical } from "./landingCanonical.js";

/**
 * @param {import('../types.js').LandingPageConfig} config
 */
export function buildLandingPageMeta(config) {
  const canonical = resolveLandingCanonical(config);
  const seo = config.seo || {};

  if (config.type === "brand" && seo.title) {
    return buildPageMeta({
      title: seo.title,
      description: seo.description || config.description,
      canonical,
      keywords: seo.keywords,
      robots: seo.robots || "index, follow",
      ogType: seo.ogType || "website",
      image: seo.image,
    });
  }

  if (config.type === "brand") {
    return buildBrandPageMeta({
      brandName: seo.title || config.title,
      description: seo.description || config.description,
      brandSlug: config.slug,
    });
  }

  return buildPageMeta({
    title: seo.title || config.title,
    description: seo.description || config.description,
    canonical,
    keywords: seo.keywords,
    robots: seo.robots || "index, follow",
    ogType: seo.ogType || "website",
    image: seo.image,
  });
}
