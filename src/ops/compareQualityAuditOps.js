/**
 * Compare quality audit — explanations, completeness, consistency (no UI/scoring changes).
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import {
  auditCompareSetCredibility,
  buildCompareScoreInsight,
} from "../utils/compareConfidence.js";
import { scoreComparePairQuality } from "./compareQualityOps.js";
import { ensureArray } from "../utils/compareArrayUtils.js";
import { isPresent } from "../intelligence/governance.js";

const JARGON_PATTERNS = [
  /composite score blends/i,
  /governance supports/i,
  /directional — specs may be estimated/i,
];

import { softenCompareExplanation } from "../utils/compareReadability.js";

/**
 * @param {object} car
 */
export function auditCompareVehicleQuality(car = {}) {
  const slug = car?.slug || "unknown";
  const intel = buildVehicleIntelligence(car);
  const scoreInsight = buildCompareScoreInsight(car);
  const issues = [];
  const warnings = [];

  const whyLines = ensureArray(scoreInsight.whyLines, {
    label: "whyLines",
    subsystem: "compare-quality-audit",
  }).map(softenCompareExplanation);

  for (const line of scoreInsight.whyLines || []) {
    if (JARGON_PATTERNS.some((p) => p.test(line))) {
      warnings.push({ code: "dense_wording", detail: line.slice(0, 80) });
    }
  }

  if (!intel?.charging?.hasData) {
    issues.push({ code: "missing_charging_intel", field: "charging" });
  }
  if (!intel?.chargingPracticality?.hasData) {
    issues.push({
      code: "empty_charging_practicality",
      field: "chargingPracticality",
    });
  }
  if (!intel?.suitability?.hasData) {
    issues.push({ code: "empty_suitability", field: "suitability" });
  }

  const prac = intel?.chargingPracticality;
  if (prac?.apartmentLabel === "Unavailable" || !isPresent(prac?.apartmentLabel)) {
    warnings.push({ code: "weak_apartment_guidance" });
  }
  if (!isPresent(prac?.roadTripLabel)) {
    warnings.push({ code: "weak_highway_guidance" });
  }

  const suit = intel?.suitability;
  const cityInsight = suit?.insights?.find((i) => i.id === "city_commute");
  if (!cityInsight?.explanation) {
    warnings.push({ code: "weak_city_usage_copy" });
  }

  const specs = car?.specifications || {};
  if (!isPresent(specs.chargingTime) && !intel?.charging?.dcFastChargingTime) {
    issues.push({ code: "missing_charging_spec" });
  }

  return {
    slug,
    name: car?.name,
    issues,
    warnings,
    softenedExplanations: whyLines,
    scoreConfidence: scoreInsight.confidence,
  };
}

/**
 * @param {object[]} cars
 * @param {string[]} [pairSlugs]
 */
export function generateCompareQualityReport(cars = [], pairSlugs = []) {
  const vehicleAudits = cars.map(auditCompareVehicleQuality);
  const pairs = pairSlugs.length
    ? pairSlugs
    : buildDefaultComparePairs(cars);

  const pairAudits = pairs.map((pairSlug) => {
    const scored = scoreComparePairQuality({ pairSlug, cars });
    const vehicles = pairSlug.includes("-vs-")
      ? pairSlug.split("-vs-").map((p) => p.trim())
      : [pairSlug];
    const matched = cars.filter((c) =>
      vehicles.some(
        (v) =>
          String(c.slug).toLowerCase() === v ||
          String(c.slug).toLowerCase().startsWith(`${v}-`)
      )
    );
    const credibility = auditCompareSetCredibility(matched);
    return {
      pairSlug,
      status: scored.status,
      issues: scored.issues,
      credibilityWarnings: credibility.warnings || [],
      vehicleCount: matched.length,
    };
  });

  const weakExplanations = vehicleAudits.filter(
    (v) => v.warnings.some((w) => w.code === "dense_wording")
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    vehicleCount: vehicleAudits.length,
    pairCount: pairAudits.length,
    vehicleAudits,
    pairAudits,
    summary: {
      vehiclesWithIssues: vehicleAudits.filter((v) => v.issues.length).length,
      pairsNeedingReview: pairAudits.filter(
        (p) => p.status === "NEEDS_REVIEW"
      ).length,
      weakExplanationCount: weakExplanations,
    },
  };
}

function buildDefaultComparePairs(cars = []) {
  const slugs = cars.map((c) => c.slug).filter(Boolean);
  const pairs = [];
  if (slugs.length >= 2) {
    pairs.push(`${slugs[0]}-vs-${slugs[1]}`);
  }
  if (slugs.length >= 3) {
    pairs.push(`${slugs[0]}-vs-${slugs[2]}`);
  }
  return pairs;
}

export function compareQualityMarkdown(report) {
  const lines = [
    "# Compare quality audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Vehicles: **${report.vehicleCount}**`,
    `- Pairs checked: **${report.pairCount}**`,
    `- Vehicles with issues: **${report.summary?.vehiclesWithIssues ?? 0}**`,
    `- Pairs needing review: **${report.summary?.pairsNeedingReview ?? 0}**`,
    "",
    "## Pair status",
    "",
    "| Pair | Status | Issues |",
    "| --- | --- | --- |",
  ];
  for (const p of report.pairAudits || []) {
    lines.push(
      `| ${p.pairSlug} | ${p.status} | ${(p.issues || []).join(", ") || "—"} |`
    );
  }
  return lines.join("\n");
}
