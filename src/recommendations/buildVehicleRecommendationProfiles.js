/**
 * Vehicle recommendation profiles across all buyer archetypes.
 */

import { BUYER_ARCHETYPE_IDS } from "./constants.js";
import { buildBuyerRecommendationProfile } from "./buildBuyerRecommendationProfile.js";
import { buildRecommendationNarrative } from "./buildRecommendationNarrative.js";
import { buildArchetypeFit } from "./buildArchetypeFit.js";
import { getBuyerArchetype } from "./archetypeRegistry.js";

/**
 * @typedef {import("./buildBuyerRecommendationProfile.js").BuyerRecommendationProfile} BuyerRecommendationProfile
 *
 * @typedef {{
 *   cityCommuter: BuyerRecommendationProfile|null,
 *   familyBuyer: BuyerRecommendationProfile|null,
 *   highwayTraveller: BuyerRecommendationProfile|null,
 *   apartmentOwner: BuyerRecommendationProfile|null,
 *   budgetBuyer: BuyerRecommendationProfile|null,
 *   premiumBuyer: BuyerRecommendationProfile|null,
 *   firstTimeEvBuyer: BuyerRecommendationProfile|null,
 * }} VehicleRecommendationProfileMap
 */

/** @type {ReadonlyArray<[keyof VehicleRecommendationProfileMap, string]>} */
const PROFILE_KEY_TO_ARCHETYPE = Object.freeze([
  ["cityCommuter", BUYER_ARCHETYPE_IDS.CITY_COMMUTER],
  ["familyBuyer", BUYER_ARCHETYPE_IDS.FAMILY_BUYER],
  ["highwayTraveller", BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER],
  ["apartmentOwner", BUYER_ARCHETYPE_IDS.APARTMENT_OWNER],
  ["budgetBuyer", BUYER_ARCHETYPE_IDS.BUDGET_BUYER],
  ["premiumBuyer", BUYER_ARCHETYPE_IDS.PREMIUM_BUYER],
  ["firstTimeEvBuyer", BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER],
]);

/**
 * @param {{
 *   scoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   intelligenceCar?: object|null,
 * }} input
 * @returns {VehicleRecommendationProfileMap}
 */
export function buildVehicleRecommendationProfiles({
  scoreProfile,
  intelligenceCar = null,
}) {
  /** @type {VehicleRecommendationProfileMap} */
  const profiles = {
    cityCommuter: null,
    familyBuyer: null,
    highwayTraveller: null,
    apartmentOwner: null,
    budgetBuyer: null,
    premiumBuyer: null,
    firstTimeEvBuyer: null,
  };

  if (!scoreProfile) {
    return profiles;
  }

  for (const [profileKey, archetypeId] of PROFILE_KEY_TO_ARCHETYPE) {
    const archetype = getBuyerArchetype(archetypeId);
    if (!archetype) continue;

    const fitResult = buildArchetypeFit({
      archetype,
      scoreProfile,
      intelligenceCar,
    });

    const recommendationNarrative = buildRecommendationNarrative({
      archetype,
      fitResult,
      scoreProfile,
      intelligenceCar,
    });

    profiles[profileKey] = buildBuyerRecommendationProfile({
      archetype,
      fitResult,
      recommendationNarrative,
      scoreProfile,
      intelligenceCar,
    });
  }

  return profiles;
}

/**
 * @param {VehicleRecommendationProfileMap} profileMap
 * @returns {BuyerRecommendationProfile[]}
 */
export function listProfilesFromMap(profileMap) {
  return PROFILE_KEY_TO_ARCHETYPE.map(([profileKey]) => profileMap[profileKey]).filter(
    Boolean
  );
}

/**
 * @param {string} archetypeId
 * @returns {keyof VehicleRecommendationProfileMap|null}
 */
export function profileKeyForArchetypeId(archetypeId) {
  const match = PROFILE_KEY_TO_ARCHETYPE.find(([, id]) => id === archetypeId);
  return match ? match[0] : null;
}

/**
 * @param {BuyerRecommendationProfile} profile
 * @returns {string}
 */
export function archetypeTitleForProfile(profile) {
  const archetype = getBuyerArchetype(profile.archetypeId);
  return archetype?.title || profile.archetypeId;
}
