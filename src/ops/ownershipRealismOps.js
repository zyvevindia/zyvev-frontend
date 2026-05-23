/**
 * Ownership realism engine — deterministic per-EV ownership intelligence scores.
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { buildCompareScoreInsight } from "../utils/compareConfidence.js";

export const OWNERSHIP_REALISM_STATUS = Object.freeze({
  HIGHLY_SUITABLE: "HIGHLY_SUITABLE",
  SUITABLE: "SUITABLE",
  CONDITIONAL: "CONDITIONAL",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
});

const WEEKLY_KEY = "evsavari-ownership-realism-weekly-v1";

function readWeekly() {
  try {
    const raw = localStorage.getItem(WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordOwnershipRealismWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getOwnershipRealismWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function deriveStatus(scores, flags, insight) {
  const avg =
    (scores.ownershipRealismScore +
      scores.chargingPracticalityScore +
      scores.commuterSuitabilityScore +
      scores.familySuitabilityScore) /
    4;

  if (
    flags.length >= 3 ||
    insight.confidence === "low" ||
    avg < 42
  ) {
    return OWNERSHIP_REALISM_STATUS.LOW_CONFIDENCE;
  }
  if (
    flags.includes("overconfident_ownership_copy") ||
    flags.includes("unrealistic_charging_confidence") ||
    avg < 58
  ) {
    return OWNERSHIP_REALISM_STATUS.NEEDS_REVIEW;
  }
  if (avg >= 80 && flags.length === 0) {
    return OWNERSHIP_REALISM_STATUS.HIGHLY_SUITABLE;
  }
  if (avg >= 62 && flags.length <= 1) {
    return OWNERSHIP_REALISM_STATUS.SUITABLE;
  }
  return OWNERSHIP_REALISM_STATUS.CONDITIONAL;
}

function buildCaveats(car, intel, flags) {
  const caveats = [];
  const charging = intel?.charging || {};
  const prac = intel?.chargingPracticality || {};

  if (
    flags.includes("weak_apartment_practicality") ||
    prac.apartmentPracticality === "limited"
  ) {
    caveats.push("Best if home or workplace charging is available");
  }
  if (flags.includes("weak_highway_practicality")) {
    caveats.push("Frequent highway users may prefer larger battery packs");
  }
  if (
    flags.includes("weak_service_confidence") ||
    !intel?.ownership?.serviceNetworkNote
  ) {
    caveats.push("Confirm service network coverage in your city before deciding");
  }
  if (charging.convenienceScore != null && charging.convenienceScore < 55) {
    caveats.push("Public charging dependency may affect day-to-day convenience");
  }
  if (flags.includes("weak_apartment_practicality") && !charging.homeChargingSupported) {
    caveats.push("Recommended mainly for urban commuting with planned top-ups");
  }
  if (car?.catalogMeta?.estimated === true) {
    caveats.push("Running-cost figures are directional — verify on-road quote locally");
  }

  return [...new Set(caveats)].slice(0, 4);
}

/**
 * @param {object} car
 */
export function scoreOwnershipRealism(car = {}) {
  const intel = buildVehicleIntelligence(car);
  const insight = buildCompareScoreInsight(car);
  const meta = car?.catalogMeta || {};
  const suit = meta.suitabilityScores || {};
  const scores = intel?.scores?.subScores || {};
  const flags = [];

  let ownershipRealismScore = 45;
  if (intel?.ownership?.hasData) ownershipRealismScore += 28;
  if (meta.rangeReality || meta.ownershipTradeoffs) ownershipRealismScore += 10;
  if (insight.confidence === "high") ownershipRealismScore += 12;
  else if (insight.confidence === "medium") ownershipRealismScore += 6;
  if (meta.estimated === true) ownershipRealismScore -= 14;

  let chargingPracticalityScore = 40;
  if (intel?.charging?.hasData) chargingPracticalityScore += 25;
  if (intel?.chargingPracticality?.hasData) chargingPracticalityScore += 15;
  if (intel?.charging?.convenienceScore >= 65) chargingPracticalityScore += 10;
  if (intel?.charging?.homeChargingSupported) chargingPracticalityScore += 8;

  let apartmentSuitabilityScore = 50;
  if (intel?.charging?.homeChargingSupported) apartmentSuitabilityScore += 25;
  if (pracApartment(intel) === "good") apartmentSuitabilityScore += 15;
  if (pracApartment(intel) === "limited") {
    apartmentSuitabilityScore -= 18;
    flags.push("weak_apartment_practicality");
  }

  let highwayConfidenceScore = clamp(
    scores.highwayUsability ?? suit.highway ?? 55
  );
  if (highwayConfidenceScore < 50) flags.push("weak_highway_practicality");

  let serviceConfidenceScore = 55;
  if (intel?.ownership?.serviceNetworkNote) serviceConfidenceScore += 20;
  if (meta.buyerAssurance?.serviceConfidence) serviceConfidenceScore += 15;
  if (serviceConfidenceScore < 50) flags.push("weak_service_confidence");

  const commuterSuitabilityScore = clamp(scores.cityUsability ?? suit.city ?? 58);
  const familySuitabilityScore = clamp(scores.practicality ?? suit.family ?? 55);

  let firstTimeBuyerConfidence = 52;
  if (meta.buyerAssurance?.firstEVFriendly?.score >= 75) {
    firstTimeBuyerConfidence += 25;
  } else if (intel?.suitability?.hasData) {
    firstTimeBuyerConfidence += 12;
  }
  if (chargingPracticalityScore < 50 || apartmentSuitabilityScore < 45) {
    firstTimeBuyerConfidence -= 15;
  }

  const premiumOwnershipMaturity = clamp(
    (ownershipRealismScore +
      highwayConfidenceScore +
      (meta.governanceStatus === "published" ? 12 : 0)) /
      1.2
  );

  if (
    insight.confidence === "high" &&
    meta.estimated === true &&
    ownershipRealismScore > 72
  ) {
    flags.push("overconfident_ownership_copy");
  }
  if (chargingPracticalityScore > 78 && apartmentSuitabilityScore < 48) {
    flags.push("unrealistic_charging_confidence");
  }

  const normalized = {
    ownershipRealismScore: clamp(ownershipRealismScore),
    chargingPracticalityScore: clamp(chargingPracticalityScore),
    apartmentSuitabilityScore: clamp(apartmentSuitabilityScore),
    highwayConfidenceScore,
    serviceConfidenceScore: clamp(serviceConfidenceScore),
    commuterSuitabilityScore,
    familySuitabilityScore,
    firstTimeBuyerConfidence: clamp(firstTimeBuyerConfidence),
    premiumOwnershipMaturity,
  };

  const status = deriveStatus(normalized, flags, insight);
  const caveats = buildCaveats(car, intel, flags);

  return {
    slug: car.slug || meta.slug,
    name: car.name,
    status,
    ...normalized,
    flags,
    caveats,
    recommendationConfidence: insight.confidence,
    estimateTransparency: insight.estimateTransparency,
  };
}

