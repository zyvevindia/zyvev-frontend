/**
 * Vehicle Creation Agent v1.1 — evidence packet, review dossier, recommendation.
 */

import { EVIDENCE_FIELD_STATUS } from "../../catalogAcquisition/constants.js";
import { checkPublishQualityGates } from "../../catalogAcquisition/benchmark/qualityGates.js";
import {
  EXTRACTION_FIELD_GROUPS,
  FIELD_LABELS,
  REQUIRED_PUBLISH_FIELDS,
  flattenExtractionDraft,
  formatFieldDisplay,
  fieldNeedsAttention,
  listAttentionFieldKeys,
} from "../../catalogAcquisition/extractionSchema.js";
import { extractFieldValue } from "../../catalogAcquisition/benchmark/compareUtils.js";
import {
  VEHICLE_CREATION_RECOMMENDATION,
  VEHICLE_CREATION_STATUS,
} from "./vehicleCreationStatus.js";
import {
  buildBenchmarkContext,
  buildHiddenBenchmarkDeltas,
  computePublishProbability,
  estimateCorrectionMinutes,
  estimateManualCorrectionsFromBenchmark,
  estimateManualCorrectionsHeuristic,
  hasSevereBenchmarkMismatch,
  isCriticalGateFailure,
  isPublishProbabilityHigh,
} from "./vehicleCreationBenchmark.js";

const DOSSIER_SECTIONS = Object.freeze([
  { id: "publishReadiness", label: "Publish Readiness", alwaysVisible: true },
  { id: "hiddenBenchmarkDeltas", label: "Hidden Benchmark Deltas", alwaysVisible: true },
  { id: "vehicleSummary", label: "Vehicle Summary", groups: ["vehicle"] },
  { id: "pricingSummary", label: "Pricing Summary", groups: ["pricing"] },
  { id: "batteryRange", label: "Battery & Range", groups: ["battery", "range"] },
  { id: "charging", label: "Charging", groups: ["charging"] },
  { id: "features", label: "Features", groups: ["features", "safety"] },
  { id: "variantTable", label: "Variant Table", groups: [] },
  { id: "conflicts", label: "Conflicts", groups: [] },
  { id: "missingFields", label: "Missing Fields", groups: [] },
  { id: "confidence", label: "Confidence", groups: [] },
]);

function groupFieldsById(groupIds = []) {
  return EXTRACTION_FIELD_GROUPS.filter((g) => groupIds.includes(g.id));
}

/**
 * Normalize v7 pipeline output into a portable evidence packet.
 */
export function buildEvidencePacket(pipeline = {}, meta = {}) {
  return {
    generatedAt: new Date().toISOString(),
    engine: pipeline.diagnostics?.step || "evidence_pipeline_v7.1",
    agentVersion: "v1.1",
    importId: meta.importId || null,
    oemUrl: meta.oemUrl || null,
    brochureUrl: meta.brochureUrl || null,
    familySlug: meta.familySlug || null,
    goldenId: meta.goldenId || meta.familySlug || null,
    evidenceRecordCount: pipeline.evidenceRecords?.length ?? 0,
    variantCount: pipeline.mergedVariants?.length ?? pipeline.diagnostics?.variantCount ?? 0,
    confidenceScore: pipeline.confidenceScore ?? null,
    conflictFields: pipeline.conflictFields || [],
    attentionFields: pipeline.attentionFields || [],
    mergedFields: pipeline.mergedFields || {},
    evidenceRecords: pipeline.evidenceRecords || [],
    extractedVehicle: pipeline.extractedVehicle || {},
    reviewedVehicle: pipeline.reviewedVehicle || {},
    diagnostics: pipeline.diagnostics || null,
    acquisition: pipeline.acquisition
      ? {
          ok: pipeline.acquisition.ok,
          sourceCount: pipeline.acquisition.sources?.length ?? 0,
          diagnostics: pipeline.acquisition.diagnostics,
        }
      : null,
    v7: pipeline.v7 || null,
  };
}

