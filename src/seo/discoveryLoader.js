/**
 * Loads discovery page content — API, root seo-data, or nested paths.
 */

import { fetchSeoPage } from "../utils/seoPageApi";

import { PAGE_TYPES } from "./registry";

async function fetchStaticDiscoveryJson(path) {
  try {
    const safePath = String(path || "")
      .replace(/^\/+/, "")
      .replace(/\.\./g, "");
    const res = await fetch(`/seo-data/${safePath}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * @param {import('./registry').DiscoveryRouteContext} routeContext
 */
export async function loadDiscoveryPage(routeContext) {
  if (!routeContext) return null;

  const { contentSlug, staticDataPath, pageType } = routeContext;

  if (
    pageType === PAGE_TYPES.BRAND ||
    pageType === PAGE_TYPES.CITY_EVS ||
    pageType === PAGE_TYPES.CITY_CHARGING
  ) {
    const nested = await fetchStaticDiscoveryJson(
      staticDataPath || contentSlug
    );
    if (nested?.seoPage) {
      return {
        seoPage: {
          ...nested.seoPage,
          canonicalUrl: routeContext.canonicalUrl,
        },
        source: "static-nested",
      };
    }
  }

  const data = await fetchSeoPage(contentSlug);
  if (data?.seoPage) {
    return {
      seoPage: {
        ...data.seoPage,
        canonicalUrl:
          routeContext.canonicalUrl ||
          data.seoPage.canonicalUrl,
      },
      source: "seo-api-or-root-static",
    };
  }

  return null;
}
