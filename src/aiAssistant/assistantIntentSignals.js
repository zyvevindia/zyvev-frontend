/**
 * Assistant lead-intent signals — localStorage only, no personal data.
 */

export const ASSISTANT_INTENT_STORAGE_KEY = "evsavari_assistant_intent_v1";

/** @typedef {"exploring"|"comparing"|"shortlisting"|"ready_to_buy"} BuyerReadinessState */

/**
 * @typedef {Object} AssistantIntentSignals
 * @property {boolean} assistantStarted
 * @property {boolean} assistantCompleted
 * @property {boolean} ownershipToolUsed
 * @property {boolean} compareUsed
 * @property {boolean} reviewViewed
 * @property {number} shortlistCount
 * @property {boolean} highIntentEmitted
 * @property {string|null} updatedAt
 */

/**
 * @returns {AssistantIntentSignals}
 */
export function createEmptyIntentSignals() {
  return {
    assistantStarted: false,
    assistantCompleted: false,
    ownershipToolUsed: false,
    compareUsed: false,
    reviewViewed: false,
    shortlistCount: 0,
    highIntentEmitted: false,
    updatedAt: null,
  };
}

/**
 * @returns {AssistantIntentSignals}
 */
export function readAssistantIntentSignals() {
  if (typeof localStorage === "undefined") {
    return createEmptyIntentSignals();
  }

  try {
    const raw = localStorage.getItem(ASSISTANT_INTENT_STORAGE_KEY);
    if (!raw) {
      return createEmptyIntentSignals();
    }

    const parsed = JSON.parse(raw);
    return {
      ...createEmptyIntentSignals(),
      ...parsed,
      shortlistCount: Number(parsed.shortlistCount || 0),
    };
  } catch {
    return createEmptyIntentSignals();
  }
}

/**
 * @param {Partial<AssistantIntentSignals>} patch
 * @returns {AssistantIntentSignals}
 */
export function writeAssistantIntentSignals(patch = {}) {
  const current = readAssistantIntentSignals();
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ASSISTANT_INTENT_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

/**
 * @param {AssistantIntentSignals} signals
 * @returns {BuyerReadinessState}
 */
export function resolveBuyerReadiness(signals) {
  if (
    signals.assistantCompleted &&
    signals.ownershipToolUsed &&
    signals.reviewViewed
  ) {
    return "ready_to_buy";
  }

  if (signals.shortlistCount > 0) {
    return "shortlisting";
  }

  if (signals.compareUsed) {
    return "comparing";
  }

  return "exploring";
}

/** @type {Record<BuyerReadinessState, string>} */
export const READINESS_LABELS = Object.freeze({
  exploring: "Exploring",
  comparing: "Comparing",
  shortlisting: "Shortlisting",
  ready_to_buy: "Ready to Buy",
});

/**
 * @param {AssistantIntentSignals} signals
 * @returns {boolean}
 */
export function isHighIntentBuyer(signals) {
  return (
    signals.assistantCompleted &&
    signals.ownershipToolUsed &&
    signals.reviewViewed
  );
}

/**
 * @param {AssistantIntentSignals} signals
 * @returns {boolean}
 */
export function shouldEmitHighIntent(signals) {
  return isHighIntentBuyer(signals) && !signals.highIntentEmitted;
}
