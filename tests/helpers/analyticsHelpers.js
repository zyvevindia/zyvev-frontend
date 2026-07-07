import { ANALYTICS_EVENTS } from "../../src/analytics/events.js";

export const ASSISTANT_INTENT_STORAGE_KEY = "evsavari_assistant_intent_v1";

export const EXPECTED_ASSISTANT_ANALYTICS_EVENTS = [
  ANALYTICS_EVENTS.ASSISTANT_STARTED,
  ANALYTICS_EVENTS.ASSISTANT_COMPLETED,
  ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_ADD,
  ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_REMOVE,
  ANALYTICS_EVENTS.ASSISTANT_VEHICLE_CLICKED,
  ANALYTICS_EVENTS.ASSISTANT_COMPARE_CLICKED,
  ANALYTICS_EVENTS.ASSISTANT_OWNERSHIP_CLICKED,
  ANALYTICS_EVENTS.ASSISTANT_RESTART,
];

/**
 * @param {import("@playwright/test").Page} page
 */
export async function readAssistantIntentSignals(page) {
  return page.evaluate((storageKey) => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }, ASSISTANT_INTENT_STORAGE_KEY);
}
