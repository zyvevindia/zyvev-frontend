/**
 * Buyer guidance phrases derived from recommendation profiles.
 *
 * Constructive editorial guidance — not rankings or fear language.
 */

import { BUYER_ARCHETYPE_IDS } from "./constants.js";
import { FIT_TIERS } from "./fitConstants.js";
import { archetypeTitleForProfile } from "./buildVehicleRecommendationProfiles.js";

/** @typedef {import("./buildBuyerRecommendationProfile.js").BuyerRecommendationProfile} BuyerRecommendationProfile */
/** @typedef {import("./selectTopArchetypes.js").TopArchetypeSelection} TopArchetypeSelection */

/** @type {Record<string, string>} */
export const WHO_SHOULD_BUY_LABELS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: "Regular commuters",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: "Families",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: "Mixed city-highway users",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: "Apartment owners with charging plans",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: "Budget-conscious buyers",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: "Premium-oriented buyers",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: "First-time EV buyers",
});

/** @type {Record<string, string>} */
const WHO_SHOULD_LOOK_ELSEWHERE_LABELS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: "Buyers needing strong city-first usability",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: "Large families",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: "Frequent highway travellers",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]:
    "Buyers without workable charging access",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: "Buyers seeking ultra-low purchase prices",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: "Buyers seeking luxury positioning",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]:
    "Buyers wanting the simplest possible first EV",
});

/**
 * @param {string[]} phrases
 * @returns {string[]}
 */
function dedupePhrases(phrases = []) {
  const seen = new Set();
  const result = [];

  for (const phrase of phrases) {
    const cleaned = String(phrase || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @param {TopArchetypeSelection} selection
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} [scoreProfile]
 * @returns {string[]}
 */
export function buildWhoShouldBuyThis(
  profiles = [],
  selection,
  scoreProfile = null
) {
  void profiles;

  const phrases = [];

  for (const fit of selection.topFits) {
    phrases.push(
      WHO_SHOULD_BUY_LABELS[fit.archetypeId] || fit.title
    );
  }

  for (const fit of selection.secondaryFits) {
    if (
      fit.fitTier === FIT_TIERS.MODERATE ||
      fit.fitTier === FIT_TIERS.GOOD ||
      fit.fitTier === FIT_TIERS.EXCELLENT
    ) {
      phrases.push(
        WHO_SHOULD_BUY_LABELS[fit.archetypeId] || fit.title
      );
    }
  }

  for (const item of scoreProfile?.explanation?.bestFor || []) {
    if (/^first-time|^budget|^urban|^families|^family|^commut/i.test(item)) {
      phrases.push(item);
    }
  }

  return dedupePhrases(phrases).slice(0, 6);
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @param {TopArchetypeSelection} selection
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} [scoreProfile]
 * @returns {string[]}
 */
export function buildWhoShouldLookElsewhere(
  profiles = [],
  selection,
  scoreProfile = null
) {
  const phrases = [];

  for (const fit of selection.weakFits) {
    phrases.push(
      WHO_SHOULD_LOOK_ELSEWHERE_LABELS[fit.archetypeId] ||
        `Buyers prioritising ${archetypeTitleForProfile(fit.profile).toLowerCase()} needs`
    );
  }

  for (const profile of profiles) {
    if (
      profile.fitTier === FIT_TIERS.LIMITED ||
      profile.fitTier === FIT_TIERS.INSUFFICIENT
    ) {
      for (const caution of profile.considerations) {
        phrases.push(caution);
      }
    }
  }

  for (const item of scoreProfile?.explanation?.avoidIf || []) {
    phrases.push(item);
  }

  return dedupePhrases(phrases).slice(0, 4);
}
