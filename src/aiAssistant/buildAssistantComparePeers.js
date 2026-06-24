/**
 * Compare peer links for assistant recommendations (read-only compare intelligence).
 */

import { getVehicleComparisonProfile } from "../compareIntelligence/comparisonRegistry.js";
import { buildAssistantComparePairSlug } from "./comparePairSlug.js";

/** @typedef {import("../buyerJourney/types.js").BuyerJourneyResult} BuyerJourneyResult */

/**
 * @typedef {Object} AssistantComparePeer
 * @property {string} vehicleSlug
 * @property {string} vehicleName
 * @property {string} compareSlug
 * @property {string} href
 */

/**
 * @param {string} vehicleSlug
 * @param {BuyerJourneyResult|null} journey
 * @param {number} [limit]
 * @returns {AssistantComparePeer[]}
 */
export function buildAssistantComparePeers(vehicleSlug, journey, limit = 2) {
  if (!journey?.recommendations || !vehicleSlug) {
    return [];
  }

  const sourceSlug = String(vehicleSlug).trim().toLowerCase();
  const candidateMatches = [
    ...journey.recommendations.strongMatches,
    ...journey.recommendations.goodAlternatives,
    ...journey.recommendations.worthConsidering,
  ].filter((match) => match.vehicleSlug !== sourceSlug);

  /** @type {AssistantComparePeer[]} */
  const peers = [];
  const seen = new Set();

  for (const match of candidateMatches) {
    if (seen.has(match.vehicleSlug)) {
      continue;
    }

    const compareSlug = buildAssistantComparePairSlug(
      sourceSlug,
      match.vehicleSlug
    );

    if (!compareSlug) {
      continue;
    }

    const comparison = getVehicleComparisonProfile(
      sourceSlug,
      match.vehicleSlug
    );

    if (!comparison) {
      continue;
    }

    peers.push({
      vehicleSlug: match.vehicleSlug,
      vehicleName: match.vehicleName,
      compareSlug,
      href: `/compare/${compareSlug}`,
    });
    seen.add(match.vehicleSlug);

    if (peers.length >= limit) {
      break;
    }
  }

  return peers;
}

/**
 * @param {string} vehicleSlug
 * @param {BuyerJourneyResult|null} journey
 * @returns {boolean}
 */
export function shouldShowAssistantComparePeers(vehicleSlug, journey) {
  if (!journey?.recommendations) {
    return false;
  }

  const sourceSlug = String(vehicleSlug || "").trim().toLowerCase();
  const inTopBuckets = [
    ...journey.recommendations.strongMatches,
    ...journey.recommendations.goodAlternatives,
  ].some((match) => match.vehicleSlug === sourceSlug);

  return inTopBuckets;
}