function buildFieldRows(flat, mergedFields, { attentionOnly = true } = {}) {
  const rows = [];
  for (const group of EXTRACTION_FIELD_GROUPS) {
    for (const key of group.fields) {
      const needsAttention = fieldNeedsAttention(key, mergedFields[key], flat[key]);
      if (attentionOnly && !needsAttention) continue;
      rows.push({
        fieldKey: key,
        label: FIELD_LABELS[key] || key,
        value: formatFieldDisplay(flat[key]),
        rawValue: extractFieldValue(flat[key]),
        confidence: flat[key]?.confidence ?? mergedFields[key]?.confidence ?? null,
        status: mergedFields[key]?.status ?? null,
        needsAttention,
        groupId: group.id,
      });
    }
  }
  return rows;
}

function buildVariantRows(extractedVehicle = {}) {
  const variants = extractedVehicle.variants || [];
  return variants.map((v, idx) => ({
    index: idx,
    name: extractFieldValue(v.variantName),
    price: extractFieldValue(v.price),
    battery: extractFieldValue(v.battery),
    range: extractFieldValue(v.range),
    priceConfidence: v.price?.confidence ?? null,
  }));
}

function buildConflictRows(mergedFields = {}, conflictFields = []) {
  const keys = conflictFields.length
    ? conflictFields
    : Object.entries(mergedFields)
        .filter(([, m]) => m?.status === EVIDENCE_FIELD_STATUS.CONFLICT)
        .map(([k]) => k);

  return keys.map((key) => ({
    fieldKey: key,
    label: FIELD_LABELS[key] || key,
    value: mergedFields[key]?.value ?? null,
    sourceValues: mergedFields[key]?.sourceValues || [],
    message: `Unresolved conflict on ${FIELD_LABELS[key] || key}`,
  }));
}

function buildMissingRows(flat, mergedFields) {
  return REQUIRED_PUBLISH_FIELDS.filter((key) => {
    const val = extractFieldValue(flat[key]);
    return val === null || val === undefined || val === "";
  }).map((key) => ({
    fieldKey: key,
    label: FIELD_LABELS[key] || key,
    status: mergedFields[key]?.status || "missing",
  }));
}

/**
 * Build structured review dossier for human approval UI (v1.1).
 */
