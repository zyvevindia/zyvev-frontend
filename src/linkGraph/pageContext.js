/**
 * Normalize page contexts for the Link Graph Engine.
 */

import { LINK_PAGE_FAMILIES } from "./types.js";
import { normalizeVehicleSlug } from "./slugUtils.js";

/**
 * @param {import('./types.js').LinkGraphPageContext} context
 */
export function normalizePageContext(context = {}) {
  const pageFamily = context.pageFamily || LINK_PAGE_FAMILIES.GUIDE;
  return {
    ...context,
    pageFamily,
    slug: context.slug ? String(context.slug).trim().toLowerCase() : "",
    path: context.path || "",
    brand: context.brand || "",
    familySlug: context.familySlug
      ? normalizeVehicleSlug(context.familySlug)
      : "",
    priceInr: Number(context.priceInr) || 0,
    compareSlugs: (context.compareSlugs || []).map(normalizeVehicleSlug).filter(Boolean),
    compareRivals: (context.compareRivals || []).map(normalizeVehicleSlug).filter(Boolean),
  };
}

/**
 * @param {import('../landing/types.js').LandingPageConfig} config
 */
export function buildLandingPageContext(config) {
  const type = config?.type;
  let pageFamily = LINK_PAGE_FAMILIES.GUIDE;

  if (type === "brand") pageFamily = LINK_PAGE_FAMILIES.BRAND;
  else if (type === "price") pageFamily = LINK_PAGE_FAMILIES.PRICE;
  else if (type === "use_case") pageFamily = LINK_PAGE_FAMILIES.USE_CASE;

  return normalizePageContext({
    pageFamily,
    slug: config?.slug,
    path: config?.path,
    brand: config?.filters?.brand,
    landingConfig: config,
  });
}

/**
 * @param {object} params
 */
export function buildVehiclePageContext(params = {}) {
  return normalizePageContext({
    pageFamily: LINK_PAGE_FAMILIES.VEHICLE,
    familySlug: params.familySlug,
    slug: params.familySlug,
    brand: params.brand,
    priceInr: params.priceInr,
    bodyType: params.bodyType,
    compareRivals: params.compareRivals,
    peerFamilies: params.peerFamilies,
    evIntelligence: params.evIntelligence,
    catalogMeta: params.catalogMeta,
  });
}

/**
 * @param {object} seoPage
 */
export function buildGuidePageContext(seoPage = {}) {
  const category = seoPage?.category || "usage";
  let pageFamily = LINK_PAGE_FAMILIES.GUIDE;
  if (category === "charging") pageFamily = LINK_PAGE_FAMILIES.CHARGING;
  else if (category === "ownership") pageFamily = LINK_PAGE_FAMILIES.OWNERSHIP;
  else if (category === "compare") pageFamily = LINK_PAGE_FAMILIES.COMPARE;
  else if (category === "city") pageFamily = LINK_PAGE_FAMILIES.CITY;

  return normalizePageContext({
    pageFamily,
    slug: seoPage?.slug,
    seoPage,
  });
}

/**
 * @param {object} params
 */
export function buildComparePageContext(params = {}) {
  return normalizePageContext({
    pageFamily: LINK_PAGE_FAMILIES.COMPARE,
    slug: params.compareSlug,
    compareSlugs: params.contextSlugs || params.compareSlugs || [],
  });
}

export function buildHomePageContext() {
  return normalizePageContext({ pageFamily: LINK_PAGE_FAMILIES.HOME, path: "/" });
}
