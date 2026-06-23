/**
 * Lazy buyer journey registry.
 */

import {
  buildBuyerJourney,
  buyerJourneyCacheKey,
  normalizeBuyerJourneyInput,
} from "./buildBuyerJourney.js";

/** @typedef {import("./types.js").BuyerJourneyInput} BuyerJourneyInput */
/** @typedef {import("./types.js").BuyerJourneyResult} BuyerJourneyResult */

/** @type {Map<string, BuyerJourneyResult|null>} */
const journeysByKey = new Map();

/**
 * @param {BuyerJourneyInput} input
 * @returns {BuyerJourneyResult|null}
 */
export function getBuyerJourney(input) {
  const normalized = normalizeBuyerJourneyInput(input);
  if (!normalized) return null;

  const cacheKey = buyerJourneyCacheKey(normalized);

  if (journeysByKey.has(cacheKey)) {
    return journeysByKey.get(cacheKey) || null;
  }

  const journey = buildBuyerJourney(normalized);
  journeysByKey.set(cacheKey, journey);
  return journey;
}

/**
 * @returns {BuyerJourneyResult[]}
 */
export function listBuyerJourneys() {
  return [...journeysByKey.values()].filter(Boolean);
}
