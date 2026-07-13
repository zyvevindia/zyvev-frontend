/**
 * Landing filter abstraction — LandingPage never filters catalog directly.
 * Delegates to the existing master catalog filter pipeline.
 */

import { filterCatalogFamilies } from "../../intelligence/catalogFilters.js";
import { rankFamiliesForPreset } from "../../intelligence/discoveryRanking.js";
import { familyToListingCard } from "../../utils/modelFamily.js";

/**
 * Apply registry filter config to enriched model families (read-only).
 * @param {object[]} families — from aggregateModelFamilies
 * @param {import('../types.js').LandingFilterConfig} [filterConfig]
 * @returns {{ families: object[], cards: object[], fallbackNotice: string|null }}
 */
export function applyLandingCatalogFilter(families, filterConfig = {}) {
  const {
    brand,
    search,
    priceRange,
    intelligenceFilterIds = [],
    sortBy,
    limit,
    enableEmptyFallback = true,
  } = filterConfig;

  const filtered = filterCatalogFamilies(families, {
    brand,
    search,
    priceRange,
    intelligenceFilterIds,
  });

  if (intelligenceFilterIds.length > 0 || sortBy) {
    const preset = {
      intelligenceFilterIds,
      sortBy: sortBy || "composite",
      enableEmptyFallback,
      minResults: 1,
    };

    const { ranked, fallbackNotice } = rankFamiliesForPreset(
      filtered,
      preset,
      { search }
    );

    const rankedFamilies = ranked.map((row) => row.family);
    const pool = rankedFamilies.length > 0 ? rankedFamilies : filtered;
    const limited = typeof limit === "number" ? pool.slice(0, limit) : pool;

    return {
      families: limited,
      cards: limited.map((family) => familyToListingCard(family)),
      fallbackNotice: rankedFamilies.length > 0 ? null : fallbackNotice,
    };
  }

  const limited =
    typeof limit === "number" ? filtered.slice(0, limit) : filtered;

  return {
    families: limited,
    cards: limited.map((family) => familyToListingCard(family)),
    fallbackNotice: null,
  };
}
