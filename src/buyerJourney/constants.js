/**
 * Buyer Journey Engine constants.
 */

import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";

export const BUYER_JOURNEY_MODULE_VERSION = "1.0.0-alpha";

/** @typedef {typeof BUDGET_RANGES[keyof typeof BUDGET_RANGES]} BudgetRangeId */
export const BUDGET_RANGES = Object.freeze({
  RANGE_10_15L: "10-15L",
  RANGE_15_20L: "15-20L",
  RANGE_20_30L: "20-30L",
  RANGE_30L_PLUS: "30L+",
});

/** @typedef {typeof DAILY_DISTANCE_RANGES[keyof typeof DAILY_DISTANCE_RANGES]} DailyDistanceRangeId */
export const DAILY_DISTANCE_RANGES = Object.freeze({
  UNDER_30: "<30",
  RANGE_30_60: "30-60",
  RANGE_60_100: "60-100",
  RANGE_100_PLUS: "100+",
});

/** @typedef {typeof FAMILY_SIZES[keyof typeof FAMILY_SIZES]} FamilySizeId */
export const FAMILY_SIZES = Object.freeze({
  SINGLE: "single",
  COUPLE: "couple",
  FAMILY: "family",
  LARGE_FAMILY: "largeFamily",
});

/** @typedef {typeof CHARGING_ACCESS[keyof typeof CHARGING_ACCESS]} ChargingAccessId */
export const CHARGING_ACCESS = Object.freeze({
  HOME_CHARGING: "homeCharging",
  APARTMENT_CHARGING: "apartmentCharging",
  PUBLIC_CHARGING: "publicCharging",
});

/** @typedef {typeof USAGE_PATTERNS[keyof typeof USAGE_PATTERNS]} UsagePatternId */
export const USAGE_PATTERNS = Object.freeze({
  CITY: "city",
  MIXED: "mixed",
  HIGHWAY: "highway",
});

/** @typedef {typeof BUYER_PRIORITIES[keyof typeof BUYER_PRIORITIES]} BuyerPriorityId */
export const BUYER_PRIORITIES = Object.freeze({
  RUNNING_COST: "runningCost",
  FAMILY_PRACTICALITY: "familyPracticality",
  HIGHWAY_CAPABILITY: "highwayCapability",
  PREMIUM_EXPERIENCE: "premiumExperience",
  VALUE: "value",
  EASE_OF_OWNERSHIP: "easeOfOwnership",
});

/** @type {BudgetRangeId[]} */
export const BUDGET_RANGE_LIST = Object.freeze(Object.values(BUDGET_RANGES));

/** @type {DailyDistanceRangeId[]} */
export const DAILY_DISTANCE_RANGE_LIST = Object.freeze(
  Object.values(DAILY_DISTANCE_RANGES)
);

/** @type {FamilySizeId[]} */
export const FAMILY_SIZE_LIST = Object.freeze(Object.values(FAMILY_SIZES));

/** @type {ChargingAccessId[]} */
export const CHARGING_ACCESS_LIST = Object.freeze(Object.values(CHARGING_ACCESS));

/** @type {UsagePatternId[]} */
export const USAGE_PATTERN_LIST = Object.freeze(Object.values(USAGE_PATTERNS));

/** @type {BuyerPriorityId[]} */
export const BUYER_PRIORITY_LIST = Object.freeze(Object.values(BUYER_PRIORITIES));

/** @type {Record<BuyerPriorityId, string>} */
export const PRIORITY_TO_ARCHETYPE = Object.freeze({
  [BUYER_PRIORITIES.RUNNING_COST]: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
  [BUYER_PRIORITIES.FAMILY_PRACTICALITY]: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
  [BUYER_PRIORITIES.HIGHWAY_CAPABILITY]: BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
  [BUYER_PRIORITIES.PREMIUM_EXPERIENCE]: BUYER_ARCHETYPE_IDS.PREMIUM_BUYER,
  [BUYER_PRIORITIES.VALUE]: BUYER_ARCHETYPE_IDS.BUDGET_BUYER,
  [BUYER_PRIORITIES.EASE_OF_OWNERSHIP]:
    BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER,
});

