/**
 * Change Detection Agent v1 — diff dossier, recommendation, review effort.
 */

import { FIELD_LABELS } from "../../catalogAcquisition/extractionSchema.js";
import { extractFieldValue } from "../../catalogAcquisition/benchmark/compareUtils.js";
import {
  CHANGE_DETECTION_RECOMMENDATION,
  CHANGE_DETECTION_STATUS,
} from "./changeDetectionStatus.js";
import { compareSnapshots } from "./changeDiffEngine.js";
import { aggregateJobPriority, CHANGE_PRIORITY } from "./changePriority.js";
import { CHANGE_SEVERITY } from "./changeClassification.js";

const DOSSIER_SECTIONS = [
  "vehicleSummary",
  "changesDetected",
  "priceChanges",
  "variantChanges",
  "batteryRangeChanges",
  "chargingChanges",
  "featureChanges",
  "evidenceSources",
  "confidence",
  "recommendation",
];

export function buildDiffDossier(job = {}, comparison = {}, evidenceMeta = {}) {
  const changes = comparison.changes || [];
  const priority = aggregateJobPriority(changes);

  const sections = {
    vehicleSummary: {
      label: "Vehicle Summary",
      vehicle: job.label || job.familySlug,
      familySlug: job.familySlug,
      brand: job.brand || comparison.publishedSnapshot?.fields?.brand,
      model: job.model || comparison.publishedSnapshot?.fields?.model,
      lastCheckedAt: job.lastCheckedAt || evidenceMeta.checkedAt || null,
      publishedAt: job.publishedSnapshotAt || comparison.publishedSnapshot?.capturedAt || null,
    },
    changesDetected: {
      label: "Changes Detected",
      rows: changes,
      count: changes.length,
      summary: comparison.summary || {},
    },
    priceChanges: {
      label: "Price Changes",
      rows: changes.filter((c) => c.category === "pricing"),
      count: changes.filter((c) => c.category === "pricing").length,
    },
    variantChanges: {
      label: "Variant Changes",
      rows: changes.filter((c) => c.category === "variant"),
      count: changes.filter((c) => c.category === "variant").length,
    },
    batteryRangeChanges: {
      label: "Battery and Range Changes",
      rows: changes.filter((c) => c.category === "battery" || c.category === "range"),
      count: changes.filter((c) => c.category === "battery" || c.category === "range").length,
    },
    chargingChanges: {
      label: "Charging Changes",
      rows: changes.filter((c) => c.category === "charging"),
      count: changes.filter((c) => c.category === "charging").length,
    },
    featureChanges: {
      label: "Feature Changes",
      rows: changes.filter((c) => c.category === "feature" || c.category === "media"),
      count: changes.filter((c) => c.category === "feature" || c.category === "media").length,
    },
    evidenceSources: {
      label: "Evidence Sources",
      oemUrl: evidenceMeta.oemUrl || job.oemUrl,
      brochureUrl: evidenceMeta.brochureUrl || job.brochureUrl,
      previousBrochureUrl: job.publishedBrochureUrl || comparison.publishedSnapshot?.brochureUrl,
      evidenceRecordCount: evidenceMeta.evidenceRecordCount ?? null,
      acquisitionOk: evidenceMeta.acquisitionOk !== false,
      sourceChanges: changes.filter((c) => c.category === "source"),
    },
    confidence: {
      label: "Confidence",
      changeCount: changes.length,
      highSeverityCount: changes.filter((c) => c.severity === CHANGE_SEVERITY.HIGH).length,
      mediumSeverityCount: changes.filter((c) => c.severity === CHANGE_SEVERITY.MEDIUM).length,
      priority,
      confidenceScore: evidenceMeta.confidenceScore ?? null,
    },
    recommendation: {
      label: "Recommendation",
    },
  };

  const recommendation = computeChangeRecommendation({
    comparison,
    acquisitionOk: evidenceMeta.acquisitionOk !== false,
    priority,
  });

  sections.recommendation = {
    label: "Recommendation",
    ...recommendation,
    priority,
  };

  const reviewMinutes = estimateReviewMinutes(changes, priority);

  return {
    generatedAt: new Date().toISOString(),
    agentVersion: "v1",
    jobId: job.id,
    status: job.status,
    sectionOrder: DOSSIER_SECTIONS,
    sections,
    comparison,
    recommendation,
    priority,
    metrics: {
      changeCount: changes.length,
      reviewMinutes,
      severityBreakdown: {
        HIGH: changes.filter((c) => c.severity === CHANGE_SEVERITY.HIGH).length,
        MEDIUM: changes.filter((c) => c.severity === CHANGE_SEVERITY.MEDIUM).length,
        LOW: changes.filter((c) => c.severity === CHANGE_SEVERITY.LOW).length,
      },
    },
  };
}

export function computeChangeRecommendation({
  comparison = {},
  acquisitionOk = true,
  priority = null,
} = {}) {
  if (!acquisitionOk) {
    return {
      code: CHANGE_DETECTION_RECOMMENDATION.BLOCKED,
      reason: "Latest acquisition failed — cannot verify changes",
    };
  }

  if (!comparison.hasChanges) {
    return {
      code: CHANGE_DETECTION_RECOMMENDATION.NO_CHANGE,
      reason: "Published snapshot matches latest acquisition",
    };
  }

  if (priority === CHANGE_PRIORITY.CRITICAL) {
    return {
      code: CHANGE_DETECTION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `Critical changes detected (${comparison.summary?.total || 0} item(s))`,
    };
  }

  return {
    code: CHANGE_DETECTION_RECOMMENDATION.REVIEW_REQUIRED,
    reason: `${comparison.summary?.total || 0} change(s) require human review before catalog update`,
  };
}

export function estimateReviewMinutes(changes = [], priority = null) {
  const n = changes.length;
  if (n === 0) return 1;
  const base = 1.5 + n * 0.35;
  const priorityBoost =
    priority === CHANGE_PRIORITY.CRITICAL ? 2 : priority === CHANGE_PRIORITY.HIGH ? 1 : 0;
  return Math.round(Math.min(15, Math.max(1, base + priorityBoost)) * 10) / 10;
}

export function workflowStatusAfterCheck(comparison = {}, acquisitionOk = true) {
  if (!acquisitionOk) return CHANGE_DETECTION_STATUS.REVIEW_REQUIRED;
  if (!comparison.hasChanges) return CHANGE_DETECTION_STATUS.MONITORING;
  return CHANGE_DETECTION_STATUS.CHANGE_DETECTED;
}

export function formatChangeRow(row = {}) {
  const before = row.before ?? "—";
  const after = row.after ?? "—";
  return `${row.label || row.fieldKey}: ${before} → ${after}`;
}

export function buildLatestSnapshotFromPipeline(pipeline = {}, meta = {}) {
  return {
    fields: {},
    features: {},
    variants: pipeline.mergedVariants || pipeline.extractedVehicle?.variants || [],
    extractedVehicle: pipeline.extractedVehicle,
    oemUrl: meta.oemUrl,
    brochureUrl: meta.brochureUrl,
    capturedAt: new Date().toISOString(),
    confidenceScore: pipeline.confidenceScore,
    evidenceRecordCount: pipeline.evidenceRecords?.length ?? 0,
  };
}
