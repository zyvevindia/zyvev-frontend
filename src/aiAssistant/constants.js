/**
 * AI Buyer Assistant constants — question definitions and answer mappings.
 */

import {
  BUDGET_RANGES,
  BUYER_PRIORITIES,
  CHARGING_ACCESS,
  DAILY_DISTANCE_RANGES,
  FAMILY_SIZES,
  USAGE_PATTERNS,
} from "../buyerJourney/constants.js";

export const AI_ASSISTANT_MODULE_VERSION = "1.0.0-alpha";

/** @typedef {import("./types.js").ConversationStage} ConversationStage */

/** @type {ConversationStage[]} */
export const CONVERSATION_STAGE_ORDER = Object.freeze([
  "budget",
  "usage",
  "family",
  "charging",
  "priority",
  "complete",
]);

/** @type {Record<string, import("../buyerJourney/constants.js").BudgetRangeId>} */
export const BUDGET_ANSWER_TO_JOURNEY = Object.freeze({
  under_15l: BUDGET_RANGES.RANGE_10_15L,
  range_15_20l: BUDGET_RANGES.RANGE_15_20L,
  range_20_30l: BUDGET_RANGES.RANGE_20_30L,
  range_30l_plus: BUDGET_RANGES.RANGE_30L_PLUS,
});

/** @type {Record<string, import("../buyerJourney/constants.js").UsagePatternId>} */
export const USAGE_ANSWER_TO_JOURNEY = Object.freeze({
  city: USAGE_PATTERNS.CITY,
  mixed: USAGE_PATTERNS.MIXED,
  highway: USAGE_PATTERNS.HIGHWAY,
});

/** @type {Record<string, import("../buyerJourney/constants.js").FamilySizeId>} */
export const FAMILY_ANSWER_TO_JOURNEY = Object.freeze({
  single: FAMILY_SIZES.SINGLE,
  couple: FAMILY_SIZES.COUPLE,
  family: FAMILY_SIZES.FAMILY,
  large_family: FAMILY_SIZES.LARGE_FAMILY,
});

/** @type {Record<string, import("../buyerJourney/constants.js").ChargingAccessId>} */
export const CHARGING_ANSWER_TO_JOURNEY = Object.freeze({
  home: CHARGING_ACCESS.HOME_CHARGING,
  apartment: CHARGING_ACCESS.APARTMENT_CHARGING,
  public: CHARGING_ACCESS.PUBLIC_CHARGING,
});

/** @type {Record<string, import("../buyerJourney/constants.js").BuyerPriorityId>} */
export const PRIORITY_ANSWER_TO_JOURNEY = Object.freeze({
  running_cost: BUYER_PRIORITIES.RUNNING_COST,
  value: BUYER_PRIORITIES.VALUE,
  family_practicality: BUYER_PRIORITIES.FAMILY_PRACTICALITY,
  highway_capability: BUYER_PRIORITIES.HIGHWAY_CAPABILITY,
  premium_experience: BUYER_PRIORITIES.PREMIUM_EXPERIENCE,
});

/**
 * Infer daily distance from usage when the assistant does not ask directly.
 * @type {Record<string, import("../buyerJourney/constants.js").DailyDistanceRangeId>}
 */
export const USAGE_TO_DAILY_DISTANCE = Object.freeze({
  city: DAILY_DISTANCE_RANGES.UNDER_30,
  mixed: DAILY_DISTANCE_RANGES.RANGE_30_60,
  highway: DAILY_DISTANCE_RANGES.RANGE_60_100,
});

/** @type {import("./types.js").BuyerQuestion[]} */
export const ASSISTANT_QUESTIONS = Object.freeze([
  {
    id: "budget",
    stage: "budget",
    prompt: "What is your budget range?",
    options: [
      { id: "under_15l", label: "<15L" },
      { id: "range_15_20l", label: "15–20L" },
      { id: "range_20_30l", label: "20–30L" },
      { id: "range_30l_plus", label: "30L+" },
    ],
  },
  {
    id: "usage",
    stage: "usage",
    prompt: "How do you expect to use the EV most?",
    options: [
      { id: "city", label: "City" },
      { id: "mixed", label: "Mixed" },
      { id: "highway", label: "Highway" },
    ],
  },
  {
    id: "family",
    stage: "family",
    prompt: "Who will typically travel in the car?",
    options: [
      { id: "single", label: "Single" },
      { id: "couple", label: "Couple" },
      { id: "family", label: "Family" },
      { id: "large_family", label: "Large Family" },
    ],
  },
  {
    id: "charging",
    stage: "charging",
    prompt: "What charging access do you have?",
    options: [
      { id: "home", label: "Home" },
      { id: "apartment", label: "Apartment" },
      { id: "public", label: "Public" },
    ],
  },
  {
    id: "priority",
    stage: "priority",
    prompt: "What matters most to you?",
    options: [
      { id: "running_cost", label: "Running Cost" },
      { id: "value", label: "Value" },
      { id: "family_practicality", label: "Family Practicality" },
      { id: "highway_capability", label: "Highway Capability" },
      { id: "premium_experience", label: "Premium Experience" },
    ],
  },
]);

/** @type {Record<ConversationStage, import("./types.js").BuyerQuestion>} */
export const QUESTION_BY_STAGE = Object.freeze(
  Object.fromEntries(ASSISTANT_QUESTIONS.map((question) => [question.stage, question]))
);
