/**
 * Vehicle detail adapter — delegates to the Link Graph Engine.
 */

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import {
  buildComparePairSlug,
  compareGuidePath,
  normalizeVehicleSlug,
} from "./slugs.js";
import { getRelatedPages, buildVehiclePageContext } from "../linkGraph/index.js";
import { canonicalCompareGuideUrl } from "./canonical.js";

function slugToLabel(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Editorial compare guides that include this family slug.
 */
export function findEditorialCompareLinks(familySlug, limit = 4) {
  const family = normalizeVehicleSlug(familySlug);
  if (!family) return [];

  return GENERATED_COMPARE_SLUGS.filter((slug) => slug.includes(family))
    .slice(0, limit)
    .map((slug) => ({
      slug,
      label: slugToLabel(slug.replace(/-vs-/g, " vs ")),
      href: compareGuidePath(slug),
      canonical: canonicalCompareGuideUrl(slug),
    }));
}

/**
 * Resolve compare guide slug if both families have a generated guide.
 */
export function resolveCompareGuideSlugForPair(slugA, slugB) {
  const built = buildComparePairSlug(slugA, slugB);
  if (built && GENERATED_COMPARE_SLUGS.includes(built)) {
    return built;
  }
  return null;
}

/**
 * Build link sections for DetailSeoDiscovery.
 * @param {object} params
 */
export function buildVehicleDiscoveryLinkSections(params = {}) {
  return getRelatedPages(buildVehiclePageContext(params)).map((group) => ({
    id: group.id,
    title: group.title,
    links: group.links.map(({ label, href }) => ({ label, href })),
  }));
}
