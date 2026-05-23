/**
 * Catalog intelligence ops — ownership/charging realism, recommendation maturity.
 * Status: TRUSTED | GOOD | NEEDS_REVIEW | LOW_CONFIDENCE
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { auditVehicleCatalog } from "../intelligence/catalogAudit.js";
import { buildEvsavariScores } from "../intelligence/scoringEngine.js";
import {
  buildCompareScoreInsight,
  auditCompareSetCredibility,
} from "../utils/compareConfidence.js";
import { scoreCatalogHealth } from "./catalogHealthScore.js";

export const CATALOG_INTELLIGENCE_STATUS = Object.freeze({
  TRUSTED: "TRUSTED",
  GOOD: "GOOD",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
});

const WEEKLY_KEY = "evsavari-catalog-intelligence-weekly-v1";

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

export function recordCatalogIntelligenceWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getCatalogIntelligenceWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function scoreOwnershipConfidence(car, intel) {
  let pts = 40;
  if (intel?.ownership?.hasData) pts += 30;
  if (intel?.ownership?.warrantyYears) pts += 10;
  if (intel?.ownership?.serviceNetworkNote) pts += 8;
  if (car?.catalogMeta?.estimated === true) pts -= 12;
  if ((car?.catalogMeta?.dataQualityScore ?? 100) < 70) pts -= 15;
  return Math.max(0, Math.min(100, pts));
}

function scoreChargingPracticalityConfidence(car, intel) {
  let pts = 38;
  if (intel?.charging?.hasData) pts += 28;
  if (intel?.chargingPracticality?.convenienceLevelLabel) pts += 12;
  if (intel?.charging?.dcTimeMin) pts += 10;
  const apt = intel?.charging?.apartmentPracticality;
  if (apt === "limited" || apt === false) pts += 5;
  if (!intel?.charging?.hasData) pts -= 10;
  return Math.max(0, Math.min(100, pts));
}

function scoreRecommendationMaturity(car, insight) {
  let pts = 50;
  if (insight.confidence === "high") pts += 28;
  else if (insight.confidence === "medium") pts += 14;
  if (car?.catalogMeta?.governanceStatus === "published") pts += 12;
  if (car?.catalogMeta?.reviewed) pts += 8;
  if (insight.estimatedLabel) pts -= 10;
  return Math.max(0, Math.min(100, pts));
}

function scoreEstimateTransparency(car, intel) {
  let pts = 72;
  if (car?.catalogMeta?.estimated === true) pts -= 22;
  if (!intel?.range?.hasData) pts -= 12;
  if (!intel?.ownership?.hasData) pts -= 10;
  if (!intel?.charging?.hasData) pts -= 10;
  if ((car?.catalogMeta?.dataQualityScore ?? 100) < 75) pts -= 15;
  return Math.max(0, Math.min(100, pts));
}

function scoreCityHighwaySuitability(car, scores) {
  const city = scores?.subScores?.cityUsability;
  const highway = scores?.subScores?.highwayUsability;
  if (city == null && highway == null) return 0;
  const spread =
    city != null && highway != null ? Math.abs(city - highway) : 0;
  const avg =
    city != null && highway != null
      ? (city + highway) / 2
      : city ?? highway ?? 0;
  let pts = avg * 0.85;
  if (spread > 35) pts += 8;
  if (spread < 8 && avg > 60) pts -= 10;
  return Math.round(Math.max(0, Math.min(100, pts)));
}

function deriveStatus({
  ownershipConfidence,
  chargingPracticalityConfidence,
  recommendationMaturity,
  estimateTransparency,
  catalogStatus,
  issueCount,
}) {
  const avg = Math.round(
    (ownershipConfidence +
      chargingPracticalityConfidence +
      recommendationMaturity +
      estimateTransparency) /
      4
  );

  if (
    catalogStatus === "NEEDS_REVIEW" ||
    avg < 45 ||
    issueCount >= 4
  ) {
    return CATALOG_INTELLIGENCE_STATUS.LOW_CONFIDENCE;
  }
  if (
    avg < 58 ||
    ownershipConfidence < 50 ||
    chargingPracticalityConfidence < 50 ||
    estimateTransparency < 55
  ) {
    return CATALOG_INTELLIGENCE_STATUS.NEEDS_REVIEW;
  }
  if (avg >= 78 && estimateTransparency >= 70 && recommendationMaturity >= 72) {
    return CATALOG_INTELLIGENCE_STATUS.TRUSTED;
  }
  return CATALOG_INTELLIGENCE_STATUS.GOOD;
}

/**
 * @param {object} car
 */
