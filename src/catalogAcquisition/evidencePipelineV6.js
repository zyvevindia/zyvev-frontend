/**
 * Evidence pipeline v6 — identity recovery, feature mapping, variant reconciliation.
 * Acquisition unchanged (v3). Extraction prompts unchanged. Post-process only.
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
import { listConflictFieldKeys, requiresManualReview } from "./conflictDetection.js";
import { initializeReviewedVehicle } from "./normalizeExtracted.js";
import { listAttentionFieldKeys } from "./extractionSchema.js";
import { findMissingFields } from "./evidencePipelineCore.js";
import {
  collectIdentitySignals,
  resolveIdentity,
  identityToEvidenceRecords,
  applyIdentityToMergedFields,
} from "./v6/identityRecovery.js";
import { mapFeaturesFromSources, applyFeaturesToMergedFields } from "./v6/featureMapping.js";
import { reconcileVariants } from "./v6/variantReconciliation.js";
import { analyzeGateFailures } from "./v6/gateFailureAnalysis.js";
import { runFullBenchmarkReport } from "./benchmark/benchmarkReport.js";
import { loadGoldenDossier } from "./benchmark/goldenLoaderNode.js";

export async function runEvidencePipelineV6(params = {}) {
  const {
    importId,
    oemUrl,
    referenceUrls = [],
    pdfBuffer,
    pdfName,
    pdfUrl,
    aiConfig,
    familySlug,
    goldenId,
  } = params;
  const startedAt = Date.now();

  const acquisition = await acquireAllSources({
    oemUrl,
    referenceUrls,
    pdfBuffer,
    pdfName,
    pdfUrl,
  });

  if (!acquisition.ok) {
    return {
      ok: false,
      errors: acquisition.errors || ["Source acquisition failed"],
      diagnostics: { step: "acquisition", acquisition },
    };
  }

  const config = aiConfig || resolveAiExtractionConfig();

  const identitySignals = collectIdentitySignals(acquisition.sources, { oemUrl, familySlug });
  const resolvedIdentity = resolveIdentity(identitySignals);
  const identityRecords = identityToEvidenceRecords(resolvedIdentity, {
    importId,
    oemUrl,
    sourceName: "v6-identity-recovery",
  });

  const featureRecords = mapFeaturesFromSources(acquisition.sources, { importId });

  const allRecords = [...identityRecords, ...featureRecords];
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
  let mergedFields = mergeAllEvidence(allRecords);
  mergedFields = applyIdentityToMergedFields(mergedFields, resolvedIdentity);
  mergedFields = applyFeaturesToMergedFields(mergedFields, featureRecords);

  const mergedVariants = reconcileVariants(mergeVariantExtractions(variantLists));
  const conflictFields = listConflictFieldKeys(mergedFields);
  const manualReview = requiresManualReview(mergedFields);
  const confidenceScore = aggregateMergedConfidence(mergedFields);

  const extractedVehicle = mergedFieldsToExtractionDraft(
    mergedFields,
    {
      importId,
      sourceCount: acquisition.sources.length,
      evidenceRecordCount: allRecords.length,
      acquisitionEngine: "v6-identity-feature-variant",
      aiProvider: config.provider,
      aiConfigured: config.configured,
      v6Identity: resolvedIdentity,
      v6FeatureRecords: featureRecords.length,
      v6VariantReconciled: true,
    },
    mergedVariants
  );

  const reviewedVehicle = initializeReviewedVehicle(extractedVehicle);
  const attentionFields = listAttentionFieldKeys(mergedFields);

  let gateFailureAnalysis = null;
  let benchmarkReport = null;
  const gId = goldenId || familySlug || resolvedIdentity?.familySlug;
  if (gId) {
    try {
      const golden = loadGoldenDossier(gId);
      const importRecord = {
        id: importId,
        extractedVehicle,
        reviewedVehicle,
        evidenceSummary: mergedFields,
      };
      benchmarkReport = runFullBenchmarkReport({
        importRecord,
        goldenDossier: golden,
        evidenceRecords: allRecords,
      });
      gateFailureAnalysis = analyzeGateFailures({
        qualityGates: benchmarkReport.qualityGates,
        evaluation: benchmarkReport.evaluation,
        importRecord,
        goldenDossier: golden,
      });
    } catch {
      /* golden optional */
    }
  }

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
    v6: {
      identity: resolvedIdentity,
      identityRecordCount: identityRecords.length,
      featureRecordCount: featureRecords.length,
      variantCountBeforeReconcile: mergeVariantExtractions(variantLists).length,
      variantCountAfterReconcile: mergedVariants.length,
      gateFailureAnalysis,
      benchmarkReport,
    },
    diagnostics: {
      step: "evidence_pipeline_v6",
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
