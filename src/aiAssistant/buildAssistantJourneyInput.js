/**
 * Map assistant conversation answers to Buyer Journey Engine input.
 */

import {
  BUDGET_ANSWER_TO_JOURNEY,
  CHARGING_ANSWER_TO_JOURNEY,
  FAMILY_ANSWER_TO_JOURNEY,
  PRIORITY_ANSWER_TO_JOURNEY,
  USAGE_ANSWER_TO_JOURNEY,
  USAGE_TO_DAILY_DISTANCE,
} from "./constants.js";

/** @typedef {import("./types.js").BuyerConversationState} BuyerConversationState */
/** @typedef {import("../buyerJourney/types.js").BuyerJourneyInput} BuyerJourneyInput */

/**
 * @param {BuyerConversationState} state
 * @returns {BuyerJourneyInput|null}
 */
export function buildAssistantJourneyInput(state) {
  if (!state?.complete) return null;

  const budgetAnswer = state.answers.budget;
  const usageAnswer = state.answers.usage;
  const familyAnswer = state.answers.family;
  const chargingAnswer = state.answers.charging;
  const priorityAnswer = state.answers.priority;

  if (
    !budgetAnswer?.optionId ||
    !usageAnswer?.optionId ||
    !familyAnswer?.optionId ||
    !chargingAnswer?.optionId ||
    !priorityAnswer?.optionId
  ) {
    return null;
  }

  const budgetRange = BUDGET_ANSWER_TO_JOURNEY[budgetAnswer.optionId];
  const usagePattern = USAGE_ANSWER_TO_JOURNEY[usageAnswer.optionId];
  const familySize = FAMILY_ANSWER_TO_JOURNEY[familyAnswer.optionId];
  const chargingAccess = CHARGING_ANSWER_TO_JOURNEY[chargingAnswer.optionId];
  const priority = PRIORITY_ANSWER_TO_JOURNEY[priorityAnswer.optionId];
  const dailyDistanceRange = USAGE_TO_DAILY_DISTANCE[usageAnswer.optionId];

  if (
    !budgetRange ||
    !usagePattern ||
    !familySize ||
    !chargingAccess ||
    !priority ||
    !dailyDistanceRange
  ) {
    return null;
  }

  return {
    budgetRange,
    dailyDistanceRange,
    familySize,
    chargingAccess,
    usagePattern,
    priority,
  };
}
