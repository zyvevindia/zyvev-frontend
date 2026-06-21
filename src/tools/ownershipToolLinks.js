import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";

/** @typedef {"tco"|"emi"|"cost-per-km"|"savings-vs-petrol"} OwnershipToolKey */

/** @type {Record<OwnershipToolKey, string>} */
export const OWNERSHIP_TOOL_PATHS = Object.freeze({
  tco: "/tools/tco",
  emi: "/tools/emi",
  "cost-per-km": "/tools/cost-per-km",
  "savings-vs-petrol": "/tools/savings-vs-petrol",
});

/**
 * @param {OwnershipToolKey|string} toolKey
 * @param {string} vehicleSlug
 * @returns {string}
 */
export function buildOwnershipToolHref(toolKey, vehicleSlug) {
  const path = OWNERSHIP_TOOL_PATHS[toolKey] || toolKey;
  const slug = normalizeVehicleSlug(vehicleSlug);
  if (!slug) return path;
  return `${path}?vehicle=${encodeURIComponent(slug)}`;
}

/**
 * @param {string|null|undefined} vehicleSlug
 * @returns {string}
 */
export function resolveOwnershipToolVehicleSlug(vehicleSlug) {
  return normalizeVehicleSlug(vehicleSlug);
}
