import {
  INTELLIGENCE_FILTER_DEFINITIONS,
  getFilterDefinition,
} from "./filterDefinitions.js";
import { enrichFamiliesWithIntelligence } from "./familyIntelligence.js";

const URL_PARAM = "intel";

/**
 * Parse active intelligence filter ids from URLSearchParams.
 * @param {URLSearchParams} searchParams
 * @returns {string[]}
 */
export function parseIntelligenceFiltersFromParams(searchParams) {
  const raw = searchParams?.get(URL_PARAM) || "";
  if (!raw.trim()) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ].filter((id) => getFilterDefinition(id));
}

/**
 * @param {string[]} activeIds
 * @param {URLSearchParams} searchParams
 */
export function writeIntelligenceFiltersToParams(
  activeIds,
  searchParams
) {
  const next = new URLSearchParams(searchParams);
  const valid = activeIds.filter((id) => getFilterDefinition(id));
  if (valid.length) {
    next.set(URL_PARAM, valid.join(","));
  } else {
    next.delete(URL_PARAM);
  }
  return next;
}

/**
 * Apply intelligence filters (AND). Families must be enriched first.
 * @param {object[]} families
 * @param {string[]} activeFilterIds
 */
export function applyIntelligenceFilters(families, activeFilterIds = []) {
  if (!activeFilterIds?.length) return families;

  return families.filter((family) =>
    activeFilterIds.every((id) => {
      const def = getFilterDefinition(id);
      if (!def) return true;
      try {
        return def.match(family);
      } catch {
        return false;
      }
    })
  );
}

/**
 * Full pipeline: enrich + legacy filters + intelligence filters.
 */
export function filterEnrichedFamilies(
  families,
  {
    brand,
    search,
    priceRange,
    intelligenceFilterIds = [],
  } = {}
) {
  let list = enrichFamiliesWithIntelligence(families);

  if (brand) {
    const b = brand.toLowerCase();
    list = list.filter((f) =>
      (f.brand || "").toLowerCase().includes(b)
    );
  }

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (f) =>
        f.familyName?.toLowerCase().includes(s) ||
        (f.brand || "").toLowerCase().includes(s) ||
        f.variants?.some((v) =>
          (v.name || "").toLowerCase().includes(s)
        )
    );
  }

  if (priceRange === "low" || priceRange === "under_15") {
    list = list.filter((f) => f.startingPrice < 1500000);
  } else if (priceRange === "mid") {
    list = list.filter(
      (f) =>
        f.startingPrice >= 1500000 && f.startingPrice <= 2500000
    );
  } else if (priceRange === "high") {
    list = list.filter((f) => f.startingPrice > 2500000);
  }

  list = applyIntelligenceFilters(list, intelligenceFilterIds);

  return list;
}

export function countFamiliesMatchingFilter(families, filterId) {
  const def = getFilterDefinition(filterId);
  if (!def) return 0;
  const enriched = enrichFamiliesWithIntelligence(families);
  return enriched.filter((f) => def.match(f)).length;
}

export function getAvailableFiltersForFamilies(families) {
  const enriched = enrichFamiliesWithIntelligence(families);
  return INTELLIGENCE_FILTER_DEFINITIONS.filter((def) =>
    enriched.some((f) => def.match(f))
  );
}

export { URL_PARAM as INTELLIGENCE_FILTER_URL_PARAM };
