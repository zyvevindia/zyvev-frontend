/**
 * Audit Agent v1 — integrity rule evaluation workflow.
 */
import {
  AUDIT_CATEGORIES,
  REQUIRED_CATALOG_FIELDS,
  REQUIRED_VARIANT_FIELDS,
  SCORE_OUTLIER_THRESHOLD,
  SCORE_OUTLIER_LOW,
  RANKING_INCONSISTENCY_DELTA,
  MONITORING_ALERT_FLOOD_THRESHOLD,
  MONITORING_REPEATED_FAILURE_THRESHOLD,
  REGISTRY_VERIFICATION_MAX_DAYS,
  daysSince,
} from "./auditRules.js";
import { createFinding } from "./auditFindings.js";
import { FINDING_SEVERITY } from "./auditStatus.js";
import { severityToRecommendation } from "./auditRecommendation.js";
import { scoreToGrade } from "../../scoring/scoreNormalization.js";

function attachRecommendation(finding) {
  return {
    ...finding,
    recommendation: severityToRecommendation(finding.severity),
  };
}

export function evaluateCatalogIntegrity(snapshot) {
  const findings = [];
  const vehicles = snapshot.vehicles || [];
  const scoreMap = new Map(
    (snapshot.scoreRecords || []).map((r) => [r.familySlug, r])
  );

  for (const vehicle of vehicles) {
    const slug = vehicle.familySlug || vehicle.id;

    for (const field of REQUIRED_CATALOG_FIELDS) {
      const val = vehicle[field] ?? vehicle.fields?.[field];
      if (val == null || val === "") {
        findings.push(
          attachRecommendation(
            createFinding({
              severity: FINDING_SEVERITY.WARNING,
              category: AUDIT_CATEGORIES.CATALOG_INTEGRITY,
              code: "catalog_missing_required_field",
              message: `Missing required field "${field}" for ${slug}.`,
              entityId: slug,
              metadata: { field },
            })
          )
        );
      }
    }

    if (vehicle.vehicle && vehicle.familySlug && !vehicle.fields) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.INFO,
            category: AUDIT_CATEGORIES.CATALOG_INTEGRITY,
            code: "catalog_broken_relationship",
            message: `Vehicle node present but fields missing for ${slug}.`,
            entityId: slug,
          })
        )
      );
    }

    const variants = vehicle.variants || [];
    const variantNames = variants.map((v) =>
      String(v.variantName || v.name || "").trim().toLowerCase()
    );
    const seen = new Set();
    for (const name of variantNames) {
      if (!name) continue;
      if (seen.has(name)) {
        findings.push(
          attachRecommendation(
            createFinding({
              severity: FINDING_SEVERITY.CRITICAL,
              category: AUDIT_CATEGORIES.CATALOG_INTEGRITY,
              code: "catalog_duplicate_variant",
              message: `Duplicate variant "${name}" for ${slug}.`,
              entityId: slug,
              metadata: { variantName: name },
            })
          )
        );
      }
      seen.add(name);
    }

    for (const variant of variants) {
      for (const field of REQUIRED_VARIANT_FIELDS) {
        if (variant[field] == null || variant[field] === "") {
          findings.push(
            attachRecommendation(
              createFinding({
                severity: FINDING_SEVERITY.INFO,
                category: AUDIT_CATEGORIES.CATALOG_INTEGRITY,
                code: "catalog_missing_required_field",
                message: `Variant missing "${field}" on ${slug}.`,
                entityId: slug,
                metadata: { variantName: variant.variantName, field },
              })
            )
          );
        }
      }

      const price = Number(variant.priceInr);
      if (variant.priceInr != null && (!Number.isFinite(price) || price <= 0)) {
        findings.push(
          attachRecommendation(
            createFinding({
              severity: FINDING_SEVERITY.WARNING,
              category: AUDIT_CATEGORIES.CATALOG_INTEGRITY,
              code: "catalog_invalid_price",
              message: `Invalid price for variant ${variant.variantName || "?"} on ${slug}.`,
              entityId: slug,
              metadata: { priceInr: variant.priceInr },
            })
          )
        );
      }
    }

    const scoreRow = scoreMap.get(slug);
    if (!scoreRow || scoreRow.overallScore == null) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.CATALOG_INTEGRITY,
            code: "catalog_missing_score",
            message: `No score record for catalog entry ${slug}.`,
            entityId: slug,
          })
        )
      );
    }
  }

  return findings;
}

