/**
 * Detail-page ownership trust lines — practical, human tone.
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { buildChargingPracticality } from "../intelligence/chargingPracticality.js";
import { getRangeRealitySnippet } from "./ownershipReality.js";
import {
  buildEstimatedVerifiedNuance,
  buildOwnershipCaveat,
} from "./compareTrustCopy.js";

/**
 * Subtle ownership expectation line for car detail (below trust strip).
 */
export function buildDetailOwnershipExpectation(car) {
  if (!car) return null;

  const intel = buildVehicleIntelligence(car);
  const prac = buildChargingPracticality(car, intel?.charging);
  const range = getRangeRealitySnippet(car.catalogMeta);
  const lines = [];

  if (range?.city && range?.highway) {
    lines.push(
      `Planning bands: roughly ${range.city} in city-style use and ${range.highway} on highways — your route and climate still matter.`
    );
  } else if (range?.claimed) {
    lines.push(
      `Claimed range is a starting point — real-world km depends on speed, AC use, and traffic.`
    );
  }

  if (prac.apartmentLabel && prac.apartmentPracticality === "limited") {
    lines.push(prac.apartmentLabel);
  } else if (prac.overnightLabel) {
    lines.push(prac.overnightLabel);
  }

  if (!lines.length) {
    lines.push(buildOwnershipCaveat(car));
  }

  return lines.slice(0, 2).join(" ");
}

export function buildDetailTrustMaturityNote(car) {
  const nuance = buildEstimatedVerifiedNuance(car);
  return nuance ? `${nuance} Scores and costs are guides — confirm trim and on-road quote locally.` : null;
}
