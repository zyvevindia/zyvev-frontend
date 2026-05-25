/**
 * Tier-1 productionization report — 5 trusted EV families.
 */

import {
  auditVehicleCompleteness,
  COMPLETENESS_STATUS,
} from "./catalogCompletenessOps.js";
import { auditCompareVehicleQuality } from "./compareQualityAuditOps.js";
import { scoreCompareTrustQuality } from "./compareTrustAuditOps.js";
import { generateAuthorityCoverageReport } from "./authorityCoverageOps.js";
import {
  buildTier1MediaCompletenessScore,
  buildTier1FamilyMediaRows,
} from "./tier1MediaHealth.js";
import { buildSafetyCompletenessReport } from "../intelligence/safetyMetadata.js";
import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { runProductionQaAudit } from "./productionQaOps.js";
import {
  TIER1_PRODUCTIONIZATION_SLUGS,
  TIER1_PRODUCTIONIZATION_LABELS,
  defaultProductionizationComparePairs,
  filterProductionizationCars,
} from "./tier1ProductionizationFocus.js";
import { DETAIL_NAV_TABS } from "../utils/detailPageNav.js";

const MEDIA_FIELD_KEYS = [
  "heroImage",
  "galleryCoverage",
  "interiorImage",
  "chargingImage",
];

const SPEC_FIELD_KEYS = [
  "variantsVerified",
  "pricingVerified",
  "batteryVerified",
  "rangeVerified",
  "chargingVerified",
  "accelerationVerified",
];

function missingFromFields(fields, keys, statuses = [COMPLETENESS_STATUS.MISSING]) {
  return keys.filter((k) => statuses.includes(fields?.[k]));
}

function weakCompareSections(car) {
  const audit = auditCompareVehicleQuality(car);
  return audit.issues.map((i) => i.code);
}

function weakOwnershipGuidance(car) {
  const intel = buildVehicleIntelligence(car);
  const weak = [];
  if (!intel?.ownership?.hasData) weak.push("ownership_empty");
  if (!intel?.ownership?.monthlyChargingCostInr) {
    weak.push("ownership_cost_missing");
  }
  if (!intel?.chargingPracticality?.hasData) {
    weak.push("charging_practicality_empty");
  }
  const prac = intel?.chargingPracticality;
  if (prac?.apartmentLabel?.includes("Unavailable")) {
    weak.push("apartment_guidance_weak");
  }
  return weak;
}

/**
 * @param {object[]} cars — full catalog; filtered to focus cohort internally
 */
