/**
 * Buyer journey guidance — who to focus on and when to look elsewhere.
 */

import { getBuyerArchetype } from "../recommendations/archetypeRegistry.js";
import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";
import {
  ARCHETYPE_FOCUS_LABELS,
  BUDGET_RANGES,
  CHARGING_CONSIDERATIONS,
  PRIORITY_ALTERNATIVE_HINTS,
  USAGE_CONSIDERATIONS,
  USAGE_PATTERNS,
} from "./constants.js";
import { resolveBuyerArchetypes } from "./resolveBuyerArchetypes.js";

/** @typedef {import("./types.js").BuyerJourneyInput} BuyerJourneyInput */
/** @typedef {import("./types.js").BuyerJourneyGuidance} BuyerJourneyGuidance */
/** @typedef {import("./types.js").BuyerRecommendationBuckets} BuyerRecommendationBuckets */

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function dedupeLines(lines = []) {
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const cleaned = String(line || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {string} archetypeId
 * @returns {string}
 */
function focusLabelForArchetype(archetypeId) {
  return (
    ARCHETYPE_FOCUS_LABELS[archetypeId] ||
    getBuyerArchetype(archetypeId)?.title ||
    archetypeId
  );
}

/**
 * @param {{
 *   input: BuyerJourneyInput,
 *   recommendations: BuyerRecommendationBuckets,
 * }} params
 * @returns {BuyerJourneyGuidance}
 */
export function buildBuyerJourneyGuidance({ input, recommendations }) {
  const resolved = resolveBuyerArchetypes(input);

  /** @type {string[]} */
  const whoShouldFocus = resolved.primaryArchetypes
    .map((archetypeId) => focusLabelForArchetype(archetypeId))
    .slice(0, 4);

  if (input.usagePattern === USAGE_PATTERNS.MIXED) {
    whoShouldFocus.push("Mixed city-highway users");
  }

  /** @type {string[]} */
  const whoMayWantAlternatives = [];

  const alternativeHint = PRIORITY_ALTERNATIVE_HINTS[input.priority];
  if (alternativeHint) {
    whoMayWantAlternatives.push(alternativeHint);
  }

  if (
    input.chargingAccess !== "homeCharging" &&
    recommendations.strongMatches.length === 0
  ) {
    whoMayWantAlternatives.push(
      "Reliable home or workplace charging becomes available"
    );
  }

  if (input.budgetRange === BUDGET_RANGES.RANGE_30L_PLUS) {
    whoMayWantAlternatives.push("A lower purchase budget becomes the priority");
  } else {
    whoMayWantAlternatives.push("Luxury is a priority");
  }

  if (input.usagePattern === USAGE_PATTERNS.HIGHWAY) {
    whoMayWantAlternatives.push(
      "Most journeys stay within short urban distances"
    );
  } else {
    whoMayWantAlternatives.push(
      "Long-distance charging convenience is critical"
    );
  }

  /** @type {string[]} */
  const keyConsiderations = [
    CHARGING_CONSIDERATIONS[input.chargingAccess],
    USAGE_CONSIDERATIONS[input.usagePattern],
  ];

  if (resolved.primaryArchetypes.includes(BUYER_ARCHETYPE_IDS.APARTMENT_OWNER)) {
    keyConsiderations.push(
      "Confirm society permissions and billing before shortlisting."
    );
  }

  if (resolved.primaryArchetypes.includes(BUYER_ARCHETYPE_IDS.PREMIUM_BUYER)) {
    keyConsiderations.push(
      "Premium EVs reward buyers who value refinement and long-distance comfort."
    );
  }

  if (recommendations.weakFits.length > recommendations.strongMatches.length) {
    keyConsiderations.push(
      "Several tier-1 options are weak fits — narrow the list using charging access and daily distance first."
    );
  }

  return {
    whoShouldFocus: dedupeLines(whoShouldFocus),
    whoMayWantAlternatives: dedupeLines(whoMayWantAlternatives).slice(0, 4),
    keyConsiderations: dedupeLines(keyConsiderations).slice(0, 4),
  };
}
