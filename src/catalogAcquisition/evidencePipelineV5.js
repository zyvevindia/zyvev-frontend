/**
 * Evidence pipeline v5 — hardened acquisition + unchanged extraction merge.
 * Does not modify extraction prompts or providers.
 */

import { IMPORT_STATUS, EVIDENCE_TRUST_SCORE } from "./constants.js";
import { acquireAllSourcesV5 } from "./acquisition/acquireV5.js";
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
import { buildAcquisitionMetrics, buildContentComparisonMetrics } from "./acquisition/acquisitionMetrics.js";
import { loadRegistryEntry } from "./sourceRegistry/registryLoader.js";
import { SOURCE_REGISTRY_STATUS } from "./constants.js";

/**
 * Measure evidence yield per content layer (heuristic-only, no prompt changes).
 */
async function measureLayerEvidence(importId, content, sourceMeta, aiConfig) {
  if (!content?.trim()) return { evidenceRecordCount: 0 };
  const heuristicConfig = { ...aiConfig, provider: "heuristic", grounded: false };
  const result = await extractSourceToEvidence({
    importId,
    content: content.slice(0, 120_000),
    sourceType: sourceMeta.sourceType,
    sourceName: sourceMeta.sourceName,
    sourceUrl: sourceMeta.sourceUrl,
    trustScore: sourceMeta.trustScore,
    aiConfig: heuristicConfig,
  });
  return { evidenceRecordCount: result.records?.length ?? 0, ok: result.ok };
}

export async function runEvidencePipelineV5(params = {}) {
  const {
    importId,
    oemUrl,
    referenceUrls = [],
    pdfBuffer,
    pdfName,
    aiConfig,
    familySlug,
    registryEntry,
    measureContentLayers = true,
    usePlaywright = true,
  } = params;

  const startedAt = Date.now();
  const registry =
    registryEntry || (familySlug ? await loadRegistryEntry(familySlug) : null);

  const effectiveOemUrl = oemUrl || registry?.officialUrl || null;
  const onRegistryStatusChange = params.onRegistryStatusChange;

  const acquisition = await acquireAllSourcesV5({
    oemUrl: effectiveOemUrl,
    brochureUrl: registry?.brochureUrl || null,
    referenceUrls: registry?.referenceUrls || referenceUrls,
    pdfBuffer,
    pdfName,
    familySlug,
    brand: registry?.brand,
    model: registry?.model,
    vehicleKeywords: registry?.vehicleKeywords,
    usePlaywright,
    onRegistryStatusChange,
  });

  if (!acquisition.ok) {
    return {
      ok: false,
      errors: acquisition.errors || ["Source acquisition failed"],
      warnings: acquisition.warnings,
      diagnostics: { step: "acquisition_v5", acquisition },
      acquisition,
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

  const oemSource = acquisition.sources.find((s) => s.type === "OEM_WEBSITE");
  let contentComparison = null;
  if (measureContentLayers && oemSource?.layers) {
    const meta = {
      sourceType: oemSource.type,
      sourceName: oemSource.name,
      sourceUrl: oemSource.url,
      trustScore: EVIDENCE_TRUST_SCORE.OEM_WEBSITE,
    };
    const [rawM, renderedM, pdfSource] = await Promise.all([
      measureLayerEvidence(importId, oemSource.layers.rawHtml, meta, config),
      measureLayerEvidence(
        importId,
        oemSource.layers.visibleText || oemSource.layers.renderedHtml,
        meta,
        config
      ),
      acquisition.sources.find((s) => s.type === "OEM_PDF")
        ? measureLayerEvidence(
            importId,
            acquisition.sources.find((s) => s.type === "OEM_PDF").content,
            { ...meta, sourceType: "OEM_PDF", trustScore: 100 },
            config
          )
        : Promise.resolve({ evidenceRecordCount: 0 }),
    ]);
    contentComparison = buildContentComparisonMetrics(
      {
        htmlSize: acquisition.rawHtmlSize,
        visibleTextSize: stripLen(oemSource.layers.rawHtml),
        evidenceRecordCount: rawM.evidenceRecordCount,
      },
      {
        htmlSize: oemSource.layers.renderedHtml?.length ?? 0,
        visibleTextSize: acquisition.renderedTextSize,
        evidenceRecordCount: renderedM.evidenceRecordCount,
      },
      {
        byteSize: pdfBuffer?.length ?? 0,
        evidenceRecordCount: pdfSource.evidenceRecordCount,
      }
    );
  }

  const missingFields = findMissingFields(allRecords);
  const mergedFields = mergeAllEvidence(allRecords);
  const mergedVariants = mergeVariantExtractions(variantLists);
  const conflictFields = listConflictFieldKeys(mergedFields);
  const manualReview = requiresManualReview(mergedFields);
  const confidenceScore = aggregateMergedConfidence(mergedFields);

  const acquisitionMetrics = buildAcquisitionMetrics({
    evidenceRecordCount: allRecords.length,
    rawHtmlSize: acquisition.rawHtmlSize,
    renderedTextSize: acquisition.renderedTextSize,
    urlValid: acquisition.urlValidation?.valid ?? false,
    pdfFound: acquisition.pdfFound,
    oemAcquired: acquisition.oemAcquired,
  });

  const extractedVehicle = mergedFieldsToExtractionDraft(
    mergedFields,
    {
      importId,
      sourceCount: acquisition.sources.length,
      evidenceRecordCount: allRecords.length,
      acquisitionEngine: "v5-hardened",
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
    registry,
    warnings: acquisition.warnings,
    acquisitionMetrics,
    contentComparison,
    diagnostics: {
      step: "evidence_pipeline_v5",
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
      urlValidation: acquisition.urlValidation,
      pdfDiscovery: acquisition.pdfDiscovery,
      acquisitionMetrics,
      contentComparison,
      registryStatus: acquisition.urlValidation?.valid
        ? SOURCE_REGISTRY_STATUS.VERIFIED
        : SOURCE_REGISTRY_STATUS.NEEDS_VERIFICATION,
    },
  };
}

function stripLen(html) {
  if (!html) return 0;
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}
