/**
 * EVSavari AI Buyer Assistant — domain type definitions.
 *
 * Deterministic intelligence layer only — no LLM, no chat UI contract.
 */

/**
 * @typedef {"budget"|"usage"|"family"|"charging"|"priority"|"complete"} ConversationStage
 */

/**
 * @typedef {Object} BuyerQuestionOption
 * @property {string} id
 * @property {string} label
 */

/**
 * @typedef {Object} BuyerQuestion
 * @property {string} id
 * @property {ConversationStage} stage
 * @property {string} prompt
 * @property {BuyerQuestionOption[]} options
 */

/**
 * @typedef {Object} BuyerAnswer
 * @property {string} questionId
 * @property {string} optionId
 * @property {string} label
 */

/**
 * @typedef {Object} BuyerConversationState
 * @property {Partial<Record<ConversationStage, BuyerAnswer>>} answers
 * @property {ConversationStage} currentStage
 * @property {boolean} complete
 */

/**
 * @typedef {Object} QuestionFlowResult
 * @property {BuyerQuestion|null} nextQuestion
 * @property {BuyerQuestion[]} remainingQuestions
 * @property {number} completionProgress
 */

/**
 * @typedef {Object} AssistantRecommendation
 * @property {string} vehicleSlug
 * @property {string} vehicleName
 * @property {string} headline
 * @property {string} summary
 * @property {string[]} whyMatches
 * @property {string[]} tradeOffs
 * @property {"High"|"Medium"|"Low"} confidence
 * @property {"strongMatches"|"goodAlternatives"|"worthConsidering"|"weakFits"} bucket
 */

/**
 * @typedef {"compare"|"ownership_cost"|"alternatives"|"highway_suitability"|"explore"} FollowUpQuestionType
 */

/**
 * @typedef {Object} FollowUpQuestion
 * @property {string} id
 * @property {FollowUpQuestionType} type
 * @property {string} prompt
 * @property {string} [vehicleSlugA]
 * @property {string} [vehicleSlugB]
 * @property {string} [vehicleSlug]
 */

/**
 * @typedef {Object} AssistantResponse
 * @property {BuyerConversationState} state
 * @property {QuestionFlowResult} flow
 * @property {import("../buyerJourney/types.js").BuyerJourneyResult|null} journey
 * @property {AssistantRecommendation[]} recommendations
 * @property {FollowUpQuestion[]} followUpQuestions
 * @property {import("../buyerJourney/types.js").BuyerRecommendationBuckets|null} buckets
 */

export {};
