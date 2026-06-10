/**
 * Evidence pipeline core — v2 multi-source (manual content) path.
 */

import { IMPORT_STATUS, EVIDENCE_SOURCE_TYPE } from "./constants.js";
import { acquireEvidenceFromSources } from "./connectors/index.js";
import {
  mergeAllEvidence,
  mergedFieldsToExtractionDraft,
  aggregateMergedConfidence,
} from "./evidenceMerger.js";
import {
  listConflictFieldKeys,
  requiresManualReview,
} from "./conflictDetection.js";
import { initializeReviewedVehicle } from "./normalizeExtracted.js";
import { ALL_SCALAR_FIELD_KEYS, listAttentionFieldKeys } from "./extractionSchema.js";

export function buildSourceInputsFromForm(form = {}) {
  const sources = [];

  if (form.pdfContent?.trim()) {
    sources.push({
      type: EVIDENCE_SOURCE_TYPE.OEM_PDF,
      content: form.pdfContent,
      name: form.pdfName || "OEM PDF Brochure",
      url: form.pdfUrl || null,
    });
  }

  if (form.oemUrl && form.oemContent?.trim()) {
    sources.push({
      type: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
      content: form.oemContent,
      url: form.oemUrl,
      name: form.oemName || form.oemUrl,
    });
  }

  for (const ref of form.referenceSources || []) {
    if (ref.url && ref.content?.trim()) {
      sources.push({
        type: EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE,
        content: ref.content,
        url: ref.url,
        name: ref.name,
      });
    }
  }

  if (form.searchContent?.trim()) {
    sources.push({
      type: EVIDENCE_SOURCE_TYPE.SEARCH_RESULT,
      content: form.searchContent,
      url: form.searchUrl || null,
      name: form.searchName || "Search Result",
    });
  }

  return sources;
}

export function findMissingFields(records = []) {
  const present = new Set(records.map((r) => r.fieldName));
  return ALL_SCALAR_FIELD_KEYS.filter((f) => !present.has(f));
}

export async function runEvidencePipeline({ importId, sources = [] }) {
  if (!sources.length) {
    return {
      ok: false,
      errors: ["At least one source with content is required"],
    };
  }

  const firstPass = await acquireEvidenceFromSources({ importId, sources });
  const missingFields = findMissingFields(firstPass.records);

  let allRecords = firstPass.records;
  let connectorDiagnostics = firstPass.diagnostics;

  const hasSearchSource = sources.some(
    (s) => s.type === EVIDENCE_SOURCE_TYPE.SEARCH_RESULT
  );
  if (hasSearchSource && missingFields.length) {
    const searchOnly = sources.filter(
      (s) => s.type === EVIDENCE_SOURCE_TYPE.SEARCH_RESULT
    );
    const searchPass = await acquireEvidenceFromSources({
      importId,
      sources: searchOnly,
      missingFields,
    });
    allRecords = [...allRecords, ...searchPass.records];
    connectorDiagnostics = [...connectorDiagnostics, ...searchPass.diagnostics];
  }

  const mergedFields = mergeAllEvidence(allRecords);
  const conflictFields = listConflictFieldKeys(mergedFields);
  const manualReview = requiresManualReview(mergedFields);
  const confidenceScore = aggregateMergedConfidence(mergedFields);

  const extractedVehicle = mergedFieldsToExtractionDraft(mergedFields, {
    importId,
    sourceCount: sources.length,
    evidenceRecordCount: allRecords.length,
    evidenceEngine: "multi-source-v2",
  });

  const reviewedVehicle = initializeReviewedVehicle(extractedVehicle);
  const attentionFields = listAttentionFieldKeys(mergedFields);

  return {
    ok: true,
    status: IMPORT_STATUS.REVIEW_REQUIRED,
    evidenceRecords: allRecords,
    mergedFields,
    conflictFields,
    attentionFields,
    manualReview,
    confidenceScore,
    extractedVehicle,
    reviewedVehicle,
    diagnostics: {
      step: "evidence_pipeline_v2",
      connectorDiagnostics,
      sourceCount: sources.length,
      evidenceRecordCount: allRecords.length,
      conflictCount: conflictFields.length,
      conflictFields,
      attentionCount: attentionFields.length,
      attentionFields,
    },
  };
}

export function resolveFieldConflict(mergedFields, fieldName, selectedValue) {
  const next = structuredClone(mergedFields);
  const field = next[fieldName];
  if (!field) return next;

  next[fieldName] = {
    ...field,
    value: selectedValue,
    status: "resolved",
    manualReview: false,
    confidence: Math.max(field.confidence ?? 70, 85),
    resolvedBy: "admin",
    resolvedAt: new Date().toISOString(),
  };
  return next;
}