export function buildReviewDossier(job = {}, evidencePacket = {}, opts = {}) {
  const attentionOnly = opts.attentionOnly !== false;
  const goldenDossier = opts.goldenDossier || null;
  const extracted = evidencePacket.extractedVehicle || {};
  const mergedFields = evidencePacket.mergedFields || {};
  const flat = flattenExtractionDraft(extracted);
  const attentionKeys = listAttentionFieldKeys(mergedFields, flat);

  const fieldRows = buildFieldRows(flat, mergedFields, { attentionOnly });
  const variantRows = buildVariantRows(extracted);
  const conflictRows = buildConflictRows(mergedFields, evidencePacket.conflictFields);
  const missingRows = buildMissingRows(flat, mergedFields);

  const importRecord = {
    id: job.catalogImportId || job.id,
    extractedVehicle: extracted,
    reviewedVehicle: evidencePacket.reviewedVehicle || extracted,
    evidenceSummary: mergedFields,
  };

  const benchmarkContext = buildBenchmarkContext(
    importRecord,
    evidencePacket.evidenceRecords || [],
    goldenDossier,
    pipelineDiagnostics
  );

  const qualityGates = benchmarkContext.qualityGates ||
    checkPublishQualityGates(importRecord, evidencePacket.evidenceRecords || [], goldenDossier);

  const hiddenDeltas = benchmarkContext.evaluation
    ? buildHiddenBenchmarkDeltas(benchmarkContext.evaluation, attentionKeys)
    : {
        variant: [],
        pricing: [],
        missing: [],
        features: [],
        rows: [],
        hiddenRows: [],
        totalCount: 0,
        hiddenCount: 0,
      };

  const pipelineDiagnostics = evidencePacket.diagnostics || {};
  const estimatedCorrections = benchmarkContext.hasGolden
    ? benchmarkContext.estimatedCorrections
    : estimateManualCorrectionsHeuristic({
        attentionCount: attentionKeys.length,
        conflictCount: conflictRows.length,
        missingCount: missingRows.length,
        benchmarkMismatchCount: hiddenDeltas.totalCount,
      });

  const severeBenchmark = hasSevereBenchmarkMismatch(
    benchmarkContext.evaluation,
    estimatedCorrections
  );

  const publishProbability = computePublishProbability({
    qualityGates,
    estimatedCorrections,
    conflictCount: conflictRows.length,
    hasGolden: benchmarkContext.hasGolden,
    severeBenchmarkMismatch: severeBenchmark,
  });

  const reviewTimeMinutes = estimateReviewMinutes({
    attentionCount: attentionKeys.length,
    conflictCount: conflictRows.length,
    missingCount: missingRows.length,
    variantCount: variantRows.length,
  });

  const correctionTimeMinutes = estimateCorrectionMinutes(estimatedCorrections ?? 0);
  const totalEffortMinutes =
    Math.round((reviewTimeMinutes + correctionTimeMinutes) * 10) / 10;

  const recommendation = computeRecommendation({
    evidencePacket,
    qualityGates,
    benchmarkContext,
    attentionCount: attentionKeys.length,
    conflictCount: conflictRows.length,
    missingCount: missingRows.length,
    estimatedCorrections,
    publishProbability,
    severeBenchmarkMismatch: severeBenchmark,
    benchmarkMismatchCount: hiddenDeltas.totalCount,
    acquisitionOk: evidencePacket.acquisition?.ok !== false,
  });

  const sections = {
    publishReadiness: {
      label: "Publish Readiness",
      alwaysVisible: true,
      recommendation: recommendation.code,
      estimatedCorrections,
      correctionTimeMinutes,
      reviewTimeMinutes,
      totalEffortMinutes,
      publishProbability,
      qualityGateStatus: qualityGates.passed ? "passed" : "failed",
      qualityGateFailureCount: qualityGates.failureCount || 0,
      hasGolden: benchmarkContext.hasGolden,
      goldenId: benchmarkContext.goldenId,
    },
    hiddenBenchmarkDeltas: {
      label: "Hidden Benchmark Deltas",
      alwaysVisible: true,
      variant: hiddenDeltas.variant,
      pricing: hiddenDeltas.pricing,
      missing: hiddenDeltas.missing,
      features: hiddenDeltas.features,
      rows: hiddenDeltas.rows,
      hiddenRows: hiddenDeltas.hiddenRows,
      count: hiddenDeltas.totalCount,
      hiddenCount: hiddenDeltas.hiddenCount,
      hasGolden: benchmarkContext.hasGolden,
    },
    vehicleSummary: {
      label: "Vehicle Summary",
      rows: fieldRows.filter((r) => groupFieldsById(["vehicle"]).some((g) => g.fields.includes(r.fieldKey))),
    },
    pricingSummary: {
      label: "Pricing Summary",
      rows: fieldRows.filter((r) => groupFieldsById(["pricing"]).some((g) => g.fields.includes(r.fieldKey))),
    },
    batteryRange: {
      label: "Battery & Range",
      rows: fieldRows.filter((r) =>
        groupFieldsById(["battery", "range"]).some((g) => g.fields.includes(r.fieldKey))
      ),
    },
    charging: {
      label: "Charging",
      rows: fieldRows.filter((r) => groupFieldsById(["charging"]).some((g) => g.fields.includes(r.fieldKey))),
    },
    features: {
      label: "Features",
      rows: fieldRows.filter((r) =>
        groupFieldsById(["features", "safety"]).some((g) => g.fields.includes(r.fieldKey))
      ),
    },
    variantTable: {
      label: "Variant Table",
      rows: variantRows,
      totalVariants: variantRows.length,
    },
    conflicts: {
      label: "Conflicts",
      rows: conflictRows,
      count: conflictRows.length,
    },
    missingFields: {
      label: "Missing Fields",
      rows: missingRows,
      count: missingRows.length,
    },
    confidence: {
      label: "Confidence",
      score: evidencePacket.confidenceScore ?? null,
      attentionCount: attentionKeys.length,
      attentionFields: attentionKeys,
      evidenceRecordCount: evidencePacket.evidenceRecordCount ?? 0,
    },
  };

  return {
    generatedAt: new Date().toISOString(),
    agentVersion: "v1.1",
    jobId: job.id,
    status: job.status,
    attentionOnly,
    sectionOrder: DOSSIER_SECTIONS.map((s) => s.id),
    sections,
    recommendation,
    qualityGates: {
      passed: qualityGates.passed,
      failureCount: qualityGates.failureCount,
      failures: qualityGates.failures?.slice(0, 12) || [],
      goldenAware: Boolean(goldenDossier),
    },
    metrics: {
      reviewTimeMinutes,
      correctionTimeMinutes,
      totalEffortMinutes,
      estimatedCorrections,
      publishProbability,
    },
    benchmarkContext: {
      hasGolden: benchmarkContext.hasGolden,
      goldenId: benchmarkContext.goldenId,
      estimatedCorrections,
    },
    estimatedReviewMinutes: reviewTimeMinutes,
    estimatedCorrectionMinutes: correctionTimeMinutes,
    estimatedTotalEffortMinutes: totalEffortMinutes,
  };
}

