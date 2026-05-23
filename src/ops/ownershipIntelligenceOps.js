/**
 * Ownership + charging realism scoring for premium ownership intelligence.
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { buildCompareScoreInsight } from "../utils/compareConfidence.js";
import { buildChargingPracticality } from "../intelligence/chargingPracticality.js";

/**
 * @param {object} car
 */
export function scoreOwnershipRealismForCar(car) {
  const intel = buildVehicleIntelligence(car);
  const insight = buildCompareScoreInsight(car);
  const meta = car?.catalogMeta || {};
  const issues = [];

  let maturity = 50;
  if (intel?.ownership?.hasData) maturity += 28;
  if (meta.rangeReality || meta.ownershipTradeoffs) maturity += 12;
  if (insight.confidence === "high") maturity += 10;
  else if (insight.confidence === "medium") maturity += 5;
  if (meta.estimated === true) maturity -= 12;

  const practicalityConfidence = Math.max(
    0,
    Math.min(100, maturity - (issues.length ? 8 : 0))
  );

  const nuance = Math.max(
    0,
    Math.min(
      100,
      practicalityConfidence +
        (meta.buyerAssurance ? 8 : 0) -
        (!intel?.ownership?.hasData ? 20 : 0)
    )
  );

  if (!intel?.ownership?.hasData) issues.push("missing_ownership_bundle");
  if (meta.estimated && insight.confidence !== "high") {
    issues.push("weak_ownership_confidence");
  }
  if (maturity < 55) issues.push("unrealistic_ownership_assumption_risk");

  return {
    ownershipRealismMaturity: Math.round(maturity),
    practicalityConfidence: Math.round(practicalityConfidence),
    ownershipNuanceScore: Math.round(nuance),
    issues,
    hasCityHighway: Boolean(meta.rangeReality?.citySummerKm || meta.rangeReality?.highwayKm),
    hasCommuteContext: Boolean(intel?.suitability?.hasData),
  };
}

/**
 * @param {object} car
 */
export function scoreChargingRealismForCar(car) {
  const intel = buildVehicleIntelligence(car);
  const charging = intel?.charging || {};
  const prac = buildChargingPracticality(car, charging);
  const issues = [];

  let realism = 45;
  if (charging.hasData) realism += 30;
  if (charging.homeChargingSupported) realism += 12;
  if (charging.dcMinutes != null) realism += 8;

  let maturity = realism;
  if (prac.apartmentPracticality === "limited") {
    maturity -= 5;
    issues.push("apartment_charging_limited");
  }
  if (!charging.hasData) issues.push("weak_charging_practicality");
  if (prac.fastChargePracticality === "limited" && !charging.dcMinutes) {
    issues.push("unrealistic_fast_charge_expectation");
  }
  if (charging.convenienceScore != null && charging.convenienceScore < 50) {
    issues.push("public_charging_dependency_high");
  }

  const trustConfidence = Math.max(
    0,
    Math.min(100, maturity - issues.length * 6)
  );

  return {
    chargingRealismScore: Math.round(realism),
    chargingPracticalityMaturity: Math.round(maturity),
    chargingTrustConfidence: Math.round(trustConfidence),
    issues,
    apartmentPracticality: prac.apartmentPracticality,
    overnightLabel: prac.overnightLabel,
  };
}

/**
 * Trust completeness for detail + compare surfaces.
 */
export function scoreTrustCompleteness(car) {
  const insight = buildCompareScoreInsight(car);
  const meta = car?.catalogMeta || {};
  const own = scoreOwnershipRealismForCar(car);
  const chg = scoreChargingRealismForCar(car);

  let score = 55;
  if (insight.confidence === "high") score += 20;
  else if (insight.confidence === "medium") score += 10;
  if (meta.governanceStatus === "published") score += 10;
  if (own.ownershipRealismMaturity >= 70) score += 8;
  if (chg.chargingPracticalityMaturity >= 70) score += 7;

  const recommendationMaturity =
    insight.confidence === "high"
      ? 88
      : insight.confidence === "medium"
        ? 72
        : 52;

  return {
    trustCompleteness: Math.max(0, Math.min(100, Math.round(score))),
    recommendationMaturity,
    estimatedClarity:
      meta.estimated === false ? "verified" : meta.estimated === true ? "estimated" : "mixed",
  };
}
