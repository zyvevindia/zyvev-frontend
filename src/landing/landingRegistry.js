/**
 * Landing configuration registry — single source of truth for all landing pages.
 */

import { buildLandingPath } from "./landingRouteConfig.js";
import { DEFAULT_LANDING_SECTIONS } from "./types.js";

/** @type {Map<string, import('./types.js').LandingPageConfig>} */
const registry = new Map();

function registryKey(routeFamily, slug) {
  return `${routeFamily}:${String(slug || "").trim().toLowerCase()}`;
}

/**
 * Register a landing page configuration (used by future content sprints).
 * @param {import('./types.js').LandingPageConfig} config
 */
export function registerLandingPage(config) {
  if (!config?.routeFamily || !config?.slug) {
    throw new Error("Landing config requires routeFamily and slug");
  }

  const normalized = {
    ...config,
    slug: String(config.slug).trim().toLowerCase(),
    path: config.path || buildLandingPath(config.routeFamily, config.slug),
    sections: config.sections?.length ? config.sections : [...DEFAULT_LANDING_SECTIONS],
  };

  registry.set(registryKey(normalized.routeFamily, normalized.slug), normalized);
  return normalized;
}

/**
 * @param {string} routeFamily
 * @param {string} slug
 * @returns {import('./types.js').LandingPageConfig | null}
 */
export function resolveLandingConfig(routeFamily, slug) {
  if (!routeFamily || !slug) return null;
  return registry.get(registryKey(routeFamily, slug)) || null;
}

/** @returns {import('./types.js').LandingPageConfig[]} */
export function listLandingPages() {
  return [...registry.values()];
}

export function getLandingRegistrySize() {
  return registry.size;
}

/**
 * Test-only helper — not used in production routes.
 * @param {import('./types.js').LandingPageConfig[]} entries
 */
export function __seedLandingRegistryForTests(entries = []) {
  registry.clear();
  for (const entry of entries) {
    registerLandingPage(entry);
  }
}

export function __clearLandingRegistryForTests() {
  registry.clear();
}
