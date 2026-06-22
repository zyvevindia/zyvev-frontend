export const OWNERSHIP_HUB_PATH = "/ownership";
export const OWNERSHIP_VEHICLE_INDEX_PATH = "/ownership/vehicles";

/**
 * @typedef {{ name: string, url: string }} OwnershipBreadcrumbItem
 */

/**
 * @returns {OwnershipBreadcrumbItem[]}
 */
export function buildOwnershipHubBreadcrumbs() {
  return [
    { name: "Home", url: "/" },
    { name: "Ownership", url: OWNERSHIP_HUB_PATH },
  ];
}

/**
 * @returns {OwnershipBreadcrumbItem[]}
 */
export function buildOwnershipVehicleIndexBreadcrumbs() {
  return [
    { name: "Home", url: "/" },
    { name: "Ownership", url: OWNERSHIP_HUB_PATH },
    { name: "Vehicle Ownership", url: OWNERSHIP_VEHICLE_INDEX_PATH },
  ];
}

/**
 * @param {{
 *   vehicleName: string,
 *   pageLabel: string,
 *   pagePath: string,
 * }} params
 * @returns {OwnershipBreadcrumbItem[]}
 */
export function buildOwnershipVehicleTopicBreadcrumbs({
  vehicleName,
  pageLabel,
  pagePath,
}) {
  const name = vehicleName || "Electric vehicle";
  const label = pageLabel || "Ownership";
  return [
    { name: "Home", url: "/" },
    { name: "Ownership", url: OWNERSHIP_HUB_PATH },
    { name: "Vehicle Ownership", url: OWNERSHIP_VEHICLE_INDEX_PATH },
    { name: `${name} — ${label}`, url: pagePath },
  ];
}
