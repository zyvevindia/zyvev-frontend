import { BUYER_ARCHETYPE_IDS } from "./constants.js";

/** @type {Record<string, string>} */
const ARCHETYPE_NARRATIVES = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]:
    "Designed for buyers whose usage is primarily urban and predictable.",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]:
    "Built for households that need everyday practicality, space, and dependable family use.",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]:
    "Intended for drivers who regularly cover long distances and need dependable charging support.",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]:
    "Suited to buyers who cannot rely on easy home charging and must plan around shared or public options.",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]:
    "Focused on buyers who want strong purchase value without unnecessary cost.",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]:
    "Aimed at buyers who prioritise luxury, performance, and a refined ownership experience.",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]:
    "Helpful for buyers new to EV ownership who want a straightforward, low-friction transition.",
});

/**
 * @param {import("./types.js").BuyerArchetype|null|undefined} archetype
 * @returns {string}
 */
export function buildArchetypeNarrative(archetype) {
  if (!archetype?.id) return "";

  return (
    ARCHETYPE_NARRATIVES[archetype.id] ||
    `Relevant for buyers prioritising ${archetype.priority.toLowerCase()}.`
  );
}