export function generateTier1ProductionizationReport(cars = []) {
  const cohort = filterProductionizationCars(cars);
  const mediaRows = buildTier1FamilyMediaRows().filter((r) =>
    TIER1_PRODUCTIONIZATION_SLUGS.includes(r.familySlug)
  );

  const vehicles = TIER1_PRODUCTIONIZATION_SLUGS.map((slug) => {
    const car =
      cohort.find(
        (c) =>
          (c.familySlug || c.slug || c.catalogMeta?.familySlug) === slug
      ) || { slug, name: TIER1_PRODUCTIONIZATION_LABELS[slug] };

    const completeness = auditVehicleCompleteness(car);
    const compareAudit = auditCompareVehicleQuality(car);
    const trustScore = scoreCompareTrustQuality(car);
    const mediaRow = mediaRows.find((r) => r.familySlug === slug);
    const mediaScore = mediaRow
      ? buildTier1MediaCompletenessScore(mediaRow)
      : null;

    const fields = completeness.fields || {};
    const missingMedia = missingFromFields(fields, MEDIA_FIELD_KEYS);
    const missingSpecs = missingFromFields(fields, SPEC_FIELD_KEYS);
    const notVerified = Object.entries(fields)
      .filter(([, v]) => v === COMPLETENESS_STATUS.NOT_VERIFIED)
      .map(([k]) => k);

    return {
      slug,
      label: TIER1_PRODUCTIONIZATION_LABELS[slug],
      name: car.name || TIER1_PRODUCTIONIZATION_LABELS[slug],
      brand: car.brand,
      completenessPercent: completeness.completenessPercent,
      missingFields: completeness.missing,
      notVerifiedFields: notVerified,
      missingMedia,
      missingSpecs,
      weakCompareSections: weakCompareSections(car),
      weakOwnershipGuidance: weakOwnershipGuidance(car),
      compareIssues: compareAudit.issues,
      compareWarnings: compareAudit.warnings,
      compareTrustScore: trustScore.score,
      compareTrustBand: trustScore.band,
      mediaCompletenessPercent: mediaScore?.mediaCompletenessPercent ?? 0,
      missingCoreMedia: mediaScore?.missingCoreRoles ?? [],
      missingOptionalMedia: mediaScore?.missingOptionalRoles ?? [],
      safetyReadiness: completeness.safetyReadiness,
      compareReadiness: fields.compareReadiness,
      seoReadiness: fields.seoReadiness,
    };
  });

  const safety = buildSafetyCompletenessReport(cohort);
  const authority = generateAuthorityCoverageReport({});
  const comparePairs = defaultProductionizationComparePairs();
  const productionQa = runProductionQaAudit({
    cars: cohort,
    compareSlugs: comparePairs,
  });

  const uxChecks = {
    stickyNavTabCount: DETAIL_NAV_TABS.length,
    requiredTabs: DETAIL_NAV_TABS.map((t) => t.id),
    chargingTabPresent: DETAIL_NAV_TABS.some((t) => t.id === "charging"),
    compareCtaRoutes: ["/compare", "/cars?compareMode=true"],
    detailSectionAnchors: [
      "overview",
      "variants",
      "compare",
      "range",
      "charging",
      "features",
      "suitability",
      "emi",
      "faqs",
      "reviews",
      "related-evs",
      "assistance",
    ],
    status: "static_pass",
  };

  const avgCompleteness =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((s, v) => s + v.completenessPercent, 0) /
            vehicles.length
        )
      : 0;

  const avgTrust =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((s, v) => s + v.compareTrustScore, 0) /
            vehicles.length
        )
      : 0;

  const avgMedia =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce(
            (s, v) => s + (v.mediaCompletenessPercent || 0),
            0
          ) / vehicles.length
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    cohort: TIER1_PRODUCTIONIZATION_SLUGS,
    vehicles,
    comparePairs,
    safety,
    authority: {
      summary: authority.summary,
      weakClusters: authority.weakClusters,
    },
    productionQa: {
      ok: productionQa.summary?.ok,
      failures: productionQa.failures,
      warnings: productionQa.warnings,
    },
    uxChecks,
    summary: {
      avgCompletenessPercent: avgCompleteness,
      avgCompareTrustScore: avgTrust,
      avgMediaCompletenessPercent: avgMedia,
      vehiclesBelow60Completeness: vehicles.filter(
        (v) => v.completenessPercent < 60
      ).length,
      vehiclesBelow70Trust: vehicles.filter(
        (v) => v.compareTrustScore < 70
      ).length,
      topMissingMedia: summarizeGapCounts(vehicles, "missingMedia"),
      topMissingSpecs: summarizeGapCounts(vehicles, "missingSpecs"),
    },
  };
}

function summarizeGapCounts(vehicles, key) {
  const counts = {};
  for (const v of vehicles) {
    for (const item of v[key] || []) {
      counts[item] = (counts[item] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([field, count]) => ({ field, count }));
}

export function tier1ProductionizationMarkdown(report) {
  const lines = [
    "# Tier-1 productionization report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "**Cohort:** Tata Nexon EV · Tata Punch EV · Tata Curvv EV · MG ZS EV · BYD Atto 3",
    "",
    "## Summary",
    "",
    `- Avg catalog completeness: **${report.summary?.avgCompletenessPercent}%**`,
    `- Avg compare trust score: **${report.summary?.avgCompareTrustScore}/100**`,
    `- Avg core media completeness: **${report.summary?.avgMediaCompletenessPercent}%**`,
    `- Production QA: **${report.productionQa?.ok ? "PASS" : "ATTENTION"}**`,
    "",
    "## Per vehicle",
    "",
    "| EV | Catalog % | Trust | Media % | Missing media | Weak compare |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const v of report.vehicles || []) {
    lines.push(
      `| ${v.label} | ${v.completenessPercent}% | ${v.compareTrustScore} (${v.compareTrustBand}) | ${v.mediaCompletenessPercent}% | ${(v.missingMedia || []).join(", ") || "—"} | ${(v.weakCompareSections || []).slice(0, 2).join(", ") || "—"} |`
    );
  }

  if (report.summary?.topMissingMedia?.length) {
    lines.push("", "## Top missing media (cohort)", "");
    for (const g of report.summary.topMissingMedia) {
      lines.push(`- ${g.field}: ${g.count} vehicles`);
    }
  }

  return lines.join("\n");
}
