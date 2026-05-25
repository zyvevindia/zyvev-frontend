/**
 * Catalog media availability — block speculative optional assets at runtime.
 * Core tier-1 roles (hero, listing-thumb, compare-thumb) may be requested.
 * Optional roles require explicit verification (API or ops manifest).
 */

import { CATALOG_MEDIA_PREFIX } from "../config/media.js";
import { isProductionFamilySlug } from "./productionFamilies.js";

/** Extensionless / filename tails that must not be probed without verification. */
export const OPTIONAL_CATALOG_ASSET_BASENAMES = Object.freeze([
  "exterior-1",
  "exterior-2",
  "exterior-3",
  "interior-1",
  "charging-port",
  "og",
]);

/**
 * Ops-populated allowlist: familySlug → verified optional basenames.
 * Populate via media:verify + ingestion; empty by default (no fabricated media).
 * @type {Record<string, readonly string[]>}
 */
export const VERIFIED_OPTIONAL_ASSETS_BY_FAMILY = Object.freeze({});

const OPTIONAL_BASENAME_SET = new Set(OPTIONAL_CATALOG_ASSET_BASENAMES);

/**
 * @param {unknown} url
 * @returns {string | null}
 */
export function extractCatalogFamilyAssetBasename(url) {
  if (!url || typeof url !== "string") return null;
  const path = url.split("?")[0];
  const match = path.match(
    /\/catalog\/families\/[a-z0-9-]+\/([^/]+)$/i
  );
  if (!match) return null;
  return match[1].replace(/\.(jpg|jpeg|png|webp|avif)$/i, "").toLowerCase();
}

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isOptionalCatalogAssetUrl(url) {
  const basename = extractCatalogFamilyAssetBasename(url);
  return Boolean(basename && OPTIONAL_BASENAME_SET.has(basename));
}

/**
 * @param {unknown} url
 * @param {{ catalogMeta?: object | null; familySlug?: string | null }} [options]
 * @returns {boolean}
 */
export function isSpeculativeOptionalCatalogUrl(url, options = {}) {
  if (!url || typeof url !== "string") return false;
  if (!isOptionalCatalogAssetUrl(url)) return false;

  const basename = extractCatalogFamilyAssetBasename(url);
  if (!basename) return false;

  const path = url.split("?")[0];
  const familyMatch = path.match(/\/catalog\/families\/([a-z0-9-]+)\//i);
  const family =
    (options.familySlug || familyMatch?.[1] || "").toLowerCase() || null;

  if (family && !isProductionFamilySlug(family)) {
    return true;
  }

  const verifiedFromApi =
    options.catalogMeta?.media?.verifiedOptionalAssets;
  if (Array.isArray(verifiedFromApi) && verifiedFromApi.includes(basename)) {
    return false;
  }

  const verifiedFromOps =
    family && VERIFIED_OPTIONAL_ASSETS_BY_FAMILY[family];
  if (
    Array.isArray(verifiedFromOps) &&
    verifiedFromOps.includes(basename)
  ) {
    return false;
  }

  return true;
}

/**
 * @param {unknown} url
 * @param {{ catalogMeta?: object | null; familySlug?: string | null }} [options]
 * @returns {boolean}
 */
export function isRequestableCatalogMediaUrl(url, options = {}) {
  if (!url || typeof url !== "string") return false;
  if (isSpeculativeOptionalCatalogUrl(url, options)) return false;
  return true;
}

/**
 * @param {string[]} urls
 * @param {{ catalogMeta?: object | null; familySlug?: string | null }} [options]
 * @returns {string[]}
 */
export function filterRequestableMediaUrls(urls = [], options = {}) {
  if (!Array.isArray(urls)) return [];
  return urls.filter(
    (u) => typeof u === "string" && isRequestableCatalogMediaUrl(u, options)
  );
}

/**
 * Available roles for a family (runtime + manifest).
 * @param {string} familySlug
 * @param {object | null} [catalogMeta]
 * @returns {string[]}
 */
export function getAvailableMediaRoles(familySlug, catalogMeta = null) {
  const roles = ["hero", "listing-thumb", "compare-thumb"];
  const verified =
    catalogMeta?.media?.verifiedOptionalAssets ||
    VERIFIED_OPTIONAL_ASSETS_BY_FAMILY[familySlug] ||
    [];
  for (const asset of verified) {
    if (OPTIONAL_BASENAME_SET.has(asset)) roles.push(asset);
  }
  return roles;
}

export { CATALOG_MEDIA_PREFIX };
