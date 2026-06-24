/**
 * Deterministic follow-up questions after assistant recommendations.
 */

import { buildAssistantComparePairSlug } from "./comparePairSlug.js";

/** @typedef {import("./types.js").BuyerConversationState} BuyerConversationState */
/** @typedef {import("./types.js").FollowUpQuestion} FollowUpQuestion */
/** @typedef {import("../buyerJourney/types.js").BuyerJourneyResult} BuyerJourneyResult */

/**
 * @param {BuyerConversationState} state
 * @param {BuyerJourneyResult|null} journey
 * @returns {FollowUpQuestion[]}
 */
export function buildFollowUpQuestions(state, journey) {
  if (!state?.complete || !journey?.recommendations) return [];

  /** @type {FollowUpQuestion[]} */
  const followUps = [];
  const strong = journey.recommendations.strongMatches;
  const alternatives = journey.recommendations.goodAlternatives;

  if (strong.length >= 2) {
    const [first, second] = strong;
    const compareSlug = buildAssistantComparePairSlug(
      first.vehicleSlug,
      second.vehicleSlug
    );

    followUps.push({
      id: `compare-${first.vehicleSlug}-${second.vehicleSlug}`,
      type: "compare",
      prompt: `Would you like to compare ${first.vehicleName} and ${second.vehicleName}?`,
      vehicleSlugA: first.vehicleSlug,
      vehicleSlugB: second.vehicleSlug,
    });

    if (compareSlug) {
      followUps.push({
        id: `compare-guide-${compareSlug}`,
        type: "compare",
        prompt: `See how ${first.vehicleName} and ${second.vehicleName} differ on ownership trade-offs.`,
        vehicleSlugA: first.vehicleSlug,
        vehicleSlugB: second.vehicleSlug,
      });
    }
  }

  if (strong[0]) {
    followUps.push({
      id: `ownership-cost-${strong[0].vehicleSlug}`,
      type: "ownership_cost",
      prompt: `Estimate ownership costs for ${strong[0].vehicleName}?`,
      vehicleSlug: strong[0].vehicleSlug,
    });
  }

  if (alternatives.length) {
    const names = alternatives.slice(0, 2).map((match) => match.vehicleName);
    followUps.push({
      id: "explore-alternatives",
      type: "alternatives",
      prompt: `Explore alternatives such as ${names.join(" or ")}?`,
    });
  }

  const usageAnswer = state.answers.usage?.optionId;
  if (usageAnswer === "highway" || usageAnswer === "mixed") {
    const highwayCandidate =
      strong.find((match) =>
        /seal|ioniq|ev6|kona|curvv|be-6|nexon|xuv400/i.test(match.vehicleSlug)
      ) || strong[0];

    if (highwayCandidate) {
      followUps.push({
        id: `highway-${highwayCandidate.vehicleSlug}`,
        type: "highway_suitability",
        prompt: `Understand highway suitability for ${highwayCandidate.vehicleName}?`,
        vehicleSlug: highwayCandidate.vehicleSlug,
      });
    }
  }

  followUps.push({
    id: "explore-more-evs",
    type: "explore",
    prompt: "Explore more EVs that match your brief?",
  });

  const seen = new Set();
  return followUps.filter((item) => {
    if (seen.has(item.prompt)) return false;
    seen.add(item.prompt);
    return true;
  });
}