export function evaluateScoreIntegrity(snapshot) {
  const findings = [];
  const records = snapshot.scoreRecords || [];

  for (const row of records) {
    const slug = row.familySlug;
    const score = row.overallScore;
    const breakdown = row.breakdown || {};

    if (score != null && Object.keys(breakdown).length === 0) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.SCORE_INTEGRITY,
            code: "score_missing_breakdown",
            message: `Score present but breakdown missing for ${slug}.`,
            entityId: slug,
          })
        )
      );
    }

    if (score != null && (score >= SCORE_OUTLIER_THRESHOLD || score <= SCORE_OUTLIER_LOW)) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.INFO,
            category: AUDIT_CATEGORIES.SCORE_INTEGRITY,
            code: "score_outlier",
            message: `Outlier score ${score} for ${slug}.`,
            entityId: slug,
            metadata: { score },
          })
        )
      );
    }

    if (row.grade && score != null) {
      const expected = scoreToGrade(score);
      if (expected && row.grade !== expected) {
        findings.push(
          attachRecommendation(
            createFinding({
              severity: FINDING_SEVERITY.WARNING,
              category: AUDIT_CATEGORIES.SCORE_INTEGRITY,
              code: "score_grade_mismatch",
              message: `Grade mismatch for ${slug}: stored ${row.grade}, expected ${expected}.`,
              entityId: slug,
              metadata: { stored: row.grade, expected, score },
            })
          )
        );
      }
    }
  }

  const ranked = [...records]
    .filter((r) => r.overallScore != null)
    .sort((a, b) => b.overallScore - a.overallScore);

  for (let i = 1; i < ranked.length; i += 1) {
    const prev = ranked[i - 1];
    const curr = ranked[i];
    const delta = prev.overallScore - curr.overallScore;
    if (delta > RANKING_INCONSISTENCY_DELTA && curr.rankPosition != null) {
      const expectedRank = i + 1;
      if (Math.abs(curr.rankPosition - expectedRank) >= 2) {
        findings.push(
          attachRecommendation(
            createFinding({
              severity: FINDING_SEVERITY.INFO,
              category: AUDIT_CATEGORIES.SCORE_INTEGRITY,
              code: "score_inconsistent_ranking",
              message: `Ranking inconsistency for ${curr.familySlug}: position ${curr.rankPosition} vs expected ~${expectedRank}.`,
              entityId: curr.familySlug,
              metadata: { rankPosition: curr.rankPosition, expectedRank },
            })
          )
        );
      }
    }
  }

  return findings;
}

