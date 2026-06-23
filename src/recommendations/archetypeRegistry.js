import { BUYER_ARCHETYPES } from "./archetypes.js";

/** @type {Map<string, import("./types.js").BuyerArchetype>} */
const ARCHETYPE_BY_ID = new Map(
  BUYER_ARCHETYPES.map((archetype) => [archetype.id, archetype])
);

/**
 * @param {string} id
 * @returns {import("./types.js").BuyerArchetype|null}
 */
export function getBuyerArchetype(id) {
  const normalizedId = String(id || "").trim().toLowerCase();
  if (!normalizedId) return null;

  return ARCHETYPE_BY_ID.get(normalizedId) || null;
}

/**
 * @returns {import("./types.js").BuyerArchetype[]}
 */
export function listBuyerArchetypes() {
  return [...BUYER_ARCHETYPES];
}
