/**
 * Compare trust copy — realistic, concise recommendation language.
 */

import { buildCompareScoreInsight, auditCompareSetCredibility } from "./compareConfidence.js";
import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { scoreChargingPracticality } from "../ops/chargingPracticalityOps.js";
import { buildCompareSuitabilityInsights } from "../ops/userSuitabilityOps.js";
import { scoreOwnershipRealism } from "../ops/ownershipRealismOps.js";

/**
 * @param {object} car
 * @param {object[]} allCars
 */
export function buildWhyRecommendedSummary(car, allCars = []) {
  const insight = buildCompareScoreInsight(car);
  const meta = car?.catalogMeta || {};
  const primary =
    meta.comparePicks?.strongestAdvantageLabel ||
    meta.compareNarrative?.recommendationSummary ||
    insight.topFactors?.[0] ||
    null;

  if (primary) {
    const line = String(primary).replace(/\.$/, "");
    if (insight.confidence === "low") {
      return `${line} — a useful starting point; confirm range and charging for your routine.`;
    }
    return line;
  }

  if (insight.score != null) {
    return `Leads this compare set on overall score (${insight.score}/100) — still worth matching range and charging to your route.`;
  }

  return "Balanced on range, charging, and ownership signals — pick based on how you actually drive.";
}

export function buildChargingPracticalityNuance(car) {
  const intel = buildVehicleIntelligence(car);
  const prac = scoreChargingPracticality(car);
  if (!intel?.charging?.hasData) {
    return "Charging times and home-fit depend on your parking and local grid — check before you decide.";
  }
  const apt = intel.chargingPracticality?.apartmentPracticality;
  if (apt === "limited" || apt === false) {
    return "May depend on charging access — apartment or street parking often needs workplace or public DC.";
  }
  if (prac.chargingDependencyNote) {
    return `${prac.chargingDependencyNote}. ${prac.idealConditions || "Confirm AC access locally."}`;
  }
  return "Charging figures are typical — your daily route and tariff still shape the real experience.";
}

export function buildCompareSuitabilityLines(cars = []) {
  return buildCompareSuitabilityInsights(cars).map((i) => i.text);
}

export function buildOwnershipRealismCaveats(car) {
  const own = scoreOwnershipRealism(car);
  return own.caveats?.length ? own.caveats : [];
}

export function buildOwnershipCaveat(car) {
  const intel = buildVehicleIntelligence(car);
  if (!intel?.ownership?.hasData) {
    return "Running costs and warranty terms vary by city and trim — confirm with your dealer.";
  }
  const tco = intel.ownership?.indicativeMonthly;
  if (tco) {
    return "Running-cost estimates are indicative — insurance, tariff, and how you drive change the real bill.";
  }
  return "Ownership costs are directional — verify on-road price and service plans in your city.";
}

export function buildDrivingContextNote(cars = []) {
  const cityStrong = cars.filter(
    (c) =>
      c?.evIntelligence?.scores?.cityUsability >= 70 ||
      c?.catalogMeta?.comparePicks?.cityFriendly
  );
  const highwayStrong = cars.filter(
    (c) =>
      c?.evIntelligence?.scores?.highwayUsability >= 70 ||
      c?.catalogMeta?.comparePicks?.highwayFriendly
  );

  if (cityStrong.length === 1 && highwayStrong.length === 1) {
    return "City commutes favour different strengths than highway trips — match picks to your daily route.";
  }
  if (cityStrong.length >= 2) {
    return "This set leans city-friendly — long highway days may need more DC charging stops.";
  }
  if (highwayStrong.length >= 2) {
    return "Highway usability is relatively stronger here — city parking and AC charging still matter.";
  }
  return null;
}

/**
 * Reliability line for compare set — avoids overconfident tone.
 */
export function buildConfidenceDataNote(car) {
  const insight = buildCompareScoreInsight(car);
  const meta = car?.catalogMeta || {};
  const missing = (meta.dataQualityScore ?? 100) < 75;
  if (missing || insight.confidence === "low") {
    return "Confidence is reduced when specs are missing or still estimated.";
  }
  if (insight.confidence === "medium") {
    return "Some fields are verified; others remain directional.";
  }
  return null;
}

export function buildScoreMaturityHint(car) {
  const meta = car?.catalogMeta || {};
  if (meta.governanceStatus === "published" && meta.confidence === "high") {
    return "Mature score band — based on reviewed catalog intelligence.";
  }
  if (meta.reviewed) {
    return "Developing maturity — editorial review complete, some estimates may remain.";
  }
  return "Early maturity — treat scores as directional until catalog review.";
}

export function buildEstimatedVerifiedNuance(car) {
  const meta = car?.catalogMeta || {};
  if (meta.estimated === false && meta.confidence === "high") {
    return "Key fields verified in catalog governance.";
  }
  if (meta.estimated === true) {
    return "Includes estimated fields — confirm with OEM or dealer before deciding.";
  }
  return "Mix of verified and estimated specs — dealer quote confirms price and trim.";
}

export function buildServiceReliabilityNote(car) {
  const intel = buildVehicleIntelligence(car);
  if (intel?.ownership?.serviceNetworkNote) {
    return String(intel.ownership.serviceNetworkNote).slice(0, 160);
  }
  return "Service network coverage varies by city — confirm nearest authorized workshop.";
}

export function buildWarrantyConfidenceNote(car) {
  const intel = buildVehicleIntelligence(car);
  if (intel?.ownership?.warrantyYears) {
    return `Battery/drive unit warranty typically ${intel.ownership.warrantyYears} years — read fine print for km caps.`;
  }
  return "Warranty terms depend on trim and registration date — verify in your quote.";
}

export function buildCompareReliabilityLine(cars = []) {
  const audit = auditCompareSetCredibility(cars);
  const lowConfidence = cars.some(
    (c) =>
      c?.catalogMeta?.confidence === "low" ||
      c?.catalogMeta?.estimated === true
  );

  if (audit.warnings?.some((w) => w.code === "duplicate_strengths")) {
    return "Strength labels overlap — read range and charging for your pattern, not just headline picks.";
  }
  if (audit.warnings?.some((w) => w.code === "large_score_gap")) {
    return "Large score gap — the leader is directional; verify charging and ownership for your city.";
  }
  if (lowConfidence) {
    return "Some specs are estimated; scores cluster more loosely until catalog review completes.";
  }
  return "Scores follow published catalog rules — not paid placement. Confirm trim, charging fit, and on-road quotes with a dealer when you are ready.";
}

export function buildRecommendationClarityLine(car) {
  const insight = buildCompareScoreInsight(car);
  if (insight.confidence === "high") {
    return "Recommendation clarity is relatively strong for this compare set — still match charging and range to your routine.";
  }
  if (insight.confidence === "medium") {
    return "Recommendation clarity is moderate — read ownership and charging notes alongside headline scores; no rush to decide.";
  }
  return "Recommendation clarity is directional — verify specs, charging access, and on-road quotes before you decide.";
}
