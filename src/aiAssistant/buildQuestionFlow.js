/**
 * Deterministic question flow for the AI Buyer Assistant.
 */

import {
  ASSISTANT_QUESTIONS,
  CONVERSATION_STAGE_ORDER,
  QUESTION_BY_STAGE,
} from "./constants.js";

/** @typedef {import("./types.js").BuyerConversationState} BuyerConversationState */
/** @typedef {import("./types.js").BuyerAnswer} BuyerAnswer */
/** @typedef {import("./types.js").QuestionFlowResult} QuestionFlowResult */

/**
 * @param {Partial<Record<string, BuyerAnswer>>} rawAnswers
 * @returns {BuyerConversationState}
 */
export function buildConversationState(rawAnswers = {}) {
  /** @type {Partial<Record<import("./types.js").ConversationStage, BuyerAnswer>>} */
  const answers = {};

  for (const question of ASSISTANT_QUESTIONS) {
    const answer =
      rawAnswers[question.stage] ||
      rawAnswers[question.id] ||
      null;

    if (answer?.optionId) {
      answers[question.stage] = {
        questionId: question.id,
        optionId: answer.optionId,
        label: answer.label || findOptionLabel(question, answer.optionId),
      };
    }
  }

  const activeStages = CONVERSATION_STAGE_ORDER.filter(
    (stage) => stage !== "complete"
  );
  const answeredCount = activeStages.filter((stage) => answers[stage]).length;
  const complete = answeredCount === activeStages.length;

  const currentStage = complete
    ? "complete"
    : activeStages.find((stage) => !answers[stage]) || "complete";

  return {
    answers,
    currentStage,
    complete,
  };
}

/**
 * @param {import("./types.js").BuyerQuestion} question
 * @param {string} optionId
 * @returns {string}
 */
function findOptionLabel(question, optionId) {
  return (
    question.options.find((option) => option.id === optionId)?.label ||
    optionId
  );
}

/**
 * @param {BuyerConversationState} state
 * @returns {QuestionFlowResult}
 */
export function buildQuestionFlow(state) {
  const activeStages = CONVERSATION_STAGE_ORDER.filter(
    (stage) => stage !== "complete"
  );
  const answeredCount = activeStages.filter(
    (stage) => state.answers[stage]
  ).length;
  const completionProgress =
    activeStages.length === 0 ? 1 : answeredCount / activeStages.length;

  if (state.complete) {
    return {
      nextQuestion: null,
      remainingQuestions: [],
      completionProgress: 1,
    };
  }

  const remainingStages = activeStages.filter(
    (stage) => !state.answers[stage]
  );
  const nextStage = remainingStages[0];
  const nextQuestion = nextStage ? QUESTION_BY_STAGE[nextStage] || null : null;
  const remainingQuestions = remainingStages
    .slice(1)
    .map((stage) => QUESTION_BY_STAGE[stage])
    .filter(Boolean);

  return {
    nextQuestion,
    remainingQuestions,
    completionProgress,
  };
}
