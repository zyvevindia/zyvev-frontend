import { TIER1_MODEL_FAMILY_SLUGS } from "../../data/tier1ModelFamilies.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

/** @typedef {"running-cost"|"tco"|"petrol-savings"|"emi"} OwnershipPageType */

export const OWNERSHIP_PAGE_TYPES = Object.freeze({
  RUNNING_COST: "running-cost",
  TCO: "tco",
  PETROL_SAVINGS: "petrol-savings",
  EMI: "emi",
});

/** @type {Record<OwnershipPageType, { pathSegment: string, breadcrumbLabel: string, titleSuffix: string, navLabel: string, subtitle: string, toolPath: string }>} */
export const OWNERSHIP_PAGE_CONFIG = Object.freeze({
  [OWNERSHIP_PAGE_TYPES.RUNNING_COST]: {
    pathSegment: "running-cost",
    breadcrumbLabel: "Running cost",
    titleSuffix: "Running Cost",
    navLabel: "Running cost",
    subtitle:
      "See what this EV costs per kilometre with typical home and public charging assumptions.",
    toolPath: "/tools/cost-per-km",
  },
  [OWNERSHIP_PAGE_TYPES.TCO]: {
    pathSegment: "tco",
    breadcrumbLabel: "Ownership cost",
    titleSuffix: "Ownership Cost",
    navLabel: "Ownership cost",
    subtitle:
      "Estimate five-year ownership cost including depreciation, charging, maintenance, and insurance.",
    toolPath: "/tools/tco",
  },
  [OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS]: {
    pathSegment: "petrol-savings",
    breadcrumbLabel: "Petrol savings",
    titleSuffix: "Petrol Savings",
    navLabel: "Petrol savings",
    subtitle:
      "Compare lifetime EV ownership cost against an equivalent petrol vehicle.",
    toolPath: "/tools/savings-vs-petrol",
  },
  [OWNERSHIP_PAGE_TYPES.EMI]: {
    pathSegment: "emi",
    breadcrumbLabel: "EMI calculator",
    titleSuffix: "EMI",
    navLabel: "EMI",
    subtitle:
      "Estimate monthly loan EMI and total finance outflow for this EV.",
    toolPath: "/tools/emi",
  },
});

/** @type {OwnershipPageType[]} */
export const OWNERSHIP_PAGE_TYPE_LIST = Object.freeze([
  OWNERSHIP_PAGE_TYPES.RUNNING_COST,
  OWNERSHIP_PAGE_TYPES.TCO,
  OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS,
  OWNERSHIP_PAGE_TYPES.EMI,
]);

/**
 * @param {string} vehicleSlug
 * @param {OwnershipPageType} pageType
 * @returns {string}
 */
export function ownershipPagePath(vehicleSlug, pageType) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  const config = OWNERSHIP_PAGE_CONFIG[pageType];
  if (!slug || !config) return "/tools";
  return `/ownership/${slug}/${config.pathSegment}`;
}

/**
 * @param {string} vehicleSlug
 * @param {string} [siteOrigin]
 * @returns {boolean}
 */
export function isOwnershipPageSlug(vehicleSlug) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  return Boolean(slug && TIER1_MODEL_FAMILY_SLUGS.includes(slug));
}

/**
 * @param {OwnershipPageType[]} [excludeType]
 * @param {string} vehicleSlug
 * @returns {Array<{ type: OwnershipPageType, href: string, label: string }>}
 */
export function buildOwnershipPageNavLinks(vehicleSlug, excludeType = null) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  if (!slug) return [];

  return OWNERSHIP_PAGE_TYPE_LIST.filter((type) => type !== excludeType).map(
    (type) => ({
      type,
      href: ownershipPagePath(slug, type),
      label: `${OWNERSHIP_PAGE_CONFIG[type].navLabel} →`,
    })
  );
}