/**
 * v1.1 recommendation — replaces zero-attention READY logic.
 */
export function computeRecommendation({
  evidencePacket = {},
  qualityGates = {},
  benchmarkContext = {},
  attentionCount = 0,
  conflictCount = 0,
  missingCount = 0,
  estimatedCorrections = null,
  publishProbability = 0,
  severeBenchmarkMismatch = false,
  benchmarkMismatchCount = 0,
  acquisitionOk = true,
} = {}) {
  if (!acquisitionOk) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.BLOCKED,
      reason: "Source acquisition failed — publish impossible",
    };
  }

  if (isCriticalGateFailure(qualityGates, missingCount)) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.BLOCKED,
      reason: buildBlockedReason(qualityGates, missingCount, severeBenchmarkMismatch),
    };
  }

  if (severeBenchmarkMismatch) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.BLOCKED,
      reason: `Severe benchmark mismatches (${estimatedCorrections ?? "many"} estimated corrections)`,
    };
  }

  if (conflictCount > 0) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `${conflictCount} unresolved conflict(s)`,
    };
  }

  const corrections = estimatedCorrections ?? 0;
  const hasGolden = benchmarkContext.hasGolden === true;

  if (
    qualityGates.passed &&
    corrections <= 10 &&
    conflictCount === 0 &&
    attentionCount === 0 &&
    isPublishProbabilityHigh(publishProbability) &&
    hasGolden
  ) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.READY,
      reason: "Quality gates pass, ≤10 corrections, high publish probability",
    };
  }

  if (!qualityGates.passed) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `${qualityGates.failureCount || 1} quality gate issue(s) — publishing may be possible after review`,
    };
  }

  if (corrections > 10) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `${corrections} estimated corrections (>10)`,
    };
  }

  if (attentionCount > 0) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `${attentionCount} attention field(s)`,
    };
  }

  if (benchmarkMismatchCount > 0) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `${benchmarkMismatchCount} benchmark mismatch(es)`,
    };
  }

  if (!hasGolden) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: "No golden dossier — manual verification required before publish",
    };
  }

  if (!isPublishProbabilityHigh(publishProbability)) {
    return {
      code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
      reason: `Publish probability ${publishProbability}% below high-confidence threshold`,
    };
  }

  return {
    code: VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED,
    reason: "Human review required before publish",
  };
}

function buildBlockedReason(qualityGates, missingCount, severeBenchmark) {
  const parts = [];
  if (missingCount >= 2) parts.push(`${missingCount} required fields missing`);
  if (qualityGates.failureCount) parts.push(`${qualityGates.failureCount} critical gate failure(s)`);
  if (severeBenchmark) parts.push("severe benchmark mismatches");
  return parts.join("; ") || "Publish impossible";
}

/** Review scan time only — separate from correction time. */
export function estimateReviewMinutes({
  attentionCount = 0,
  conflictCount = 0,
  missingCount = 0,
  variantCount = 0,
} = {}) {
  const minutes =
    2 +
    attentionCount * 0.4 +
    conflictCount * 0.75 +
    missingCount * 0.5 +
    Math.max(0, variantCount - 3) * 0.25;
  return Math.round(Math.min(30, Math.max(2, minutes)) * 10) / 10;
}

export function workflowCompleteStatus(pipelineOk) {
  return pipelineOk ? VEHICLE_CREATION_STATUS.REVIEW_REQUIRED : VEHICLE_CREATION_STATUS.REJECTED;
}