export function evaluateSeoIntegrity(snapshot) {
  const findings = [];
  const jobs = snapshot.seoJobs || [];
  const slugs = [];

  for (const job of jobs) {
    const page = job.seoPage;
    if (!page) continue;
    slugs.push(page.slug);

    if (!page.metaDescription || page.metaDescription.length < 50) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.SEO_INTEGRITY,
            code: "seo_missing_metadata",
            message: `SEO job ${job.id} missing or short meta description.`,
            entityId: job.id,
            metadata: { slug: page.slug },
          })
        )
      );
    }

    if (!page.title || page.title.length < 10) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.SEO_INTEGRITY,
            code: "seo_missing_metadata",
            message: `SEO job ${job.id} missing or short title.`,
            entityId: job.id,
            metadata: { slug: page.slug },
          })
        )
      );
    }

    const canonical = page.canonicalUrl || page.canonical;
    if (canonical && !/^https?:\/\//i.test(canonical)) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.CRITICAL,
            category: AUDIT_CATEGORIES.SEO_INTEGRITY,
            code: "seo_broken_canonical",
            message: `Invalid canonical URL for SEO slug "${page.slug}".`,
            entityId: page.slug,
            metadata: { canonical },
          })
        )
      );
    }

    if (
      job.status === "published" &&
      page.contentType !== "faq" &&
      (!page.faqs || page.faqs.length === 0) &&
      page.requiresFaq !== false
    ) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.INFO,
            category: AUDIT_CATEGORIES.SEO_INTEGRITY,
            code: "seo_missing_faq",
            message: `Published SEO page "${page.slug}" has no FAQ block.`,
            entityId: page.slug,
          })
        )
      );
    }
  }

  const slugCounts = {};
  for (const s of slugs) {
    slugCounts[s] = (slugCounts[s] || 0) + 1;
  }
  for (const [slug, count] of Object.entries(slugCounts)) {
    if (count > 1) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.CRITICAL,
            category: AUDIT_CATEGORIES.SEO_INTEGRITY,
            code: "seo_duplicate_slug",
            message: `Duplicate SEO slug "${slug}" in ${count} jobs.`,
            entityId: slug,
            metadata: { count },
          })
        )
      );
    }
  }

  return findings;
}

export function evaluateAgentGovernance(snapshot) {
  const findings = [];
  const execs = snapshot.orchestratorExecutions || [];
  const vcJobs = snapshot.vehicleCreationJobs || [];
  const cdJobs = snapshot.changeDetectionJobs || [];
  const seoJobs = snapshot.seoJobs || [];

  for (const log of execs) {
    if (log.status === "failed") {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.AGENT_GOVERNANCE,
            code: "governance_failed_run",
            message: `Failed ${log.agentId || log.agentName} run: ${log.error || "unknown"}.`,
            entityId: log.id,
            metadata: { agentId: log.agentId },
          })
        )
      );
    }

    if (log.executedWithoutApproval === true) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.CRITICAL,
            category: AUDIT_CATEGORIES.AGENT_GOVERNANCE,
            code: "governance_unexpected_path",
            message: `Execution ${log.id} ran without prior human approval.`,
            entityId: log.id,
          })
        )
      );
    }

    if (log.status === "completed" && !log.approvedAt && log.requiresApproval !== false) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.CRITICAL,
            category: AUDIT_CATEGORIES.AGENT_GOVERNANCE,
            code: "governance_missing_approval",
            message: `Completed execution ${log.id} lacks approval record.`,
            entityId: log.id,
            metadata: { agentId: log.agentId },
          })
        )
      );
    }

    if (log.anomaly === true || log.unexpectedPath === true) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.AGENT_GOVERNANCE,
            code: "governance_log_anomaly",
            message: `Anomaly flagged on execution log ${log.id}.`,
            entityId: log.id,
          })
        )
      );
    }
  }

  const pendingPublish = [
    ...vcJobs.filter((j) => j.status === "approved" && !j.publishedAt),
    ...seoJobs.filter((j) => j.status === "approved" && !j.publishedAt),
  ];
  for (const job of pendingPublish) {
    findings.push(
      attachRecommendation(
        createFinding({
          severity: FINDING_SEVERITY.INFO,
          category: AUDIT_CATEGORIES.AGENT_GOVERNANCE,
          code: "governance_missing_approval",
          message: `Approved job ${job.id} awaiting publish confirmation.`,
          entityId: job.id,
        })
      )
    );
  }

  const staleCd = cdJobs.filter(
    (j) => j.status === "review_required" && !j.reviewedAt
  );
  if (staleCd.length > 5) {
    findings.push(
      attachRecommendation(
        createFinding({
          severity: FINDING_SEVERITY.INFO,
          category: AUDIT_CATEGORIES.AGENT_GOVERNANCE,
          code: "governance_log_anomaly",
          message: `${staleCd.length} change-detection jobs pending review.`,
          entityId: "changeDetection",
        })
      )
    );
  }

  return findings;
}

