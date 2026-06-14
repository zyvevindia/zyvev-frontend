/**
 * Shared catalog filter pipeline for Home and Listing.
 */
import { enrichFamiliesWithIntelligence } from "./familyIntelligence.js";
import {
  applyCatalogPriceFilter,
  normalizePriceRangeId,
} from "./catalogPriceFilters.js";
import {
  applyBodyTypeFilter,
  BODY_TYPE_FILTER_ENABLED,
  parseBodyTypeFilterId,
} from "./bodyTypeCatalog.js";
import { applyIntelligenceFilters } from "./filterMatcher.js";

/**
 * @param {object[]} families
 * @param {object} options
 */
export function filterCatalogFamilies(
  families,
  {
    brand,
    search,
    priceRange,
    bodyType: _bodyType,
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

  const normalizedPrice = normalizePriceRangeId(priceRange);
  if (normalizedPrice) {
    list = applyCatalogPriceFilter(list, normalizedPrice);
  }

  if (BODY_TYPE_FILTER_ENABLED && _bodyType) {
    list = applyBodyTypeFilter(list, _bodyType);
  }

  if (BODY_TYPE_FILTER_ENABLED) {
    const bodyFromIntel = intelligenceFilterIds
      .map(parseBodyTypeFilterId)
      .filter(Boolean);
    if (bodyFromIntel.length) {
      list = list.filter((f) =>
        bodyFromIntel.some((id) =>
          applyBodyTypeFilter([f], id).length > 0
        )
      );
    }
  }

  const nonBodyIntel = intelligenceFilterIds.filter(
    (id) => !parseBodyTypeFilterId(id)
  );
  list = applyIntelligenceFilters(list, nonBodyIntel);

  return list;
}
