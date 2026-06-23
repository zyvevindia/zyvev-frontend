/**
 * Assemble the full Score 2.0 explanation layer for a calibrated profile.
 */

import { buildConfidenceNarratives } from "./buildConfidenceNarratives.js";
import { buildNarrativeSummary } from "./buildNarrativeSummary.js";
import { buildPersonaNarratives } from "./buildPersonaNarratives.js";
import {
  buildAvoidIf,
  buildBestFor,
  buildStrengths,
  buildWeaknesses,
} from "./explanationBuilders.js";

/**
 * @param {import("./types.js").VehicleScoreProfile} profile
 * @param {object|null|undefined} intelligenceCar
 * @returns {import("./types.js").VehicleScoreProfile}
 */
export function enrichProfileExplanation(profile, intelligenceCar) {
  const personaNarratives = buildPersonaNarratives(profile);

  return {
    ...profile,
    explanation: {
      strengths: buildStrengths(profile, intelligenceCar),
      weaknesses: buildWeaknesses(profile, intelligenceCar),
      bestFor: buildBestFor(profile, intelligenceCar),
      avoidIf: buildAvoidIf(profile, intelligenceCar),
      summary: buildNarrativeSummary(profile, intelligenceCar),
      cityNarrative: personaNarratives.cityBuyer,
      familyNarrative: personaNarratives.familyBuyer,
      highwayNarrative: personaNarratives.highwayBuyer,
      budgetNarrative: personaNarratives.budgetBuyer,
      premiumNarrative: personaNarratives.premiumBuyer,
      confidenceNarratives: buildConfidenceNarratives(profile),
    },
  };
}