function pracApartment(intel) {
  return intel?.chargingPracticality?.apartmentPracticality;
}

/**
 * @param {object} ctx
 */
export function buildOwnershipRealismReport(ctx = {}) {
  const cars = ctx.cars || [];
  const rows = cars.map((car) => scoreOwnershipRealism(car));

  const statusCounts = Object.fromEntries(
    Object.values(OWNERSHIP_REALISM_STATUS).map((s) => [s, 0])
  );
  for (const r of rows) statusCounts[r.status] += 1;

  const weakApartment = rows.filter((r) =>
    r.flags.includes("weak_apartment_practicality")
  );
  const weakHighway = rows.filter((r) =>
    r.flags.includes("weak_highway_practicality")
  );
  const overconfident = rows.filter((r) =>
    r.flags.includes("overconfident_ownership_copy")
  );

  const trustedPct =
    rows.length > 0
      ? Math.round(
          ((statusCounts.HIGHLY_SUITABLE + statusCounts.SUITABLE) /
            rows.length) *
            100
        )
      : 0;

  const weekly = getOwnershipRealismWeeklySnapshots();
  const prevWeekly = weekly[1];
  const weakSlugs = new Set(
    [...weakApartment, ...weakHighway].map((r) => r.slug)
  );
  const weakRealismPersistence =
    prevWeekly?.needsReview != null &&
    statusCounts.NEEDS_REVIEW + statusCounts.LOW_CONFIDENCE >=
      prevWeekly.needsReview
      ? "persistent"
      : weakSlugs.size >= 4
        ? "watch"
        : "improving";

  recordOwnershipRealismWeekly({
    trustedPct,
    avgOwnership: Math.round(
      rows.reduce((n, r) => n + r.ownershipRealismScore, 0) / Math.max(1, rows.length)
    ),
    needsReview:
      statusCounts.NEEDS_REVIEW + statusCounts.LOW_CONFIDENCE,
  });

  const ownershipGuidanceUsefulness =
    trustedPct >= 65 ? "high" : trustedPct >= 50 ? "moderate" : "building";

  const strongOwnershipRealismTrust =
    statusCounts.HIGHLY_SUITABLE + statusCounts.SUITABLE >=
    statusCounts.NEEDS_REVIEW + statusCounts.LOW_CONFIDENCE
      ? "strong"
      : "watch";

  const ownershipGuidanceClarity = ownershipGuidanceUsefulness;
  const chargingGuidanceClarity =
    weakApartment.length <= weakHighway.length + 2 ? "adequate" : "review";

  const ownershipGuidanceClarityPersistence =
    ownershipGuidanceClarity === "high" ? "persistent" : "building";

  const ownershipRealismConsistency =
    strongOwnershipRealismTrust === "strong" && weakRealismPersistence !== "persistent"
      ? "consistent"
      : "watch";

  const ownershipGuidanceReadability = ownershipGuidanceClarity;

  return {
    rows: rows.sort((a, b) => a.ownershipRealismScore - b.ownershipRealismScore),
    statusCounts,
    trustedPct,
    weakApartmentPracticality: weakApartment.slice(0, 12),
    weakHighwayPracticality: weakHighway.slice(0, 12),
    overconfidentOwnership: overconfident.slice(0, 8),
    weakRealismPersistence,
    persistentWeakRealismSlugs: [...weakSlugs].slice(0, 10),
    ownershipGuidanceUsefulness,
    strongOwnershipRealismTrust,
    ownershipRealismTrustPersistence: weakRealismPersistence,
    ownershipGuidanceClarity,
    chargingGuidanceClarity,
    ownershipGuidanceClarityPersistence,
    ownershipRealismConsistency,
    ownershipGuidanceReadability,
    weeklySnapshots: weekly,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "ownership-realism",
      version: 1,
      generatedAt: new Date().toISOString(),
      confidenceLevel: trustedPct >= 70 ? "high" : "medium",
    },
  };
}
