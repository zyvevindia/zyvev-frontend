import { resetPageInParams } from "./catalogPagination.js";

export const CATALOG_SEARCH_URL_PARAM = "search";
export const CATALOG_SORT_URL_PARAM = "sort";
export const CATALOG_BRAND_URL_PARAM = "brand";

const VALID_SORT_VALUES = new Set([
  "",
  "price-low",
  "price-high",
  "range-high",
]);

/**
 * @param {URLSearchParams} searchParams
 */
export function parseListingSearchFromParams(searchParams) {
  return String(searchParams?.get(CATALOG_SEARCH_URL_PARAM) || "").trim();
}

/**
 * @param {URLSearchParams} searchParams
 */
export function parseListingBrandFromParams(searchParams) {
  return String(searchParams?.get(CATALOG_BRAND_URL_PARAM) || "").trim();
}

/**
 * @param {URLSearchParams} searchParams
 */
export function parseListingSortFromParams(searchParams) {
  const sort = String(searchParams?.get(CATALOG_SORT_URL_PARAM) || "").trim();
  return VALID_SORT_VALUES.has(sort) ? sort : "";
}

/**
 * Merge local listing filters into URL params and reset page.
 * @param {object} filters
 * @param {string} [filters.search]
 * @param {string} [filters.brand]
 * @param {string} [filters.sort]
 * @param {URLSearchParams} searchParams
 */
export function writeListingFiltersToParams(
  { search = "", brand = "", sort = "" },
  searchParams
) {
  let next = resetPageInParams(searchParams);

  const q = String(search || "").trim();
  if (q) {
    next.set(CATALOG_SEARCH_URL_PARAM, q);
  } else {
    next.delete(CATALOG_SEARCH_URL_PARAM);
  }

  const b = String(brand || "").trim();
  if (b) {
    next.set(CATALOG_BRAND_URL_PARAM, b);
  } else {
    next.delete(CATALOG_BRAND_URL_PARAM);
  }

  const s = VALID_SORT_VALUES.has(sort) ? sort : "";
  if (s) {
    next.set(CATALOG_SORT_URL_PARAM, s);
  } else {
    next.delete(CATALOG_SORT_URL_PARAM);
  }

  return next;
}

/**
 * @param {URLSearchParams} searchParams
 */
export function clearListingFilterParams(searchParams) {
  const next = resetPageInParams(searchParams);
  next.delete(CATALOG_SEARCH_URL_PARAM);
  next.delete(CATALOG_BRAND_URL_PARAM);
  next.delete(CATALOG_SORT_URL_PARAM);
  next.delete("body");
  next.delete("price");
  next.delete("priceRange");
  next.delete("intel");
  return next;
}
