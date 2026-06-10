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

/**
 * Rank families for an intelligence discovery preset.
 */
export function rankFamiliesForPreset(families, preset) {
  if (!preset) return [];

  const filtered = filterEnrichedFamilies(families, {
    intelligenceFilterIds: preset.intelligenceFilterIds || [],
  });

  const sortFn = SORT_KEY_MAP[preset.sortBy] || SORT_KEY_MAP.composite;

  const ranked = [...filtered]
    .map((family) => ({
      family,
      card: familyToListingCard(family),
      sortScore: sortFn(family),
      score:
        family.evSavariScores?.overall?.score ?? family.evScores?.composite,
      grade: family.evSavariScores?.overall?.grade ?? family.evScores?.grade,
      reason: buildRankReason(family, preset),
    }))
    .sort((a, b) => b.sortScore - a.sortScore);

  return ranked;
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
