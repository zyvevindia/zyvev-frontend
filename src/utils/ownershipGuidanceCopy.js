/**
 * Practical ownership guidance copy — directional, human tone.
 */

import { scoreOwnershipRealism } from "../ops/ownershipRealismOps.js";
import { scoreChargingPracticality } from "../ops/chargingPracticalityOps.js";
import { scoreVehicleSuitabilityProfiles } from "../ops/userSuitabilityOps.js";

/**
 * @param {object} car
 */
export function buildOwnershipGuidance(car = {}) {
  const own = scoreOwnershipRealism(car);
  const chg = scoreChargingPracticality(car);
  const profiles = scoreVehicleSuitabilityProfiles(car);

  const worksBestWhen = [];
  const considerIf = [];
  const lessIdealFor = [];
  const goodFitFor = [];

  if (own.commuterSuitabilityScore >= 68) {
    worksBestWhen.push("Best suited for city-focused daily commuting");
  }
  if (chg.overnightChargingPracticality >= 70) {
    worksBestWhen.push("Works best when overnight home charging is realistic for you");
  }
  if (chg.apartmentChargingDependency >= 70) {
    worksBestWhen.push("May depend on charging access — plan workplace or public top-ups");
  }
  if (own.highwayConfidenceScore >= 70) {
    worksBestWhen.push("Works well when highway legs are occasional, not daily");
  }

  if (own.apartmentSuitabilityScore < 50) {
    considerIf.push("Consider this if you have workplace or society AC access");
  } else {
    considerIf.push("Consider this if your weekly km stay within published range bands");
  }
  if (own.firstTimeBuyerConfidence >= 65) {
    considerIf.push("Consider this if you want a straightforward first EV transition");
  }

  if (own.highwayConfidenceScore < 50) {
    lessIdealFor.push(
      "Frequent highway drivers may prefer a larger battery and faster DC"
    );
  }
  if (own.apartmentSuitabilityScore < 45) {
    lessIdealFor.push("Less ideal when you depend only on street parking without AC");
  }
  if (chg.flags?.includes("unrealistic_long_trip_recommendation")) {
    lessIdealFor.push("Less ideal as a primary road-trip car without charging planning");
  }

  for (const p of profiles.topProfiles?.slice(0, 2) || []) {
    if (p.fitScore >= 62) {
      goodFitFor.push(`Good fit for ${p.profileLabel.toLowerCase()} patterns`);
    }
  }

  return {
    worksBestWhen: [...new Set(worksBestWhen)].slice(0, 3),
    considerIf: [...new Set(considerIf)].slice(0, 2),
    lessIdealFor: [...new Set(lessIdealFor)].slice(0, 2),
    goodFitFor: [...new Set(goodFitFor)].slice(0, 2),
    ownershipPracticality:
      own.caveats?.[0] ||
      "Ownership practicality is directional — use it to narrow choices, then confirm service and warranty locally.",
    chargingPracticality:
      chg.chargingDependencyNote ||
      chg.idealConditions ||
      "Charging depends on your parking setup — read home and society options before deciding.",
    caveats: own.caveats || [],
    status: own.status,
    generatedAt: new Date().toISOString(),
  };
}
