/**
 * Evidence pipeline v3 — server-only (auto-acquire + AI). Do not import from browser bundles.
 */

import { IMPORT_STATUS, EVIDENCE_TRUST_SCORE } from "./constants.js";
import { acquireAllSources } from "./acquisition/index.js";
import { extractSourceToEvidence, mergeVariantExtractions } from "./ai/extractToEvidence.js";
import { resolveAiExtractionConfig } from "./ai/config.js";
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
import { listAttentionFieldKeys } from "./extractionSchema.js";
import { findMissingFields } from "./evidencePipelineCore.js";

export async function runEvidencePipelineV3(params = {}) {
  const { importId, oemUrl, referenceUrls = [], pdfBuffer, pdfName, aiConfig } = params;
  const startedAt = Date.now();

  const acquisition = await acquireAllSources({
    oemUrl,
    referenceUrls,
    pdfBuffer,
    pdfName,
  });

  if (!acquisition.ok) {
    return {
      ok: false,
      errors: acquisition.errors || ["Source acquisition failed"],
      diagnostics: { step: "acquisition", acquisition },
    };
  }

  const config = aiConfig || resolveAiExtractionConfig();
  const allRecords = [];
  const variantLists = [];
  const extractionDiagnostics = [];

  for (const source of acquisition.sources) {
    const extracted = await extractSourceToEvidence({
      importId,
      content: source.content,
      sourceType: source.type,
      sourceName: source.name,
      sourceUrl: source.url,
      trustScore: EVIDENCE_TRUST_SCORE[source.type] ?? 60,
      aiConfig: config,
    });

    extractionDiagnostics.push({
      source: source.name,
      sourceType: source.type,
      ok: extracted.ok,
      recordCount: extracted.records?.length ?? 0,
      variantCount: extracted.variants?.length ?? 0,
      meta: extracted.meta,
      errors: extracted.errors,
    });

    if (extracted.ok) {
      allRecords.push(...(extracted.records || []));
      if (extracted.variants?.length) variantLists.push(extracted.variants);
    }
  }

  const missingFields = findMissingFields(allRecords);
  const mergedFields = mergeAllEvidence(allRecords);
  const mergedVariants = mergeVariantExtractions(variantLists);
  const conflictFields = listConflictFieldKeys(mergedFields);
  const manualReview = requiresManualReview(mergedFields);
  const confidenceScore = aggregateMergedConfidence(mergedFields);

  const extractedVehicle = mergedFieldsToExtractionDraft(
    mergedFields,
    {
      importId,
      sourceCount: acquisition.sources.length,
      evidenceRecordCount: allRecords.length,
      acquisitionEngine: "v3-automated",
      aiProvider: config.provider,
      aiConfigured: config.configured,
    },
    mergedVariants
  );

  const reviewedVehicle = initializeReviewedVehicle(extractedVehicle);
  const attentionFields = listAttentionFieldKeys(mergedFields);

  return {
    ok: true,
    status: IMPORT_STATUS.REVIEW_REQUIRED,
    evidenceRecords: allRecords,
    mergedFields,
    mergedVariants,
    conflictFields,
    attentionFields,
    manualReview,
    confidenceScore,
    extractedVehicle,
    reviewedVehicle,
    acquisition,
    diagnostics: {
      step: "evidence_pipeline_v3",
      elapsedMs: Date.now() - startedAt,
      acquisitionDiagnostics: acquisition.diagnostics,
      extractionDiagnostics,
      sourceCount: acquisition.sources.length,
      evidenceRecordCount: allRecords.length,
      variantCount: mergedVariants.length,
      conflictCount: conflictFields.length,
      conflictFields,
      attentionCount: attentionFields.length,
      attentionFields,
      missingFields,
      aiProvider: config.provider,
      aiConfigured: config.configured,
    },
  };
}
