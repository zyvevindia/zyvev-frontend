/**
 * Confidence narrative lines for Score 2.0 trust labels.
 */

import { CONFIDENCE_LEVELS } from "./constants.js";

/** @type {Record<import("./constants.js").ConfidenceLevel, string>} */
const CONFIDENCE_NARRATIVE_BY_LEVEL = Object.freeze({
  [CONFIDENCE_LEVELS.VERIFIED]:
    "Based primarily on verified specifications.",
  [CONFIDENCE_LEVELS.EDITORIAL]:
    "Derived from EVSavari editorial analysis.",
  [CONFIDENCE_LEVELS.ESTIMATED]:
    "Partially estimated from available data.",
});

/**
 * @param {import("./constants.js").ConfidenceLevel} level
 * @returns {string}
 */
function narrativeForConfidence(level) {
  return (
    CONFIDENCE_NARRATIVE_BY_LEVEL[level] ||
    CONFIDENCE_NARRATIVE_BY_LEVEL[CONFIDENCE_LEVELS.ESTIMATED]
  );
}

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @returns {import("./types.js").ConfidenceNarratives}
 */
export function buildConfidenceNarratives(profile) {
  const { confidence } = profile;

  return {
    overall: narrativeForConfidence(confidence.overall),
    ownership: narrativeForConfidence(confidence.ownership),
    charging: narrativeForConfidence(confidence.charging),
    highway: narrativeForConfidence(confidence.highway),
    family: narrativeForConfidence(confidence.family),
    service: narrativeForConfidence(confidence.service),
    value: narrativeForConfidence(confidence.value),
  };
}
