/**
 * EVSavari buyer archetype constants.
 *
 * Archetypes are reusable building blocks — not rankings or compare logic.
 */

/** @typedef {typeof BUYER_ARCHETYPE_IDS[keyof typeof BUYER_ARCHETYPE_IDS]} BuyerArchetypeId */
export const BUYER_ARCHETYPE_IDS = Object.freeze({
  CITY_COMMUTER: "city-commuter",
  FAMILY_BUYER: "family-buyer",
  HIGHWAY_TRAVELLER: "highway-traveller",
  APARTMENT_OWNER: "apartment-owner",
  BUDGET_BUYER: "budget-buyer",
  PREMIUM_BUYER: "premium-buyer",
  FIRST_TIME_EV_BUYER: "first-time-ev-buyer",
});

/** @typedef {typeof NEED_LEVELS[keyof typeof NEED_LEVELS]} NeedLevel */
export const NEED_LEVELS = Object.freeze({
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
});

/** @type {BuyerArchetypeId[]} */
export const BUYER_ARCHETYPE_ID_LIST = Object.freeze([
  BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
  BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
  BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
  BUYER_ARCHETYPE_IDS.APARTMENT_OWNER,
  BUYER_ARCHETYPE_IDS.BUDGET_BUYER,
  BUYER_ARCHETYPE_IDS.PREMIUM_BUYER,
  BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER,
]);

export const RECOMMENDATIONS_MODULE_VERSION = "1.0.0-alpha";
