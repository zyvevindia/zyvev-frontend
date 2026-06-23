/**
 * Select strongest and weakest buyer archetype matches for a vehicle.
 *
 * Uses qualitative fit tiers only — no numeric scores or rankings.
 */

import { FIT_TIERS } from "./fitConstants.js";
import { BUYER_ARCHETYPE_IDS } from "./constants.js";
import { tierRank } from "../score2/scoreTierMapping.js";
import { archetypeTitleForProfile } from "./buildVehicleRecommendationProfiles.js";

/** @typedef {import("./buildBuyerRecommendationProfile.js").BuyerRecommendationProfile} BuyerRecommendationProfile */

const TOP_FIT_MAX = 2;

/** @type {Record<string, number>} */
const ARCHETYPE_TOP_FIT_PRIORITY = Object.freeze({
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: 1,
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: 2,
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: 3,
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: 4,
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: 5,
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: 6,
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: 7,
});

/**
 * @typedef {{
 *   archetypeId: string,
 *   title: string,
 *   fitTier: import("./fitConstants.js").FitTier,
 *   profile: BuyerRecommendationProfile,
 * }} ArchetypeFitSelection
 *
 * @typedef {{
 *   topFits: ArchetypeFitSelection[],
 *   secondaryFits: ArchetypeFitSelection[],
 *   weakFits: ArchetypeFitSelection[],
 * }} TopArchetypeSelection
 */

/**
 * @param {BuyerRecommendationProfile} profile
 * @returns {ArchetypeFitSelection}
 */
function toSelection(profile) {
  return {
    archetypeId: profile.archetypeId,
    title: archetypeTitleForProfile(profile),
    fitTier: profile.fitTier,
    profile,
  };
}

function compareTopFitPriority(left, right) {
  const leftPriority =
    ARCHETYPE_TOP_FIT_PRIORITY[left.archetypeId] ?? Number.MAX_SAFE_INTEGER;
  const rightPriority =
    ARCHETYPE_TOP_FIT_PRIORITY[right.archetypeId] ?? Number.MAX_SAFE_INTEGER;

  return leftPriority - rightPriority;
}

/**
 * @param {BuyerRecommendationProfile} left
 * @param {BuyerRecommendationProfile} right
 * @returns {number}
 */
function compareStrongProfiles(left, right) {
  const tierDiff = tierRank(right.fitTier) - tierRank(left.fitTier);
  if (tierDiff !== 0) {
    return tierDiff;
  }

  return compareTopFitPriority(left, right);
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @returns {TopArchetypeSelection}
 */
export function selectTopArchetypes(profiles = []) {
  const validProfiles = profiles.filter(Boolean);

  /** @type {BuyerRecommendationProfile[]} */
  const strong = [];
  /** @type {BuyerRecommendationProfile[]} */
  const secondary = [];
  /** @type {BuyerRecommendationProfile[]} */
  const weak = [];

  for (const profile of validProfiles) {
    if (
      profile.fitTier === FIT_TIERS.EXCELLENT ||
      profile.fitTier === FIT_TIERS.GOOD
    ) {
      strong.push(profile);
      continue;
    }

    if (profile.fitTier === FIT_TIERS.MODERATE) {
      secondary.push(profile);
      continue;
    }

    if (
      profile.fitTier === FIT_TIERS.LIMITED ||
      profile.fitTier === FIT_TIERS.INSUFFICIENT
    ) {
      weak.push(profile);
    }
  }

  const strongSorted = [...strong].sort(compareStrongProfiles);
  const topProfiles = strongSorted.slice(0, TOP_FIT_MAX);
  const overflowStrong = strongSorted.slice(TOP_FIT_MAX);

  return {
    topFits: topProfiles.map(toSelection),
    secondaryFits: [...overflowStrong, ...secondary]
      .sort(compareTopFitPriority)
      .map(toSelection),
    weakFits: weak.sort(compareTopFitPriority).map(toSelection),
  };
}
