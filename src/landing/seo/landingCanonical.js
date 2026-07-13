/**
 * Canonical resolution for landing pages — delegates to Sprint 2.1 canonical engine.
 */

import {
  absoluteUrl,
  canonicalBestEvsUrl,
  canonicalBrandUrl,
  CANONICAL_BUILDERS,
} from "../../seo/canonical.js";
import { SITE_ORIGIN } from "../../config.js";

/**
 * @param {import('../types.js').LandingPageConfig} config
 * @param {string} [siteOrigin]
 */
export function resolveLandingCanonical(config, siteOrigin = SITE_ORIGIN) {
  if (config?.path) {
    return absoluteUrl(config.path, siteOrigin);
  }

  const slug = config?.slug;
  const type = config?.type;

  if (type === "brand" && slug) {
    return canonicalBrandUrl(slug, siteOrigin);
  }

  if (type === "use_case" && slug) {
    return canonicalBestEvsUrl(slug, siteOrigin);
  }

  if (config?.routeFamily === "brands" && slug) {
    return canonicalBrandUrl(slug, siteOrigin);
  }

  if (config?.routeFamily === "best-evs" && slug) {
    return canonicalBestEvsUrl(slug, siteOrigin);
  }

  return absoluteUrl(config?.path || "/", siteOrigin);
}

export { CANONICAL_BUILDERS };