export function evaluateRegistryIntegrity(snapshot) {
  const findings = [];
  const registry = snapshot.registry || [];
  const now = snapshot.now ? new Date(snapshot.now) : new Date();

  for (const entry of registry) {
    const slug = entry.familySlug || entry.id;

    if (entry.flags?.unreachableUrl || entry.status === "broken") {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.CRITICAL,
            category: AUDIT_CATEGORIES.REGISTRY_INTEGRITY,
            code: "registry_broken_url",
            message: `Registry marks URL broken for ${slug}.`,
            entityId: slug,
          })
        )
      );
    }

    if (!entry.brochureUrl || entry.flags?.missingBrochure) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.INFO,
            category: AUDIT_CATEGORIES.REGISTRY_INTEGRITY,
            code: "registry_missing_brochure",
            message: `Missing brochure URL for ${slug}.`,
            entityId: slug,
          })
        )
      );
    }

    if (entry.lastVerifiedAt) {
      const age = daysSince(entry.lastVerifiedAt, now);
      if (age != null && age > REGISTRY_VERIFICATION_MAX_DAYS) {
        findings.push(
          attachRecommendation(
            createFinding({
              severity: FINDING_SEVERITY.WARNING,
              category: AUDIT_CATEGORIES.REGISTRY_INTEGRITY,
              code: "registry_verification_expired",
              message: `Verification expired for ${slug} (${Math.round(age)}d ago).`,
              entityId: slug,
              metadata: { ageDays: age },
            })
          )
        );
      }
    }
  }

  return findings;
}

export function evaluateMonitoringIntegrity(snapshot) {
  const findings = [];
  const scans = snapshot.monitoringScans || [];

  for (const scan of scans) {
    const unresolvedCritical = (scan.alerts || []).filter(
      (a) => a.level === "CRITICAL" && !a.resolvedAt
    );
    for (const alert of unresolvedCritical) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.CRITICAL,
            category: AUDIT_CATEGORIES.MONITORING_INTEGRITY,
            code: "monitoring_unresolved_critical",
            message: `Unresolved critical monitoring alert: ${alert.message}`,
            entityId: alert.id,
            metadata: { scanId: scan.id, alertCode: alert.code },
          })
        )
      );
    }

    const alertCount = scan.alerts?.length ?? 0;
    if (alertCount >= MONITORING_ALERT_FLOOD_THRESHOLD) {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.WARNING,
            category: AUDIT_CATEGORIES.MONITORING_INTEGRITY,
            code: "monitoring_alert_flood",
            message: `Monitoring scan ${scan.id} has ${alertCount} alerts (flood threshold ${MONITORING_ALERT_FLOOD_THRESHOLD}).`,
            entityId: scan.id,
            metadata: { alertCount },
          })
        )
      );
    }

    if (scan.status === "failed") {
      findings.push(
        attachRecommendation(
          createFinding({
            severity: FINDING_SEVERITY.INFO,
            category: AUDIT_CATEGORIES.MONITORING_INTEGRITY,
            code: "monitoring_repeated_failure",
            message: `Monitoring scan ${scan.id} failed.`,
            entityId: scan.id,
          })
        )
      );
    }
  }

  const failedScans = scans.filter((s) => s.status === "failed");
  if (failedScans.length >= MONITORING_REPEATED_FAILURE_THRESHOLD) {
    findings.push(
      attachRecommendation(
        createFinding({
          severity: FINDING_SEVERITY.CRITICAL,
          category: AUDIT_CATEGORIES.MONITORING_INTEGRITY,
          code: "monitoring_repeated_failure",
          message: `${failedScans.length} consecutive monitoring scan failures.`,
          entityId: "monitoring",
          metadata: { count: failedScans.length },
        })
      )
    );
  }

  return findings;
}

export function runAuditWorkflow(snapshot) {
  const findings = [
    ...evaluateCatalogIntegrity(snapshot),
    ...evaluateScoreIntegrity(snapshot),
    ...evaluateSeoIntegrity(snapshot),
    ...evaluateAgentGovernance(snapshot),
    ...evaluateRegistryIntegrity(snapshot),
    ...evaluateMonitoringIntegrity(snapshot),
  ];

  return { findings, snapshot };
}
