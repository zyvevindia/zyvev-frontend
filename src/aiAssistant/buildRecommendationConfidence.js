/**
 * Explain why assistant recommendations appeared — pure explanation, no scores.
 */

/** @typedef {import("./types.js").BuyerConversationState} BuyerConversationState */

/**
 * @param {BuyerConversationState} state
 * @returns {{ intro: string, reasons: string[] }}
 */
export function buildRecommendationConfidence(state) {
  /** @type {string[]} */
  const reasons = [];

  const charging = state.answers.charging?.optionId;
  const usage = state.answers.usage?.optionId;
  const family = state.answers.family?.optionId;
  const priority = state.answers.priority?.optionId;
  const budget = state.answers.budget?.optionId;

  if (charging === "home") {
    reasons.push("Have home charging");
  }
  if (charging === "apartment") {
    reasons.push("Charge via apartment or society access");
  }
  if (charging === "public") {
    reasons.push("Rely on public charging networks");
  }

  if (priority === "value") {
    reasons.push("Prioritise value");
  }
  if (priority === "running_cost") {
    reasons.push("Prioritise running cost");
  }
  if (priority === "family_practicality") {
    reasons.push("Need family practicality");
  }
  if (priority === "highway_capability") {
    reasons.push("Need highway capability");
  }
  if (priority === "premium_experience") {
    reasons.push("Want a premium experience");
  }

  if (family === "family" || family === "large_family") {
    reasons.push("Need space for family travel");
  }

  if (usage === "mixed") {
    reasons.push("Drive mixed city/highway routes");
  }
  if (usage === "city") {
    reasons.push("Mostly drive in the city");
  }
  if (usage === "highway") {
    reasons.push("Travel on highways regularly");
  }

  if (budget === "under_15l") {
    reasons.push("Shopping in the under ₹15L band");
  }
  if (budget === "range_30l_plus") {
    reasons.push("Shopping in the ₹30L+ band");
  }

  const deduped = [...new Set(reasons.map((line) => line.trim()).filter(Boolean))];

  return {
    intro: "Because you:",
    reasons: deduped.slice(0, 6),
  };
}
