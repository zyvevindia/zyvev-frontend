/**
 * Internal linking mesh for discovery pages — delegates to Link Graph Engine.
 */

import { getRelatedPages, buildGuidePageContext } from "../linkGraph/index.js";
import {
  getBuyingGuideTopics,
  getChargingGuideTopics,
  getCitySlugs,
  citySlugToLabel,
  getOwnershipGuideTopics,
  getRegisteredPriceLandings,
  getRegisteredUseCaseLandings,
} from "../linkGraph/registries.js";

export function getDiscoveryLinkSections(seoPage) {
  if (Array.isArray(seoPage?.relatedLinks) && seoPage.relatedLinks.length) {
    return seoPage.relatedLinks;
  }

  return getRelatedPages(buildGuidePageContext(seoPage)).map((group) => ({
    title: group.title,
    links: group.links.map(({ label, href, slug }) => ({
      label,
      href,
      slug: slug || href,
    })),
  }));
}

/** Hub helpers — read registry topics, no page-specific branching. */
export function getBestEvsGuideLinks({ limit = 6 } = {}) {
  return getRegisteredUseCaseLandings()
    .concat(getRegisteredPriceLandings())
    .slice(0, limit)
    .map((d) => ({
      slug: d.slug,
      label: d.linkLabel || d.h1,
      href: `/best-evs/${d.slug}`,
    }));
}

export function getChargingGuideLinks({ limit = 4 } = {}) {
  return getChargingGuideTopics().slice(0, limit).map((t) => ({
    slug: t.id,
    label: t.title,
    href: t.canonicalPath,
  }));
}

export function getOwnershipGuideLinks({ limit = 4 } = {}) {
  return getOwnershipGuideTopics().slice(0, limit).map((t) => ({
    slug: t.id,
    label: t.title,
    href: t.canonicalPath,
  }));
}

export function getCityGuideLinks({ limit = 8 } = {}) {
  return getCitySlugs().slice(0, limit).map((city) => ({
    slug: city,
    label: `EVs in ${citySlugToLabel(city)}`,
    href: `/cities/${city}/evs`,
  }));
}

export function getRelatedGuides(seoPage, { limit = 5 } = {}) {
  return getBuyingGuideTopics()
    .slice(0, limit)
    .map((t) => ({ slug: t.id, label: t.title, href: t.canonicalPath }));
}

export function getRelatedComparisons(_seoPage, { limit = 3 } = {}) {
  const groups = getRelatedPages(
    buildGuidePageContext({ category: "usage", slug: "hub" }),
    { maxGroups: 1, maxPerGroup: limit }
  );
  const compare = groups.find((g) => g.id === "compare");
  return (compare?.links || []).slice(0, limit).map((l) => ({
    slug: l.slug,
    label: l.label,
    href: l.href,
  }));
}
