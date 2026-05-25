/**
 * Compare trust quality — beginner-friendly copy + trust scoring (5-EV cohort).
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { auditCompareVehicleQuality } from "./compareQualityAuditOps.js";
import { dedupeComparePills } from "../utils/compareConfidence.js";
import { ensureArray, safeMap } from "../utils/compareArrayUtils.js";
import { scoreComparePairQuality } from "./compareQualityOps.js";
import {
  defaultProductionizationComparePairs,
  filterProductionizationCars,
} from "./tier1ProductionizationFocus.js";

const GENERIC_PHRASES = [
  /practicality scores suggest/i,
  /confirm with the oem/i,
  /catalog intelligence incomplete/i,
  /directional/i,
];

/**
 * @param {object} car
 * @returns {{ score: number, band: string, issues: object[], warnings: object[] }}
 */
export function scoreCompareTrustQuality(car = {}) {
  const base = auditCompareVehicleQuality(car);
  let score = 100;

  score -= base.issues.length * 12;
  score -= base.warnings.length * 5;

  const intel = buildVehicleIntelligence(car);
  const lines = [
    ...(intel?.chargingPracticality?.summaryLines || []),
    ...(intel?.suitability?.insights?.map((i) => i.explanation) || []),
  ].join(" ");

  if (GENERIC_PHRASES.some((p) => p.test(lines))) {
    score -= 8;
    base.warnings.push({ code: "generic_wording_detected" });
  }

  const pills = dedupeComparePills(
    safeMap(
      car?.catalogMeta?.strongestAdvantages,
      (x) => (typeof x === "string" ? x : x?.label),
      { label: "advantages", subsystem: "compare-trust" }
    )
  );
  if (pills.length < 2) score -= 6;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const band =
    score >= 85 ? "strong" : score >= 70 ? "good" : score >= 55 ? "fair" : "needs_work";

  return { score, band, issues: base.issues, warnings: base.warnings };
}

/**
 * Detect duplicated insight phrases across cohort.
 * @param {object[]} cars
 */
export function detectDuplicatedCompareInsights(cars = []) {
  const phraseOwners = new Map();
  for (const car of cars) {
    const intel = buildVehicleIntelligence(car);
    const phrases = [
      ...(intel?.chargingPracticality?.summaryLines || []),
      ...(intel?.suitability?.insights?.map((i) => i.explanation) || []),
    ];
    for (const phrase of phrases) {
      const key = String(phrase).trim().toLowerCase().slice(0, 72);
      if (!key || key.length < 24) continue;
      if (!phraseOwners.has(key)) phraseOwners.set(key, []);
      phraseOwners.get(key).push(car.slug);
    }
  }
  return [...phraseOwners.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([phrase, slugs]) => ({ phrase, slugs }));
}

/**
 * Inconsistent charging fields across two vehicles.
 */
export function detectInconsistentChargingGuidance(cars = []) {
  const issues = [];
  for (let i = 0; i < cars.length; i += 1) {
    for (let j = i + 1; j < cars.length; j += 1) {
      const a = buildVehicleIntelligence(cars[i]);
      const b = buildVehicleIntelligence(cars[j]);
      const aHome = a?.charging?.homeChargingSupported;
      const bHome = b?.charging?.homeChargingSupported;
      if (aHome === true && bHome === false) {
        const aApt = a?.chargingPracticality?.apartmentLabel || "";
        const bApt = b?.chargingPracticality?.apartmentLabel || "";
        if (aApt && bApt && aApt === bApt) {
          issues.push({
            code: "charging_guidance_mismatch",
            slugs: [cars[i].slug, cars[j].slug],
            detail: "Same apartment copy despite different home-charging support",
          });
        }
      }
    }
  }
  return issues;
}

/**
 * @param {object[]} cars
 * @param {string[]} [pairSlugs]
 */
export function generateCompareTrustAuditReport(
  cars = [],
  pairSlugs = defaultProductionizationComparePairs()
) {
  const cohort = filterProductionizationCars(cars);
  const vehicleScores = cohort.map((car) => ({
    slug: car.slug,
    name: car.name,
    ...scoreCompareTrustQuality(car),
  }));

  const duplicates = detectDuplicatedCompareInsights(cohort);
  const chargingInconsistency = detectInconsistentChargingGuidance(cohort);

  const pairAudits = pairSlugs.map((pairSlug) => {
    const scored = scoreComparePairQuality({ pairSlug, cars: cohort });
    return {
      pairSlug,
      status: scored.status,
      issues: scored.issues,
      trustScore:
        scored.status === "STRONG"
          ? 90
          : scored.status === "ACCEPTABLE"
            ? 75
            : 55,
    };
  });

  const avgTrust =
    vehicleScores.length > 0
      ? Math.round(
          vehicleScores.reduce((s, v) => s + v.score, 0) / vehicleScores.length
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    cohort: cohort.map((c) => c.slug),
    vehicleScores,
    pairAudits,
    duplicates,
    chargingInconsistency,
    summary: {
      avgTrustScore: avgTrust,
      vehiclesNeedsWork: vehicleScores.filter((v) => v.band === "needs_work")
        .length,
      duplicatePhraseCount: duplicates.length,
      chargingInconsistencyCount: chargingInconsistency.length,
      pairsNeedingReview: pairAudits.filter((p) => p.status === "NEEDS_REVIEW")
        .length,
    },
  };
}

export function compareTrustAuditMarkdown(report) {
  const lines = [
    "# Compare trust audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Avg trust score: **${report.summary?.avgTrustScore}/100**`,
    `- Duplicate insight phrases: **${report.summary?.duplicatePhraseCount}**`,
    `- Charging inconsistencies: **${report.summary?.chargingInconsistencyCount}**`,
    "",
    "## Vehicle scores",
    "",
    "| Vehicle | Score | Band |",
    "| --- | --- | --- |",
  ];
  for (const v of report.vehicleScores || []) {
    lines.push(`| ${v.name || v.slug} | ${v.score} | ${v.band} |`);
  }
  return lines.join("\n");
}
