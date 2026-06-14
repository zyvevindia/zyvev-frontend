import {
  applyServiceNetworkRules,
  normalizeServiceNetworkBrand,
} from "./serviceNetworkRules.js";

function coalesce(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

/**
 * Resolve OEM brand from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @returns {string|null}
 */
export function resolveServiceNetworkBrand(vehicle) {
  if (!vehicle || typeof vehicle !== "object") return null;

  const raw = coalesce(
    vehicle.brand,
    vehicle.catalogMeta?.brand,
    vehicle.manufacturer,
    vehicle.make
  );

  return normalizeServiceNetworkBrand(raw);
}

/**
 * Build normalized service network context from a catalog vehicle or dossier.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").ServiceNetworkContext>} [options]
 * @returns {import("./types.js").ServiceNetworkContext}
 */
export function buildServiceNetworkContext(vehicle, options = {}) {
  return {
    brand: options.brand ?? resolveServiceNetworkBrand(vehicle),
  };
}

/**
 * Deterministic service network confidence from OEM brand reach tiers.
 * @param {object|null|undefined} vehicle
 * @param {Partial<import("./types.js").ServiceNetworkContext>} [options]
 * @returns {import("./types.js").ServiceNetworkScoreResult}
 */
export function buildServiceNetworkScore(vehicle, options = {}) {
  const ctx = buildServiceNetworkContext(vehicle, options);
  return applyServiceNetworkRules(ctx);
}

export { normalizeServiceNetworkBrand } from "./serviceNetworkRules.js";