/** @type {Record<UsagePatternId, string>} */
export const USAGE_TO_ARCHETYPE = Object.freeze({
  [USAGE_PATTERNS.CITY]: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
  [USAGE_PATTERNS.MIXED]: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
  [USAGE_PATTERNS.HIGHWAY]: BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
});

/** @type {Record<FamilySizeId, string|null>} */
export const FAMILY_SIZE_TO_ARCHETYPE = Object.freeze({
  [FAMILY_SIZES.SINGLE]: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
  [FAMILY_SIZES.COUPLE]: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
  [FAMILY_SIZES.FAMILY]: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
  [FAMILY_SIZES.LARGE_FAMILY]: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
});

/** @type {Record<BudgetRangeId, string|null>} */
export const BUDGET_RANGE_TO_ARCHETYPE = Object.freeze({
  [BUDGET_RANGES.RANGE_10_15L]: BUYER_ARCHETYPE_IDS.BUDGET_BUYER,
  [BUDGET_RANGES.RANGE_15_20L]: null,
  [BUDGET_RANGES.RANGE_20_30L]: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
  [BUDGET_RANGES.RANGE_30L_PLUS]: BUYER_ARCHETYPE_IDS.PREMIUM_BUYER,
});

/** @type {Record<DailyDistanceRangeId, string|null>} */
export const DAILY_DISTANCE_TO_ARCHETYPE = Object.freeze({
  [DAILY_DISTANCE_RANGES.UNDER_30]: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
  [DAILY_DISTANCE_RANGES.RANGE_30_60]: null,
  [DAILY_DISTANCE_RANGES.RANGE_60_100]: BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
  [DAILY_DISTANCE_RANGES.RANGE_100_PLUS]:
    BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
});

/** @type {Record<ChargingAccessId, string|null>} */
export const CHARGING_ACCESS_TO_ARCHETYPE = Object.freeze({
  [CHARGING_ACCESS.HOME_CHARGING]: null,
  [CHARGING_ACCESS.APARTMENT_CHARGING]: BUYER_ARCHETYPE_IDS.APARTMENT_OWNER,
  [CHARGING_ACCESS.PUBLIC_CHARGING]: BUYER_ARCHETYPE_IDS.APARTMENT_OWNER,
});

/** @type {Record<string, string>} */
export const ARCHETYPE_FOCUS_LABELS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: "Regular city commuters",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: "Families",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: "Frequent highway travellers",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: "Apartment residents planning around shared charging",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: "Budget-conscious buyers",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: "Premium-oriented buyers",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: "First-time EV buyers",
});

/** @type {Record<BuyerPriorityId, string>} */
export const PRIORITY_ALTERNATIVE_HINTS = Object.freeze({
  [BUYER_PRIORITIES.PREMIUM_EXPERIENCE]:
    "Purchase value is the main priority",
  [BUYER_PRIORITIES.VALUE]: "Luxury or premium positioning is essential",
  [BUYER_PRIORITIES.RUNNING_COST]:
    "Long-distance highway travel dominates weekly usage",
  [BUYER_PRIORITIES.FAMILY_PRACTICALITY]:
    "Solo city commuting with minimal cabin needs is the priority",
  [BUYER_PRIORITIES.HIGHWAY_CAPABILITY]:
    "Most driving stays within predictable city limits",
  [BUYER_PRIORITIES.EASE_OF_OWNERSHIP]:
    "Maximum performance or luxury features matter most",
});

/** @type {Record<ChargingAccessId, string>} */
export const CHARGING_CONSIDERATIONS = Object.freeze({
  [CHARGING_ACCESS.HOME_CHARGING]:
    "Home charging supports predictable overnight top-ups.",
  [CHARGING_ACCESS.APARTMENT_CHARGING]:
    "Society or apartment charging access may need upfront planning.",
  [CHARGING_ACCESS.PUBLIC_CHARGING]:
    "Public charging availability should be mapped to weekly routes.",
});

/** @type {Record<UsagePatternId, string>} */
export const USAGE_CONSIDERATIONS = Object.freeze({
  [USAGE_PATTERNS.CITY]: "Daily routes are mostly urban and predictable.",
  [USAGE_PATTERNS.MIXED]:
    "Mixed city-highway usage rewards balanced range and charging flexibility.",
  [USAGE_PATTERNS.HIGHWAY]:
    "Regular highway travel needs confident range and fast-charging access.",
});
