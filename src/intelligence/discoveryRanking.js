import { filterEnrichedFamilies } from "./filterMatcher.js";
import { familyToListingCard } from "../utils/modelFamily.js";

const SORT_KEY_MAP = {
  cityUsability: (f) => f.evScores?.subScores?.cityUsability ?? 0,
  highwayUsability: (f) => f.evScores?.subScores?.highwayUsability ?? 0,
  chargingConvenience: (f) =>
    f.evScores?.subScores?.chargingConvenience ?? 0,
  ownershipAffordability: (f) =>
    f.evScores?.subScores?.ownershipAffordability ?? 0,
  technologyFeatures: (f) =>
    f.evScores?.subScores?.technologyFeatures ?? 0,
  practicality: (f) => f.evScores?.subScores?.practicality ?? 0,
  composite: (f) => f.evScores?.composite ?? 0,
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
      score: family.evScores?.composite,
      reason: buildRankReason(family, preset),
    }))
    .sort((a, b) => b.sortScore - a.sortScore);

  return ranked;
}

function buildRankReason(family, preset) {
  const sub = family.evScores?.subScores || {};
  const sort = preset.sortBy;
  if (sort === "cityUsability" && sub.cityUsability != null) {
    return `City usability score ${sub.cityUsability}/100`;
  }
  if (sort === "chargingConvenience" && sub.chargingConvenience != null) {
    return `Charging convenience ${sub.chargingConvenience}/100`;
  }
  if (sort === "ownershipAffordability" && sub.ownershipAffordability != null) {
    return `Ownership affordability ${sub.ownershipAffordability}/100`;
  }
  if (family.evScores?.composite != null) {
    return `EVSavari composite ${family.evScores.composite}/100`;
  }
  return "Ranked by EVSavari intelligence signals";
}
