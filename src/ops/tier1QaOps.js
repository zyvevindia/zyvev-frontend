/**
 * Tier-1 productionization QA — focused cohort checks.
 */

import { generateTier1ProductionizationReport } from "./tier1ProductionizationOps.js";
import { generateCompareTrustAuditReport } from "./compareTrustAuditOps.js";
import { filterProductionizationCars } from "./tier1ProductionizationFocus.js";

const TRUST_SCORE_MIN = 55;
const CATALOG_COMPLETENESS_WARN = 50;
const MEDIA_COMPLETENESS_WARN = 60;

/**
 * @param {object[]} cars
 */
export function runTier1QaAudit(cars = []) {
  const cohort = filterProductionizationCars(cars);
  const productionReport = generateTier1ProductionizationReport(cohort);
  const trustReport = generateCompareTrustAuditReport(cohort);

  const failures = [];
  const warnings = [];

  if (!productionReport.productionQa?.ok) {
    failures.push({
      id: "production_qa_structural",
      detail: productionReport.productionQa.failures,
    });
  }

  for (const v of productionReport.vehicles || []) {
    if (
      v.missingFields?.includes("heroImage") ||
      v.missingMedia?.includes("heroImage")
    ) {
      failures.push({ id: "missing_hero", slug: v.slug });
    }
    if (v.compareTrustScore < TRUST_SCORE_MIN) {
      warnings.push({
        id: "low_compare_trust",
        slug: v.slug,
        score: v.compareTrustScore,
      });
    }
    if (v.completenessPercent < CATALOG_COMPLETENESS_WARN) {
      warnings.push({
        id: "low_catalog_completeness",
        slug: v.slug,
        percent: v.completenessPercent,
      });
    }
    if (v.mediaCompletenessPercent < MEDIA_COMPLETENESS_WARN) {
      warnings.push({
        id: "low_media_completeness",
        slug: v.slug,
        percent: v.mediaCompletenessPercent,
      });
    }
    if (v.weakCompareSections?.length) {
      warnings.push({
        id: "weak_compare_sections",
        slug: v.slug,
        sections: v.weakCompareSections,
      });
    }
    if (v.safetyReadiness === "missing") {
      warnings.push({ id: "missing_safety_metadata", slug: v.slug });
    }
  }

  if (trustReport.summary?.pairsNeedingReview > 0) {
    warnings.push({
      id: "compare_pairs_needing_review",
      count: trustReport.summary.pairsNeedingReview,
    });
  }

  const checks = [
    {
      id: "cohort_size",
      status: cohort.length === 5 ? "pass" : "fail",
      detail: `${cohort.length}/5 vehicles`,
    },
    {
      id: "sticky_nav",
      status: productionReport.uxChecks?.chargingTabPresent ? "pass" : "fail",
    },
    {
      id: "avg_trust",
      status:
        (trustReport.summary?.avgTrustScore ?? 0) >= TRUST_SCORE_MIN
          ? "pass"
          : "warn",
      detail: trustReport.summary?.avgTrustScore,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    checks,
    failures,
    warnings,
    productionReport,
    trustReport,
    summary: {
      ok: failures.length === 0,
      failureCount: failures.length,
      warningCount: warnings.length,
      cohortSlugs: cohort.map((c) => c.slug),
    },
  };
}

export function tier1QaMarkdown(report) {
  const lines = [
    "# Tier-1 QA",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `**Status:** ${report.summary?.ok ? "PASS" : "FAIL"}`,
    "",
    `- Failures: ${report.summary?.failureCount}`,
    `- Warnings: ${report.summary?.warningCount}`,
    "",
  ];
  if (report.failures?.length) {
    lines.push("## Failures", "");
    for (const f of report.failures) {
      lines.push(`- **${f.id}** ${f.slug ? `(${f.slug})` : ""}`);
    }
  }
  if (report.warnings?.length) {
    lines.push("", "## Warnings", "");
    for (const w of report.warnings.slice(0, 15)) {
      lines.push(`- **${w.id}** ${w.slug ? `(${w.slug})` : ""}`);
    }
  }
  return lines.join("\n");
}
