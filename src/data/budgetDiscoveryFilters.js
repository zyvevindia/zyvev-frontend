/**
 * Budget discovery hub — price band chips (filters, not separate landing UX).
 */

export const BUDGET_DISCOVERY_PRICE_PARAM = "price";

export const BUDGET_PRICE_FILTER_OPTIONS = Object.freeze([
  {
    id: "all",
    label: "All EVs",
    filterIds: [],
  },
  {
    id: "under_10",
    label: "Under ₹10 lakh",
    filterIds: ["price_under_10"],
  },
  {
    id: "under_15",
    label: "Under ₹15 lakh",
    filterIds: ["price_under_15"],
  },
  {
    id: "under_20",
    label: "Under ₹20 lakh",
    filterIds: ["price_under_20"],
  },
]);

const BY_ID = new Map(
  BUDGET_PRICE_FILTER_OPTIONS.map((option) => [option.id, option])
);

/** Legacy /discover/under-*-lakh slugs → budget hub price param */
export const BUDGET_LEGACY_PRESET_TO_PRICE = Object.freeze({
  "under-10-lakh": "under_10",
  "under-15-lakh": "under_15",
  "under-20-lakh": "under_20",
});

export function parseBudgetPriceFilterId(raw) {
  const id = String(raw || "").trim();
  return BY_ID.has(id) ? id : "all";
}

export function getBudgetPriceFilterOption(id) {
  return BY_ID.get(parseBudgetPriceFilterId(id)) || BY_ID.get("all");
}
