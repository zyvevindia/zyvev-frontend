/**
 * Deterministic buyer input → archetype resolver.
 *
 * No weights, ML, or rankings — rule-based mapping only.
 */

import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";
import {
  BUDGET_RANGE_TO_ARCHETYPE,
  BUDGET_RANGES,
  BUYER_PRIORITIES,
  CHARGING_ACCESS,
  CHARGING_ACCESS_TO_ARCHETYPE,
  DAILY_DISTANCE_TO_ARCHETYPE,
  DAILY_DISTANCE_RANGES,
  FAMILY_SIZE_TO_ARCHETYPE,
  FAMILY_SIZES,
  PRIORITY_TO_ARCHETYPE,
  USAGE_PATTERNS,
  USAGE_TO_ARCHETYPE,
} from "./constants.js";

/** @typedef {import("./types.js").BuyerJourneyInput} BuyerJourneyInput */
/** @typedef {import("./types.js").ResolvedBuyerArchetypes} ResolvedBuyerArchetypes */

/**
 * @param {string[]} list
 * @param {string|null|undefined} archetypeId
 * @returns {string[]}
 */
function appendArchetype(list, archetypeId) {
  if (!archetypeId || list.includes(archetypeId)) {
    return list;
  }

  return [...list, archetypeId];
}

/**
 * @param {BuyerJourneyInput} input
 * @returns {ResolvedBuyerArchetypes}
 */
export function resolveBuyerArchetypes(input) {
  /** @type {string[]} */
  let primaryArchetypes = [];
  /** @type {string[]} */
  let secondaryArchetypes = [];

  primaryArchetypes = appendArchetype(
    primaryArchetypes,
    PRIORITY_TO_ARCHETYPE[input.priority]
  );

  primaryArchetypes = appendArchetype(
    primaryArchetypes,
    USAGE_TO_ARCHETYPE[input.usagePattern]
  );

  if (input.usagePattern === USAGE_PATTERNS.MIXED) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER
    );
  }

  primaryArchetypes = appendArchetype(
    primaryArchetypes,
    FAMILY_SIZE_TO_ARCHETYPE[input.familySize]
  );

  if (
    input.familySize === FAMILY_SIZES.SINGLE ||
    input.familySize === FAMILY_SIZES.COUPLE
  ) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER
    );
  }

  primaryArchetypes = appendArchetype(
    primaryArchetypes,
    CHARGING_ACCESS_TO_ARCHETYPE[input.chargingAccess]
  );

  primaryArchetypes = appendArchetype(
    primaryArchetypes,
    BUDGET_RANGE_TO_ARCHETYPE[input.budgetRange]
  );

  if (input.budgetRange === BUDGET_RANGES.RANGE_10_15L) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.CITY_COMMUTER
    );
  }

  primaryArchetypes = appendArchetype(
    primaryArchetypes,
    DAILY_DISTANCE_TO_ARCHETYPE[input.dailyDistanceRange]
  );

  if (input.dailyDistanceRange === DAILY_DISTANCE_RANGES.RANGE_30_60) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.CITY_COMMUTER
    );
  }

  if (input.priority === BUYER_PRIORITIES.EASE_OF_OWNERSHIP) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.CITY_COMMUTER
    );
  }

  if (input.priority === BUYER_PRIORITIES.VALUE) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.FAMILY_BUYER
    );
  }

  if (
    input.chargingAccess === CHARGING_ACCESS.APARTMENT_CHARGING ||
    input.chargingAccess === CHARGING_ACCESS.PUBLIC_CHARGING
  ) {
    secondaryArchetypes = appendArchetype(
      secondaryArchetypes,
      BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER
    );
  }

  secondaryArchetypes = secondaryArchetypes.filter(
    (archetypeId) => !primaryArchetypes.includes(archetypeId)
  );

  if (!primaryArchetypes.length) {
    primaryArchetypes = [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER];
  }

  return {
    primaryArchetypes,
    secondaryArchetypes,
  };
}

/**
 * @param {BuyerJourneyInput} input
 * @param {string[]} primaryArchetypes
 * @returns {string}
 */
export function resolveAnchorArchetype(input, primaryArchetypes = []) {
  if (
    input.familySize === FAMILY_SIZES.FAMILY ||
    input.familySize === FAMILY_SIZES.LARGE_FAMILY
  ) {
    return BUYER_ARCHETYPE_IDS.FAMILY_BUYER;
  }

  if (input.priority === BUYER_PRIORITIES.PREMIUM_EXPERIENCE) {
    return BUYER_ARCHETYPE_IDS.PREMIUM_BUYER;
  }

  if (input.priority === BUYER_PRIORITIES.FAMILY_PRACTICALITY) {
    return BUYER_ARCHETYPE_IDS.FAMILY_BUYER;
  }

  if (
    input.priority === BUYER_PRIORITIES.HIGHWAY_CAPABILITY ||
    input.usagePattern === USAGE_PATTERNS.HIGHWAY
  ) {
    return BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER;
  }

  if (
    input.priority === BUYER_PRIORITIES.VALUE ||
    input.priority === BUYER_PRIORITIES.RUNNING_COST
  ) {
    return BUYER_ARCHETYPE_IDS.BUDGET_BUYER;
  }

  if (input.priority === BUYER_PRIORITIES.EASE_OF_OWNERSHIP) {
    return BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER;
  }

  if (
    input.chargingAccess === CHARGING_ACCESS.APARTMENT_CHARGING ||
    input.chargingAccess === CHARGING_ACCESS.PUBLIC_CHARGING
  ) {
    return BUYER_ARCHETYPE_IDS.APARTMENT_OWNER;
  }

  if (input.usagePattern === USAGE_PATTERNS.CITY) {
    return BUYER_ARCHETYPE_IDS.CITY_COMMUTER;
  }

  return primaryArchetypes[0] || BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER;
}
