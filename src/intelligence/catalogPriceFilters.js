/**
 * Unified catalog price bands — single source for Home, Listing, and discovery links.
 */

export const CATALOG_PRICE_RANGES = Object.freeze([
  {
    id: "under_10",
    label: "Under ₹10 lakh",
    min: 0,
    max: 999999,
  },
  {
    id: "10_15",
    label: "₹10–15 lakh",
    min: 1000000,
    max: 1500000,
  },
  {
    id: "15_20",
    label: "₹15–20 lakh",
    min: 1500001,
    max: 2000000,
  },
  {
    id: "20_30",
    label: "₹20–30 lakh",
    min: 2000001,
    max: 3000000,
  },
  {
    id: "above_30",
    label: "Above ₹30 lakh",
    min: 3000001,
    max: Infinity,
  },
]);

const BY_ID = new Map(CATALOG_PRICE_RANGES.map((r) => [r.id, r]));

/** Legacy Home / filterMatcher values → unified ids */
const LEGACY_PRICE_ALIASES = Object.freeze({
  low: "under_10",
  under_15: "10_15",
  mid: "15_20",
  high: "above_30",
});

export function normalizePriceRangeId(id) {
  if (!id) return "";
  return LEGACY_PRICE_ALIASES[id] || id;
}

export function getPriceRangeDefinition(id) {
  const normalized = normalizePriceRangeId(id);
  return BY_ID.get(normalized) || null;
}

/**
 * @param {number} priceInr
 * @param {string} rangeId
 */
export function matchesCatalogPriceRange(priceInr, rangeId) {
  const def = getPriceRangeDefinition(rangeId);
  if (!def) return true;
  const price = Number(priceInr) || 0;
  if (price <= 0) return false;
  if (def.max === Infinity) return price >= def.min;
  return price >= def.min && price <= def.max;
}

/** Matches legacy “under ₹15 lakh” discovery preset. */
export function matchesUnder15Lakh(priceInr) {
  const price = Number(priceInr) || 0;
  return price > 0 && price <= 1500000;
}

/**
 * @param {object[]} families
 * @param {string} rangeId
 */
export function applyCatalogPriceFilter(families, rangeId) {
  const normalized = normalizePriceRangeId(rangeId);
  if (!normalized) return families;
  return families.filter((f) =>
    matchesCatalogPriceRange(f.startingPrice, normalized)
  );
}

export const CATALOG_PRICE_URL_PARAM = "price";

export function parsePriceRangeFromParams(searchParams) {
  const raw =
    searchParams?.get(CATALOG_PRICE_URL_PARAM) ||
    searchParams?.get("priceRange") ||
    "";
  const normalized = normalizePriceRangeId(raw.trim());
  return BY_ID.has(normalized) ? normalized : "";
}

export function writePriceRangeToParams(rangeId, searchParams) {
  const next = new URLSearchParams(searchParams);
  const normalized = normalizePriceRangeId(rangeId);
  if (normalized && BY_ID.has(normalized)) {
    next.set(CATALOG_PRICE_URL_PARAM, normalized);
  } else {
    next.delete(CATALOG_PRICE_URL_PARAM);
    next.delete("priceRange");
  }
  return next;
}
