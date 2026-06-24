/**
 * AI Buyer Assistant registry — lazy deterministic response generation.
 */

import { getBuyerJourney } from "../buyerJourney/buyerJourneyRegistry.js";
import { buildAssistantJourneyInput } from "./buildAssistantJourneyInput.js";
import { buildAssistantRecommendations } from "./buildAssistantRecommendations.js";
import { buildFollowUpQuestions } from "./buildFollowUpQuestions.js";
import {
  buildConversationState,
  buildQuestionFlow,
} from "./buildQuestionFlow.js";
import { ASSISTANT_QUESTIONS } from "./constants.js";

/** @typedef {import("./types.js").AssistantResponse} AssistantResponse */
/** @typedef {import("./types.js").BuyerAnswer} BuyerAnswer */
/** @typedef {import("./types.js").BuyerConversationState} BuyerConversationState */

/**
 * @param {Partial<Record<string, BuyerAnswer>>} [answers]
 * @returns {BuyerConversationState}
 */
export function getConversationState(answers = {}) {
  return buildConversationState(answers);
}

/**
 * @returns {import("./types.js").BuyerQuestion[]}
 */
export function listAssistantQuestions() {
  return [...ASSISTANT_QUESTIONS];
}

/**
 * @param {Partial<Record<string, BuyerAnswer>>} [answers]
 * @returns {AssistantResponse}
 */
export function getAssistantResponse(answers = {}) {
  const state = getConversationState(answers);
  const flow = buildQuestionFlow(state);

  if (!state.complete) {
    return {
      state,
      flow,
      journey: null,
      recommendations: [],
      followUpQuestions: [],
      buckets: null,
    };
  }

  const journeyInput = buildAssistantJourneyInput(state);
  const journey = journeyInput ? getBuyerJourney(journeyInput) : null;
  const recommendations = buildAssistantRecommendations(journey);
  const followUpQuestions = buildFollowUpQuestions(state, journey);

  return {
    state,
    flow,
    journey,
    recommendations,
    followUpQuestions,
    buckets: journey?.recommendations || null,
  };
}
