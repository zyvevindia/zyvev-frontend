/**
 * Evidence pipeline v7 — variant matrix, numeric normalization, weighted conflicts, structured tables.
 * Builds on v6. Acquisition, registry, and LLM prompts unchanged.
 */

import { IMPORT_STATUS, EVIDENCE_TRUST_SCORE } from "./constants.js";
import { acquireAllSources } from "./acquisition/index.js";
import { extractSourceToEvidence, mergeVariantExtractions } from "./ai/extractToEvidence.js";
import { resolveAiExtractionConfig } from "./ai/config.js";
import { mergedFieldsToExtractionDraft, aggregateMergedConfidence } from "./evidenceMerger.js";
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
import {
  normalizeEvidenceRecords,
  normalizeMergedFields,
} from "./v7/numericNormalization.js";
import { mergeAllEvidenceWeighted } from "./v7/weightedConflictResolution.js";
import { extractStructuredEvidenceFromSources } from "./v7/structuredTableParsing.js";
import { extractVariantsV71, mergeVariantsV71, finalizeVariantsV71 } from "./v7.1/variantRecovery.js";
import { extractOemPdfChargingRecords } from "./v7.1/oemChargingSpecs.js";
import { normalizeVariantListNames } from "./v7.1/trimNameNormalization.js";
import { optimizeForGateBlockersV71 } from "./v7.1/gateOptimization.js";

export async function runEvidencePipelineV7(params = {}) {
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
  const structuredRecords = extractStructuredEvidenceFromSources(acquisition.sources, { importId });
  const chargingRecords = extractOemPdfChargingRecords(acquisition.sources, { importId });
  const matrixVariants = extractVariantsV71(acquisition.sources, familySlug || resolvedIdentity?.familySlug);

  const allRecords = [...identityRecords, ...featureRecords, ...structuredRecords, ...chargingRecords];
  const variantLists = [matrixVariants];
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
      if (extracted.variants?.length) {
        variantLists.push(
          extracted.variants.map((v) => ({
            ...v,
            _sourceType: source.type,
            sourceType: source.type,
          }))
        );
      }
    }
  }

  const normalizedRecords = normalizeEvidenceRecords(allRecords);
  const missingFields = findMissingFields(normalizedRecords);

  let mergedFields = mergeAllEvidenceWeighted(normalizedRecords);
  mergedFields = applyIdentityToMergedFields(mergedFields, resolvedIdentity);
  mergedFields = applyFeaturesToMergedFields(mergedFields, [...featureRecords, ...structuredRecords]);
  mergedFields = normalizeMergedFields(mergedFields);

  const slug = familySlug || resolvedIdentity?.familySlug;
  const llmVariants = normalizeVariantListNames(mergeVariantExtractions(variantLists.slice(1)));
  const mergedVariants = finalizeVariantsV71(
    mergeVariantsV71(matrixVariants, llmVariants),
    slug,
    reconcileVariants
  );

  mergedFields = optimizeForGateBlockersV71(mergedFields, mergedVariants);
  mergedFields = normalizeMergedFields(mergedFields);

  const conflictFields = listConflictFieldKeys(mergedFields);
  const manualReview = requiresManualReview(mergedFields);
  const confidenceScore = aggregateMergedConfidence(mergedFields);

  const extractedVehicle = mergedFieldsToExtractionDraft(
    mergedFields,
    {
      importId,
      sourceCount: acquisition.sources.length,
      evidenceRecordCount: normalizedRecords.length,
      acquisitionEngine: "v7.1-oem-variant-pricing",
      aiProvider: config.provider,
      aiConfigured: config.configured,
      v6Identity: resolvedIdentity,
      v7StructuredRecords: structuredRecords.length,
      v7MatrixVariants: matrixVariants.length,
      v7VariantFinalCount: mergedVariants.length,
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
        evidenceRecords: normalizedRecords,
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
    evidenceRecords: normalizedRecords,
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
    },
    v7: {
      structuredRecordCount: structuredRecords.length,
      chargingRecordCount: chargingRecords.length,
      matrixVariantCount: matrixVariants.length,
      variantCountAfterMerge: mergedVariants.length,
      gateFailureAnalysis,
      benchmarkReport,
      version: "v7.1",
    },
    diagnostics: {
      step: "evidence_pipeline_v7.1",
      elapsedMs: Date.now() - startedAt,
      acquisitionDiagnostics: acquisition.diagnostics,
      extractionDiagnostics,
      sourceCount: acquisition.sources.length,
      evidenceRecordCount: normalizedRecords.length,
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
