/**
 * SEO Agent v1 — page template definitions (20 validation pages).
 */
import { CATEGORY_DEFINITIONS } from "../../scoring/scoreWeights.js";

export const SEO_CONTENT_TYPES = Object.freeze({
  BUYING_GUIDE: "buying_guide",
  COMPARE: "compare",
  TOP_LIST: "top_list",
  VARIANT_RECOMMENDATION: "variant_recommendation",
});

export const SITE_ORIGIN = "https://evsavari.com";

/** All v1 page specs — deterministic generation targets. */
export const SEO_PAGE_SPECS = Object.freeze([
  {
    id: "best-ev-under-15-lakh",
    contentType: SEO_CONTENT_TYPES.BUYING_GUIDE,
    slug: "best-evs-under-15-lakh-agent",
    h1: "Best EVs under ₹15 lakh in India",
    categoryId: "budget",
    priceMaxInr: 1500000,
    limit: 10,
    canonicalPath: "/best-evs/under-15-lakh-agent",
    pageTypeId: "budget_under_15",
  },
  {
    id: "best-family-ev",
    contentType: SEO_CONTENT_TYPES.BUYING_GUIDE,
    slug: "best-evs-for-family-agent",
    h1: "Best family EVs in India",
    categoryId: "family",
    limit: 8,
    canonicalPath: "/best-evs/family-agent",
    pageTypeId: "family",
  },
  {
    id: "best-city-ev",
    contentType: SEO_CONTENT_TYPES.BUYING_GUIDE,
    slug: "best-evs-for-city-agent",
    h1: "Best city EVs in India",
    categoryId: "city",
    limit: 8,
    canonicalPath: "/best-evs/city-agent",
    pageTypeId: "city_driving",
  },
  {
    id: "best-highway-ev",
    contentType: SEO_CONTENT_TYPES.BUYING_GUIDE,
    slug: "best-evs-for-highway-agent",
    h1: "Best highway EVs in India",
    categoryId: "highway",
    limit: 8,
    canonicalPath: "/best-evs/highway-agent",
    pageTypeId: "highway_driving",
  },
  {
    id: "best-premium-ev",
    contentType: SEO_CONTENT_TYPES.BUYING_GUIDE,
    slug: "best-evs-premium-agent",
    h1: "Best premium EVs in India",
    categoryId: "premium",
    limit: 8,
    canonicalPath: "/best-evs/premium-agent",
    pageTypeId: "premium",
  },
  {
    id: "best-budget-ev",
    contentType: SEO_CONTENT_TYPES.BUYING_GUIDE,
    slug: "best-evs-budget-agent",
    h1: "Best budget EVs in India",
    categoryId: "budget",
    limit: 8,
    canonicalPath: "/best-evs/budget-agent",
    pageTypeId: "budget",
  },
  {
    id: "compare-curvv-vs-be6",
    contentType: SEO_CONTENT_TYPES.COMPARE,
    slug: "tata-curvv-ev-vs-mahindra-be-6-agent",
    h1: "Tata Curvv EV vs Mahindra BE 6",
    compareSlugs: ["tata-curvv-ev", "mahindra-be-6"],
    canonicalPath: "/compare/tata-curvv-ev-vs-mahindra-be-6-agent",
    pageTypeId: "head_to_head",
  },
  {
    id: "compare-punch-vs-windsor",
    contentType: SEO_CONTENT_TYPES.COMPARE,
    slug: "tata-punch-ev-vs-mg-windsor-ev-agent",
    h1: "Tata Punch EV vs MG Windsor EV",
    compareSlugs: ["tata-punch-ev", "mg-windsor-ev"],
    canonicalPath: "/compare/tata-punch-ev-vs-mg-windsor-ev-agent",
    pageTypeId: "head_to_head",
  },
  {
    id: "compare-atto3-vs-creta",
    contentType: SEO_CONTENT_TYPES.COMPARE,
    slug: "byd-atto-3-vs-hyundai-creta-electric-agent",
    h1: "BYD Atto 3 vs Hyundai Creta Electric",
    compareSlugs: ["byd-atto-3", "hyundai-creta-electric"],
    canonicalPath: "/compare/byd-atto-3-vs-hyundai-creta-electric-agent",
    pageTypeId: "head_to_head",
  },
  {
    id: "top-10-evs",
    contentType: SEO_CONTENT_TYPES.TOP_LIST,
    slug: "top-10-evs-agent",
    h1: "Top 10 EVs in India",
    sortKey: "overall",
    limit: 10,
    canonicalPath: "/best-evs/top-10-agent",
    pageTypeId: "top_composite",
  },
  {
    id: "fastest-charging-evs",
    contentType: SEO_CONTENT_TYPES.TOP_LIST,
    slug: "fastest-charging-evs-agent",
    h1: "Fastest charging EVs in India",
    sortKey: "charging",
    limit: 10,
    canonicalPath: "/best-evs/fastest-charging-agent",
    pageTypeId: "fast_charging",
  },
  {
    id: "longest-range-evs",
    contentType: SEO_CONTENT_TYPES.TOP_LIST,
    slug: "longest-range-evs-agent",
    h1: "Longest range EVs in India",
    sortKey: "range",
    limit: 10,
    canonicalPath: "/best-evs/longest-range-agent",
    pageTypeId: "long_range",
  },
  {
    id: "safest-evs",
    contentType: SEO_CONTENT_TYPES.TOP_LIST,
    slug: "safest-evs-agent",
    h1: "Safest EVs in India",
    sortKey: "safety",
    limit: 10,
    canonicalPath: "/best-evs/safest-agent",
    pageTypeId: "safety",
  },
  {
    id: "variant-best-value-catalog",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "best-value-ev-variants-agent",
    h1: "Best value EV variants in India",
    variantRole: "bestValue",
    limit: 10,
    canonicalPath: "/guides/best-value-variants-agent",
    pageTypeId: "variant_value",
  },
  {
    id: "variant-fastest-charging-catalog",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "fastest-charging-ev-variants-agent",
    h1: "Fastest charging EV variants in India",
    variantRole: "fastestCharging",
    limit: 10,
    canonicalPath: "/guides/fastest-charging-variants-agent",
    pageTypeId: "variant_fast_charge",
  },
  {
    id: "variant-longest-range-catalog",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "longest-range-ev-variants-agent",
    h1: "Longest range EV variants in India",
    variantRole: "longestRange",
    limit: 10,
    canonicalPath: "/guides/longest-range-variants-agent",
    pageTypeId: "variant_long_range",
  },
  {
    id: "variant-best-value-nexon",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "tata-nexon-ev-best-value-variant-agent",
    h1: "Best value variant — Tata Nexon EV",
    familySlug: "tata-nexon-ev",
    variantRole: "bestValue",
    limit: 1,
    canonicalPath: "/guides/tata-nexon-ev-best-value-variant-agent",
    pageTypeId: "variant_value_single",
  },
  {
    id: "variant-best-value-punch",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "tata-punch-ev-best-value-variant-agent",
    h1: "Best value variant — Tata Punch EV",
    familySlug: "tata-punch-ev",
    variantRole: "bestValue",
    limit: 1,
    canonicalPath: "/guides/tata-punch-ev-best-value-variant-agent",
    pageTypeId: "variant_value_single",
  },
  {
    id: "variant-fastest-charging-nexon",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "tata-nexon-ev-fastest-charging-variant-agent",
    h1: "Fastest charging variant — Tata Nexon EV",
    familySlug: "tata-nexon-ev",
    variantRole: "fastestCharging",
    limit: 1,
    canonicalPath: "/guides/tata-nexon-ev-fastest-charging-variant-agent",
    pageTypeId: "variant_fast_charge_single",
  },
  {
    id: "variant-longest-range-punch",
    contentType: SEO_CONTENT_TYPES.VARIANT_RECOMMENDATION,
    slug: "tata-punch-ev-longest-range-variant-agent",
    h1: "Longest range variant — Tata Punch EV",
    familySlug: "tata-punch-ev",
    variantRole: "longestRange",
    limit: 1,
    canonicalPath: "/guides/tata-punch-ev-longest-range-variant-agent",
    pageTypeId: "variant_long_range_single",
  },
]);

export function getPageSpec(specId) {
  return SEO_PAGE_SPECS.find((s) => s.id === specId) || null;
}

export function getCategoryLabel(categoryId) {
  return CATEGORY_DEFINITIONS[categoryId]?.label || categoryId;
}

export function slugToDisplay(slug) {
  return String(slug || "")
    .split("-")
    .map((w) => {
      if (w === "ev") return "EV";
      if (w === "mg") return "MG";
      if (w === "byd") return "BYD";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
