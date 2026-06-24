/**
 * What matters most for the buyer profile — derived from archetypes, no scores.
 */

import { getBuyerArchetype } from "../recommendations/archetypeRegistry.js";
import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";

/** @typedef {import("../buyerJourney/types.js").BuyerJourneyResult} BuyerJourneyResult */

/** @type {Record<string, string>} */
const ARCHETYPE_INSIGHT_LABELS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: "Running cost",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: "Family practicality",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: "Highway usability",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: "Charging convenience",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: "Purchase value",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: "Premium experience",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: "Ease of ownership",
});

/** @type {Record<string, string>} */
const PRIORITY_INSIGHT_LABELS = Object.freeze({
  runningCost: "Running cost",
  value: "Purchase value",
  familyPracticality: "Family practicality",
  highwayCapability: "Highway usability",
  premiumExperience: "Premium experience",
  easeOfOwnership: "Ease of ownership",
});

/**
 * @param {BuyerJourneyResult|null} journey
 * @returns {string[]}
 */
export function buildProfileInsights(journey) {
  if (!journey) {
    return [];
  }

  /** @type {string[]} */
  const insights = [];
  const seen = new Set();

  const addInsight = (label) => {
    const cleaned = String(label || "").trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    insights.push(cleaned);
  };

  const priorityInsight = PRIORITY_INSIGHT_LABELS[journey.input?.priority];
  if (priorityInsight) {
    addInsight(priorityInsight);
  }

  const archetypeIds = [
    ...(journey.resolvedArchetypes?.primaryArchetypes || []),
    ...(journey.resolvedArchetypes?.secondaryArchetypes || []),
  ];

  for (const archetypeId of archetypeIds) {
    const label =
      ARCHETYPE_INSIGHT_LABELS[archetypeId] ||
      getBuyerArchetype(archetypeId)?.priority;
    addInsight(label);
  }

  return insights.slice(0, 5);
}
