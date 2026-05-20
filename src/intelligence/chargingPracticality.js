import { CHARGING_SPEED_CATEGORY } from "./constants.js";
import { isPresent, UNAVAILABLE } from "./governance.js";
import { CONFIDENCE_LEVELS } from "./constants.js";

/**
 * Deterministic charging practicality — no fake charger counts.
 * @param {object} car
 * @param {object} chargingIntel from buildChargingIntelligence
 */
export function buildChargingPracticality(car, chargingIntel = null) {
  const meta = car?.catalogMeta || {};
  const charging = chargingIntel || {};
  const prac = meta.chargingPracticality || {};

  const home = charging.homeChargingSupported === true;
  const dcMin = charging.dcMinutes;
  const speed = charging.speedCategory;
  const convenience = charging.convenienceScore;

  let overnightSuitability = UNAVAILABLE;
  let overnightLabel = UNAVAILABLE;
  if (home === true) {
    overnightSuitability = "excellent";
    overnightLabel =
      "Excellent for overnight home AC charging (dedicated point required)";
  } else if (isPresent(charging.acChargingTime)) {
    overnightSuitability = "moderate";
    overnightLabel =
      "Overnight charging possible where AC access is available";
  } else {
    overnightSuitability = "limited";
    overnightLabel =
      "Overnight home charging unclear — confirm AC access with dealer";
  }

  let apartmentPracticality = UNAVAILABLE;
  let apartmentLabel = UNAVAILABLE;
  if (home === true) {
    apartmentPracticality =
      convenience >= 65 ? "good" : "moderate";
    apartmentLabel =
      "Apartment charging may work with society/RWA approval for an AC point";
  } else {
    apartmentPracticality = "limited";
    apartmentLabel =
      "Apartment charging likely relies on workplace or public DC — plan weekly top-ups";
  }

  let fastChargePracticality = UNAVAILABLE;
  let fastChargeLabel = UNAVAILABLE;
  if (
    speed === CHARGING_SPEED_CATEGORY.ULTRA ||
    speed === CHARGING_SPEED_CATEGORY.FAST
  ) {
    fastChargePracticality = "excellent";
    fastChargeLabel = "Fast-charge friendly for highway and road-trip stops";
  } else if (speed === CHARGING_SPEED_CATEGORY.MODERATE) {
    fastChargePracticality = "good";
    fastChargeLabel = "Moderate DC speeds — allow extra time on long trips";
  } else if (isPresent(dcMin)) {
    fastChargePracticality = "limited";
    fastChargeLabel = "Slower DC charging — less ideal for frequent highway use";
  }

  let roadTripSuitability = UNAVAILABLE;
  let roadTripLabel = UNAVAILABLE;
  if (fastChargePracticality === "excellent") {
    roadTripSuitability = "good";
    roadTripLabel =
      "Road-trip viable with mapped DC stops — verify network along your route";
  } else if (fastChargePracticality === "good") {
    roadTripSuitability = "moderate";
    roadTripLabel =
      "Road trips feasible with planned charging stops — not as seamless as ultra-fast DC";
  } else {
    roadTripSuitability = "limited";
    roadTripLabel =
      "Long road trips need careful route planning around charging stops";
  }

  let convenienceLevel = UNAVAILABLE;
  if (isPresent(convenience)) {
    if (convenience >= 80) convenienceLevel = "high";
    else if (convenience >= 60) convenienceLevel = "medium";
    else convenienceLevel = "low";
  }

  const summaryLines = [
    overnightLabel,
    apartmentLabel,
    fastChargeLabel,
    roadTripLabel,
  ].filter((l) => l && l !== UNAVAILABLE);

  const curatedNote = prac.summary || null;

  const hasData = summaryLines.length > 0;

  return {
    overnightSuitability,
    overnightLabel,
    apartmentPracticality,
    apartmentLabel,
    fastChargePracticality,
    fastChargeLabel,
    roadTripSuitability,
    roadTripLabel,
    convenienceLevel,
    convenienceLevelLabel:
      convenienceLevel === "high"
        ? "High charging convenience"
        : convenienceLevel === "medium"
          ? "Moderate charging convenience"
          : convenienceLevel === "low"
            ? "Limited charging convenience"
            : UNAVAILABLE,
    summaryLines,
    curatedNote,
    confidenceLevel:
      prac.reviewed || meta.intelligenceCuration?.reviewed
        ? CONFIDENCE_LEVELS.HIGH
        : CONFIDENCE_LEVELS.MEDIUM,
    estimated: true,
    hasData,
  };
}