export function scoreCatalogIntelligence(car = {}) {
  const audit = auditVehicleCatalog(car);
  const catalogHealth = scoreCatalogHealth(car, audit);
  const intel = buildVehicleIntelligence(car);
  const scores = buildEvsavariScores(car, intel);
  const insight = buildCompareScoreInsight(car);

  const ownershipConfidence = scoreOwnershipConfidence(car, intel);
  const chargingPracticalityConfidence = scoreChargingPracticalityConfidence(
    car,
    intel
  );
  const recommendationMaturity = scoreRecommendationMaturity(car, insight);
  const estimateTransparency = scoreEstimateTransparency(car, intel);
  const cityHighwaySuitability = scoreCityHighwaySuitability(car, scores);

  const flags = [];
  if (ownershipConfidence < 55) flags.push("weak_ownership_realism");
  if (chargingPracticalityConfidence < 55) flags.push("weak_charging_practicality");
  if (recommendationMaturity < 55) flags.push("low_confidence_recommendation");
  if (estimateTransparency < 60) flags.push("high_estimation_dependency");
  if (audit.freshness?.isStale) flags.push("stale_pricing_specs");
  if (cityHighwaySuitability < 50) flags.push("weak_city_highway_suitability");

  const status = deriveStatus({
    ownershipConfidence,
    chargingPracticalityConfidence,
    recommendationMaturity,
    estimateTransparency,
    catalogStatus: catalogHealth.status,
    issueCount: audit.issueCount ?? 0,
  });

  return {
    slug: car.slug || car.catalogMeta?.slug,
    name: car.name,
    status,
    ownershipConfidence,
    chargingPracticalityConfidence,
    recommendationMaturity,
    estimateTransparency,
    cityHighwaySuitability,
    compositeScore: scores.composite,
    dataQualityScore: car?.catalogMeta?.dataQualityScore,
    flags,
    catalogHealthStatus: catalogHealth.status,
    whyRecommendedHint:
      insight.confidence === "low"
        ? "Directional only — verify ownership and charging locally."
        : "Scores blend range, charging, and ownership — not paid placement.",
  };
}

/**
 * @param {object} ctx
 */
export function buildCatalogIntelligenceReport(ctx = {}) {
  const cars = ctx.cars || [];
  const rows = cars.map((car) => scoreCatalogIntelligence(car)).sort((a, b) => {
    const order = {
      [CATALOG_INTELLIGENCE_STATUS.LOW_CONFIDENCE]: 0,
      [CATALOG_INTELLIGENCE_STATUS.NEEDS_REVIEW]: 1,
      [CATALOG_INTELLIGENCE_STATUS.GOOD]: 2,
      [CATALOG_INTELLIGENCE_STATUS.TRUSTED]: 3,
    };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  const statusCounts = {
    [CATALOG_INTELLIGENCE_STATUS.TRUSTED]: 0,
    [CATALOG_INTELLIGENCE_STATUS.GOOD]: 0,
    [CATALOG_INTELLIGENCE_STATUS.NEEDS_REVIEW]: 0,
    [CATALOG_INTELLIGENCE_STATUS.LOW_CONFIDENCE]: 0,
  };
  for (const r of rows) statusCounts[r.status] += 1;

  const weakOwnership = rows.filter((r) =>
    r.flags.includes("weak_ownership_realism")
  );
  const weakCharging = rows.filter((r) =>
    r.flags.includes("weak_charging_practicality")
  );
  const lowConfidenceRecs = rows.filter((r) =>
    r.flags.includes("low_confidence_recommendation")
  );
  const highEstimation = rows.filter((r) =>
    r.flags.includes("high_estimation_dependency")
  );
  const stale = rows.filter((r) => r.flags.includes("stale_pricing_specs"));

  const trustedPct =
    rows.length > 0
      ? Math.round(
          ((statusCounts.TRUSTED + statusCounts.GOOD) / rows.length) * 100
        )
      : 0;

  const avgOwnership =
    rows.length > 0
      ? Math.round(
          rows.reduce((n, r) => n + r.ownershipConfidence, 0) / rows.length
        )
      : 0;

  const snapshot = {
    trustedPct,
    avgOwnership,
    avgCharging: Math.round(
      rows.reduce((n, r) => n + r.chargingPracticalityConfidence, 0) /
        Math.max(1, rows.length)
    ),
    needsReview: statusCounts.NEEDS_REVIEW + statusCounts.LOW_CONFIDENCE,
  };
  recordCatalogIntelligenceWeekly(snapshot);

  const comparePairs = (ctx.comparePairs || ctx.traffic?.comparePairs || []).slice(
    0,
    12
  );
  const contradictoryPairs = [];
  for (const pair of comparePairs) {
    const slug = pair.slug || pair.pairSlug;
    const vehicles = slug
      ? cars.filter((c) => {
          const s = String(c.slug || "").toLowerCase();
          return slug.split("-vs-").some((p) => s.startsWith(p));
        })
      : [];
    if (vehicles.length >= 2) {
      const cred = auditCompareSetCredibility(vehicles);
      if (cred.warnings?.length) {
        contradictoryPairs.push({ pairSlug: slug, warnings: cred.warnings });
      }
    }
  }

  return {
    rows,
    statusCounts,
    trustedPct,
    avgOwnershipConfidence: avgOwnership,
    avgChargingPracticality: snapshot.avgCharging,
    weakOwnershipRealism: weakOwnership.slice(0, 15),
    weakChargingPracticality: weakCharging.slice(0, 15),
    lowConfidenceRecommendations: lowConfidenceRecs.slice(0, 15),
    highEstimationDependency: highEstimation.slice(0, 15),
    stalePricingSpecs: stale.slice(0, 12),
    contradictoryComparePairs: contradictoryPairs.slice(0, 8),
    weeklySnapshots: getCatalogIntelligenceWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "catalog-intelligence",
      version: 1,
      generatedAt: new Date().toISOString(),
      confidenceLevel: trustedPct >= 75 ? "high" : trustedPct >= 55 ? "medium" : "low",
    },
  };
}
