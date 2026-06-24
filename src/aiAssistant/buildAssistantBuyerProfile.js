/**
 * Human-readable buyer profile from assistant answers and journey output.
 * Read-only — no engine modifications.
 */

import { getBuyerArchetype } from "../recommendations/archetypeRegistry.js";
import { resolveAnchorArchetype } from "../buyerJourney/resolveBuyerArchetypes.js";

/** @typedef {import("./types.js").BuyerConversationState} BuyerConversationState */
/** @typedef {import("../buyerJourney/types.js").BuyerJourneyResult} BuyerJourneyResult */

/** @type {Record<string, string>} */
const USAGE_PROFILE_LABELS = Object.freeze({
  city: "City-focused driving",
  mixed: "Mixed City + Highway Usage",
  highway: "Highway-focused driving",
});

/** @type {Record<string, string>} */
const OWNERSHIP_PROFILE_LABELS = Object.freeze({
  home: "Home Charging Available",
  apartment: "Apartment / Society Charging",
  public: "Public Charging Reliance",
});

/** @type {Record<string, string>} */
const PRIORITY_PROFILE_LABELS = Object.freeze({
  running_cost: "Running Cost Focused",
  value: "Value Focused",
  family_practicality: "Family Practicality Focused",
  highway_capability: "Highway Capability Focused",
  premium_experience: "Premium Experience Focused",
});

/** @type {Record<string, string>} */
const FAMILY_PROFILE_LABELS = Object.freeze({
  single: "Solo driver profile",
  couple: "Couple household profile",
  family: "Family household profile",
  large_family: "Large family household profile",
});

/** @type {Record<string, string>} */
const BUDGET_PROFILE_LABELS = Object.freeze({
  under_15l: "Budget under ₹15L",
  range_15_20l: "Budget ₹15–20L",
  range_20_30l: "Budget ₹20–30L",
  range_30l_plus: "Budget ₹30L+",
});

/**
 * @param {BuyerConversationState} state
 * @param {BuyerJourneyResult|null} journey
 * @returns {{
 *   primaryArchetype: string,
 *   secondaryArchetype: string|null,
 *   ownershipProfile: string,
 *   usageProfile: string,
 *   priorityProfile: string,
 *   familyProfile: string,
 *   budgetProfile: string,
 *   headlineTags: string[],
 * }}
 */
export function buildAssistantBuyerProfile(state, journey) {
  const input = journey?.input || null;
  const resolved = journey?.resolvedArchetypes || {
    primaryArchetypes: [],
    secondaryArchetypes: [],
  };

  const anchorId =
    (input && resolveAnchorArchetype(input, resolved.primaryArchetypes)) ||
    resolved.primaryArchetypes[0] ||
    "";

  const primaryArchetype =
    getBuyerArchetype(anchorId)?.title ||
    getBuyerArchetype(resolved.primaryArchetypes[0])?.title ||
    "EV Buyer";

  const secondaryArchetype =
    getBuyerArchetype(resolved.secondaryArchetypes[0])?.title || null;

  const usageProfile =
    USAGE_PROFILE_LABELS[state.answers.usage?.optionId || ""] ||
    state.answers.usage?.label ||
    "Everyday driving";

  const ownershipProfile =
    OWNERSHIP_PROFILE_LABELS[state.answers.charging?.optionId || ""] ||
    state.answers.charging?.label ||
    "Charging to be planned";

  const priorityProfile =
    PRIORITY_PROFILE_LABELS[state.answers.priority?.optionId || ""] ||
    state.answers.priority?.label ||
    "Balanced priorities";

  const familyProfile =
    FAMILY_PROFILE_LABELS[state.answers.family?.optionId || ""] ||
    state.answers.family?.label ||
    "";

  const budgetProfile =
    BUDGET_PROFILE_LABELS[state.answers.budget?.optionId || ""] ||
    state.answers.budget?.label ||
    "";

  const headlineTags = [
    primaryArchetype,
    usageProfile,
    ownershipProfile,
    priorityProfile,
  ].filter(Boolean);

  return {
    primaryArchetype,
    secondaryArchetype,
    ownershipProfile,
    usageProfile,
    priorityProfile,
    familyProfile,
    budgetProfile,
    headlineTags,
  };
}
