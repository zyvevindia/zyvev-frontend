import { filterEnrichedFamilies } from "./filterMatcher.js";
import { familyToListingCard } from "../utils/modelFamily.js";

function subScore(family, legacyKey, v1Key) {
  const v1 = family.evSavariScores?.breakdown?.[v1Key]?.score;
  if (v1 != null) return v1;
  return family.evScores?.subScores?.[legacyKey] ?? 0;
}

const SORT_KEY_MAP = {
  cityUsability: (f) => subScore(f, "cityUsability", "city"),
  highwayUsability: (f) => subScore(f, "highwayUsability", "highway"),
  chargingConvenience: (f) => subScore(f, "chargingConvenience", "charging"),
  ownershipAffordability: (f) => subScore(f, "ownershipAffordability", "value"),
  technologyFeatures: (f) => subScore(f, "technologyFeatures", "feature"),
  practicality: (f) => subScore(f, "practicality", "family"),
  range: (f) => subScore(f, "range", "range"),
  safety: (f) => subScore(f, "safety", "safety"),
  performance: (f) => subScore(f, "performance", "performance"),
  composite: (f) =>
    f.evSavariScores?.overall?.score ?? f.evScores?.composite ?? 0,
  priceLow: (f) => -(f.startingPrice || 0),
};

const DEFAULT_FALLBACK_SORT_CHAIN = Object.freeze([
  "practicality",
  "ownershipAffordability",
  "composite",
]);

function pickFallbackSortBy(families, sortChain = DEFAULT_FALLBACK_SORT_CHAIN) {
  for (const key of sortChain) {
    const sortFn = SORT_KEY_MAP[key];
    if (!sortFn) continue;
    if (families.some((family) => sortFn(family) > 0)) {
      return key;
    }
  }
  return "composite";
}

function rankFamilyPool(families, sortBy, preset) {
  const sortFn = SORT_KEY_MAP[sortBy] || SORT_KEY_MAP.composite;

  return [...families]
    .map((family) => ({
      family,
      card: familyToListingCard(family),
      sortScore: sortFn(family),
      score:
        family.evSavariScores?.overall?.score ?? family.evScores?.composite,
      grade: family.evSavariScores?.overall?.grade ?? family.evScores?.grade,
      reason: buildRankReason(family, { ...preset, sortBy }),
    }))
    .sort((a, b) => b.sortScore - a.sortScore);
}

/**
 * Rank families for an intelligence discovery preset.
 * @returns {{ ranked: object[], fallbackNotice: string|null }}
 */
export function rankFamiliesForPreset(families, preset, options = {}) {
  if (!preset) {
    return { ranked: [], fallbackNotice: null };
  }

  const { search = "", extraFilterIds = [] } = options;
  const searchTerm = search.trim() || undefined;

  const filterIds = [
    ...(preset.intelligenceFilterIds || []),
    ...extraFilterIds,
  ];

  const filtered = filterEnrichedFamilies(families, {
    intelligenceFilterIds: filterIds,
    search: searchTerm,
  });

  if (filtered.length > 0) {
    return {
      ranked: rankFamilyPool(filtered, preset.sortBy, preset),
      fallbackNotice: null,
    };
  }

  if (!families.length || searchTerm) {
    return { ranked: [], fallbackNotice: null };
  }

  if (!preset.enableEmptyFallback) {
    return { ranked: [], fallbackNotice: null };
  }

  const fallbackSortBy = pickFallbackSortBy(
    families,
    preset.fallbackSortChain || DEFAULT_FALLBACK_SORT_CHAIN
  );

  return {
    ranked: rankFamilyPool(families, fallbackSortBy, preset),
    fallbackNotice: preset.emptyFallbackNotice || null,
  };
}

function buildRankReason(family, preset) {
  const sub = family.evScores?.subScores || {};
  const v1 = family.evSavariScores?.breakdown || {};
  const sort = preset.sortBy;
  if (sort === "cityUsability") {
    const s = v1.city?.score ?? sub.cityUsability;
    if (s != null) return `City usability score ${s}/100`;
  }
  if (sort === "chargingConvenience") {
    const s = v1.charging?.score ?? sub.chargingConvenience;
    if (s != null) return `Charging score ${s}/100`;
  }
  if (sort === "ownershipAffordability") {
    const s = v1.value?.score ?? sub.ownershipAffordability;
    if (s != null) return `Value score ${s}/100`;
  }
  const composite =
    family.evSavariScores?.overall?.score ?? family.evScores?.composite;
  if (composite != null) {
    const grade = family.evSavariScores?.overall?.grade;
    return grade
      ? `EVSavari score ${composite}/100 (${grade})`
      : `EVSavari composite ${composite}/100`;
  }
  return "Ranked by EVSavari intelligence signals";
}
