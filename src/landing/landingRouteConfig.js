/**
 * Landing route families — single routing configuration for all landing pages.
 */

export const LANDING_ROUTE_FAMILIES = Object.freeze({
  BRANDS: "brands",
  BEST_EVS: "best-evs",
  DISCOVER: "discover",
  /** Reserved for future sprints — not wired in App.jsx yet */
  CITIES: "cities",
  CHARGING: "charging-guides",
  OWNERSHIP: "ownership-guides",
  FINANCE: "finance",
  DEALER: "dealer",
  EDITORIAL: "editorial",
});

/**
 * @type {Record<string, { paramKey: string, pathPrefix: string }>}
 */
export const LANDING_ROUTE_CONFIG = Object.freeze({
  [LANDING_ROUTE_FAMILIES.BRANDS]: {
    paramKey: "brand",
    pathPrefix: "/brands",
  },
  [LANDING_ROUTE_FAMILIES.BEST_EVS]: {
    paramKey: "useCase",
    pathPrefix: "/best-evs",
  },
  [LANDING_ROUTE_FAMILIES.DISCOVER]: {
    paramKey: "presetSlug",
    pathPrefix: "/discover",
  },
});

/**
 * @param {string} routeFamily
 * @param {string} slug
 */
export function buildLandingPath(routeFamily, slug) {
  const cfg = LANDING_ROUTE_CONFIG[routeFamily];
  if (!cfg || !slug) return null;
  return `${cfg.pathPrefix}/${slug}`;
}
