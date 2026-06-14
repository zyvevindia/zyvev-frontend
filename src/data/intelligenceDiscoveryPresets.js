/**
 * Intelligence-driven discovery presets — deterministic rules + SEO paths.
 * Used by /discover/:preset and sitemap generation.
 */

export const INTELLIGENCE_DISCOVERY_PRESETS = Object.freeze({
  "budget-evs": {
    slug: "budget-evs",
    path: "/discover/budget-evs",
    title: "Budget electric cars in India — compare all EVs by price",
    h1: "Budget EVs",
    description:
      "Browse every electric car on EVSavari sorted by ex-showroom price — from entry-level hatchbacks to premium models. Filter by budget band or search by name.",
    intelligenceFilterIds: [],
    sortBy: "priceLow",
    sortLabel: "Price (Low → High)",
    showValueScore: true,
    enableSearch: true,
    budgetPriceFilters: true,
    minResults: 1,
  },
  "city-driving": {
    slug: "city-driving",
    path: "/discover/city-driving",
    title: "Best EVs for city driving in India",
    h1: "Best EVs for city driving",
    description:
      "Rule-ranked electric cars for Indian city commutes — based on EVSavari city usability, charging convenience, and indicative running costs. Not sponsored listings.",
    intelligenceFilterIds: ["city_friendly"],
    sortBy: "cityUsability",
    minResults: 3,
    faq: [
      {
        q: "How does EVSavari rank city EVs?",
        a: "We use deterministic scores from charging convenience, suitability signals, and range confidence — not paid placements.",
      },
      {
        q: "Are these prices final?",
        a: "Prices are indicative ex-showroom. Confirm on-road quotes with dealers in your city.",
      },
    ],
  },
  "under-10-lakh": {
    slug: "under-10-lakh",
    path: "/discover/under-10-lakh",
    title: "Best electric cars under ₹10 lakh in India",
    h1: "EVs under ₹10 lakh",
    description:
      "Discover affordable electric cars under ₹10 lakh — sorted by ex-showroom price with EVSavari value scores on each card.",
    intelligenceFilterIds: ["price_under_10"],
    sortBy: "priceLow",
    sortLabel: "Price (Low → High)",
    showValueScore: true,
    budgetPriceFilters: true,
    redirectToBudgetHub: true,
    minResults: 2,
  },
  "under-15-lakh": {
    slug: "under-15-lakh",
    path: "/discover/under-15-lakh",
    title: "Best electric cars under ₹15 lakh in India",
    h1: "EVs under ₹15 lakh",
    description:
      "Discover affordable electric cars under ₹15 lakh — sorted by ex-showroom price with EVSavari value scores on each card.",
    intelligenceFilterIds: ["price_under_15"],
    sortBy: "priceLow",
    sortLabel: "Price (Low → High)",
    showValueScore: true,
    budgetPriceFilters: true,
    redirectToBudgetHub: true,
    minResults: 2,
  },
  "under-20-lakh": {
    slug: "under-20-lakh",
    path: "/discover/under-20-lakh",
    title: "Best electric cars under ₹20 lakh in India",
    h1: "EVs under ₹20 lakh",
    description:
      "Discover electric cars under ₹20 lakh — sorted by ex-showroom price with EVSavari value scores on each card.",
    intelligenceFilterIds: ["price_under_20"],
    sortBy: "priceLow",
    sortLabel: "Price (Low → High)",
    showValueScore: true,
    budgetPriceFilters: true,
    redirectToBudgetHub: true,
    minResults: 2,
  },
  "fastest-charging": {
    slug: "fastest-charging",
    path: "/discover/fastest-charging",
    title: "Fastest-charging EVs in India",
    h1: "EVs with the fastest charging",
    description:
      "Compare electric cars with the quickest DC fast-charging times and strong charging convenience scores.",
    intelligenceFilterIds: ["charging_fast"],
    sortBy: "chargingConvenience",
    minResults: 2,
  },
  "apartment-living": {
    slug: "apartment-living",
    path: "/discover/apartment-living",
    title: "Best EVs for apartment living in India",
    h1: "EVs for apartment living",
    description:
      "EVs suited to apartment parking — home AC charging support, public DC flexibility, and honest suitability notes.",
    intelligenceFilterIds: ["apartment_friendly"],
    sortBy: "practicality",
    minResults: 2,
  },
  "long-range": {
    slug: "long-range",
    path: "/discover/long-range",
    title: "Long-range electric cars in India",
    h1: "Long-range EVs",
    description:
      "Electric cars with strong claimed and estimated real-world range for fewer charging stops on inter-city trips.",
    intelligenceFilterIds: ["range_long"],
    sortBy: "highwayUsability",
    minResults: 2,
  },
  "family-friendly": {
    slug: "family-friendly",
    path: "/discover/family-friendly",
    title: "Family-friendly electric cars in India",
    h1: "Family-friendly EVs",
    description:
      "Practical family EVs ranked by suitability and ownership signals — compare trims on EVSavari.",
    intelligenceFilterIds: ["family_friendly"],
    sortBy: "practicality",
    enableEmptyFallback: true,
    fallbackSortChain: ["practicality", "ownershipAffordability", "composite"],
    emptyFallbackNotice:
      "We're still improving family-focused rankings. Showing the best available EVs while more family-specific data is verified.",
    minResults: 1,
  },
  "adas-equipped": {
    slug: "adas-equipped",
    path: "/discover/adas-equipped",
    title: "Electric cars with ADAS in India",
    h1: "EVs with ADAS support",
    description:
      "Browse EVs where ADAS support is present in our structured feature intelligence. Verify variant-level kit with the OEM.",
    intelligenceFilterIds: ["feature_adas"],
    sortBy: "technologyFeatures",
    minResults: 1,
  },
  "highway-evs": {
    slug: "highway-evs",
    path: "/discover/highway-evs",
    title: "Best highway electric cars in India",
    h1: "Best highway EVs",
    description:
      "EVs ranked for highway usability — range confidence, DC charging speed, and long-distance suitability.",
    intelligenceFilterIds: ["highway_friendly"],
    sortBy: "highwayUsability",
    minResults: 2,
  },
});

export const INTELLIGENCE_DISCOVERY_SLUGS = Object.freeze(
  Object.keys(INTELLIGENCE_DISCOVERY_PRESETS)
);

export function getDiscoveryPreset(slug) {
  return INTELLIGENCE_DISCOVERY_PRESETS[slug] || null;
}
