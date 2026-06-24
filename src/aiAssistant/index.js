/**
 * EVSavari AI Buyer Assistant — public exports.
 */

export {
  AI_ASSISTANT_MODULE_VERSION,
  ASSISTANT_QUESTIONS,
  CONVERSATION_STAGE_ORDER,
  QUESTION_BY_STAGE,
} from "./constants.js";

export {
  buildConversationState,
  buildQuestionFlow,
} from "./buildQuestionFlow.js";

export { buildAssistantJourneyInput } from "./buildAssistantJourneyInput.js";

export {
  buildAssistantRecommendations,
  buildPrimaryAssistantRecommendation,
  groupAssistantRecommendationsByBucket,
} from "./buildAssistantRecommendations.js";

export { buildAssistantComparePeers, shouldShowAssistantComparePeers } from "./buildAssistantComparePeers.js";

export { resolveAssistantVehicleDisplay } from "./resolveAssistantVehicleDisplay.js";

export {
  buildHeadlineVariations,
  selectAssistantHeadline,
} from "./buildHeadlineVariations.js";

export {
  buildSummaryVariations,
  selectAssistantSummary,
} from "./buildSummaryVariations.js";

export { buildFollowUpQuestions } from "./buildFollowUpQuestions.js";

export {
  getAssistantResponse,
  getConversationState,
  listAssistantQuestions,
} from "./assistantRegistry.js";
