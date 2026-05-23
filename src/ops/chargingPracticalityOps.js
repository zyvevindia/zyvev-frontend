/**
 * Charging practicality ops — real-world charging intelligence scoring.
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { buildChargingPracticality } from "../intelligence/chargingPracticality.js";

export const CHARGING_PRACTICALITY_STATUS = Object.freeze({
  TRUSTED: "TRUSTED",
  PRACTICAL: "PRACTICAL",
  CONDITIONAL: "CONDITIONAL",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

/**
 * @param {object} car
 */
export function scoreChargingPracticality(car = {}) {
  const intel = buildVehicleIntelligence(car);
  const charging = intel?.charging || {};
  const prac = buildChargingPracticality(car, charging);
  const flags = [];

  let acPracticality = 50;
  if (charging.homeChargingSupported) acPracticality += 30;
  if (prac.overnightSuitability === "excellent") acPracticality += 15;

  let dcPracticality = 45;
  if (charging.dcMinutes != null && charging.dcMinutes <= 45) dcPracticality += 25;
  else if (charging.dcMinutes != null) dcPracticality += 12;
  if (prac.fastChargePracticality === "excellent") dcPracticality += 15;

  let apartmentDependency = charging.homeChargingSupported ? 35 : 75;
  if (prac.apartmentPracticality === "limited") {
    apartmentDependency = 85;
    flags.push("apartment_charging_risk");
  }

  let overnightPracticality = acPracticality;
  let publicDependency = 100 - (charging.convenienceScore ?? 50);
  if (publicDependency > 70) flags.push("charging_confidence_low");

  let fastChargingConfidence = dcPracticality;
  if (prac.fastChargePracticality === "limited") {
    flags.push("weak_fast_charging_support");
    fastChargingConfidence -= 15;
  }

  const cityConvenience = Math.max(
    0,
    Math.min(100, charging.convenienceScore ?? 55)
  );

  let longTripSuitability = 50;
  if (prac.roadTripSuitability === "good") longTripSuitability = 78;
  else if (prac.roadTripSuitability === "moderate") longTripSuitability = 62;
  else {
    longTripSuitability = 42;
    if (intel?.range?.highwayRangeKm?.max >= 280) longTripSuitability = 55;
    else flags.push("unrealistic_long_trip_recommendation");
  }

  const composite = Math.round(
    (acPracticality +
      dcPracticality +
      overnightPracticality +
      fastChargingConfidence +
      cityConvenience) /
      5
  );

  let status = CHARGING_PRACTICALITY_STATUS.CONDITIONAL;
  if (composite >= 75 && flags.length === 0) {
    status = CHARGING_PRACTICALITY_STATUS.TRUSTED;
  } else if (composite >= 62) {
    status = CHARGING_PRACTICALITY_STATUS.PRACTICAL;
  } else if (composite < 48 || flags.length >= 2) {
    status = CHARGING_PRACTICALITY_STATUS.NEEDS_REVIEW;
  }

  const explanations = [];
  if (prac.overnightLabel) explanations.push(prac.overnightLabel);
  if (prac.apartmentLabel) explanations.push(prac.apartmentLabel);
  if (prac.fastChargeLabel) explanations.push(prac.fastChargeLabel);
  if (prac.roadTripLabel) explanations.push(prac.roadTripLabel);

  return {
    slug: car.slug,
    name: car.name,
    status,
    composite,
    acPracticality,
    dcPracticality,
    apartmentChargingDependency: apartmentDependency,
    overnightChargingPracticality: overnightPracticality,
    publicChargingDependency: publicDependency,
    fastChargingConfidence,
    cityChargingConvenience: cityConvenience,
    longTripChargingSuitability: longTripSuitability,
    flags,
    idealConditions: idealConditions(prac, charging),
    chargingDependencyNote: dependencyNote(charging, prac),
    explanations: explanations.slice(0, 4),
  };
}

function idealConditions(prac, charging) {
  if (charging.homeChargingSupported) {
    return "Ideal with dedicated overnight AC charging";
  }
  if (charging.convenienceScore >= 70) {
    return "Works when public DC is convenient along your routine";
  }
  return "Best with predictable charging stops — not set-and-forget";
}

function dependencyNote(charging, prac) {
  if (prac.apartmentPracticality === "limited") {
    return "Higher reliance on workplace or public DC";
  }
  if (charging.homeChargingSupported) {
    return "Lower day-to-day dependency when home AC is available";
  }
  return "Mixed home and public charging typical";
}

export function buildChargingPracticalityReport(ctx = {}) {
  const rows = (ctx.cars || []).map((car) => scoreChargingPracticality(car));
  const flagged = rows.filter((r) => r.flags.length > 0);

  return {
    rows: rows.sort((a, b) => a.composite - b.composite),
    flaggedCount: flagged.length,
    lowConfidence: rows.filter((r) => r.flags.includes("charging_confidence_low")),
    apartmentRisk: rows.filter((r) => r.flags.includes("apartment_charging_risk")),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "charging-practicality",
      version: 1,
      generatedAt: new Date().toISOString(),
    },
  };
}
