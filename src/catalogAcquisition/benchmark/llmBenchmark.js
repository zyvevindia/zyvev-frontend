/**
 * LLM provider benchmark — identical inputs, forced provider (no fallback).
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { resolveAiExtractionConfig } from "../ai/config.js";
import { extractWithOpenAi } from "../ai/providers/openai.js";
import { extractWithAnthropic } from "../ai/providers/anthropic.js";
import { extractWithHeuristic } from "../ai/providers/heuristic.js";
import {
  aiFieldsToEvidenceRecords,
  normalizeVariantRow,
} from "../evidenceRecord.js";
import {
  mergeAllEvidence,
  mergedFieldsToExtractionDraft,
} from "../evidenceMerger.js";
import { initializeReviewedVehicle } from "../normalizeExtracted.js";
import { listAttentionFieldKeys } from "../extractionSchema.js";
import { runFullBenchmarkReport } from "./benchmarkReport.js";
import { getBenchmarkInput, BENCHMARK_PROVIDER_IDS } from "./benchmarkFixtures.js";
import { estimateReviewMinutes, extractBenchmarkMetrics } from "./reviewTimeEstimate.js";
import { estimateTokenCostUsd } from "./costAnalysis.js";

const SOURCE_CONTEXT = {
  sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
  sourceName: "Benchmark OEM",
  trustScore: 95,
};

async function callProvider(providerId, content, context, envConfig) {
  const ctx = { ...context, sourceType: SOURCE_CONTEXT.sourceType };

  if (providerId === BENCHMARK_PROVIDER_IDS.OPENAI) {
    return extractWithOpenAi(content, ctx, {
      apiKey: envConfig.openaiKey,
      model: envConfig.openaiModel,
    });
  }
  if (providerId === BENCHMARK_PROVIDER_IDS.ANTHROPIC) {
    return extractWithAnthropic(content, ctx, {
      apiKey: envConfig.anthropicKey,
      model: envConfig.anthropicModel,
    });
  }
  return extractWithHeuristic(content, ctx);
}

function buildImportRecordFromExtraction({
  importId,
  goldenId,
  aiResult,
  providerId,
  elapsedMs,
  goldenDossier,
}) {
  const extractionMethod =
    aiResult.extractionMethod ||
    (providerId === BENCHMARK_PROVIDER_IDS.HEURISTIC ?
      "heuristic-v1"
    : `ai-${providerId}`);

  const sourceUrl = `https://benchmark.evsavari.local/${goldenId}`;
  const records = aiFieldsToEvidenceRecords(aiResult.fields || {}, {
    importId,
    sourceType: SOURCE_CONTEXT.sourceType,
    sourceName: SOURCE_CONTEXT.sourceName,
    sourceUrl,
    trustScore: SOURCE_CONTEXT.trustScore,
    extractionMethod,
  });

  const variants = (aiResult.variants || []).map(normalizeVariantRow);
  const mergedFields = mergeAllEvidence(records);
  const extractedVehicle = mergedFieldsToExtractionDraft(
    mergedFields,
    {
      importId,
      evidenceEngine: `benchmark-${providerId}`,
      aiProvider: providerId,
      aiModel: aiResult.model,
    },
    variants
  );
  const reviewedVehicle = initializeReviewedVehicle(extractedVehicle);
  const attentionFields = listAttentionFieldKeys(mergedFields);
  const reviewTimeEstimate = estimateReviewMinutes(attentionFields.length);

  return {
    importRecord: {
      id: importId,
      extractedVehicle,
      reviewedVehicle,
      evidenceSummary: mergedFields,
      confidenceScore: extractedVehicle.meta?.confidence,
    },
    evidenceRecords: records,
    attentionCount: attentionFields.length,
    reviewTimeEstimate,
    elapsedMs,
    usage: aiResult.usage || {},
    model: aiResult.model,
    ok: aiResult.ok !== false,
    errors: aiResult.errors,
  };
}

/**
 * Run one provider against one golden dossier with identical input content.
 */
export async function runProviderBenchmark({
  providerId,
  goldenDossier,
  env = process.env,
  contentOverride = null,
} = {}) {
  const goldenId = goldenDossier.id;
  const content = contentOverride ?? getBenchmarkInput(goldenId);
  if (!content?.trim()) {
    return {
      ok: false,
      providerId,
      goldenId,
      errors: [`No benchmark input for ${goldenId}`],
    };
  }

  const envConfig = {
    openaiKey: env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY,
    anthropicKey: env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY,
    openaiModel: env.CATALOG_OPENAI_MODEL || "gpt-4o-mini",
    anthropicModel: env.CATALOG_ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
  };

  if (providerId === BENCHMARK_PROVIDER_IDS.OPENAI && !envConfig.openaiKey) {
    return { ok: false, providerId, goldenId, skipped: true, reason: "OPENAI_API_KEY not set" };
  }
  if (providerId === BENCHMARK_PROVIDER_IDS.ANTHROPIC && !envConfig.anthropicKey) {
    return {
      ok: false,
      providerId,
      goldenId,
      skipped: true,
      reason: "ANTHROPIC_API_KEY not set",
    };
  }

  const importId = `llm-bench-${providerId}-${goldenId}`;
  const startedAt = Date.now();

  const aiResult = await callProvider(
    providerId,
    content,
    { sourceName: SOURCE_CONTEXT.sourceName, sourceUrl: `https://benchmark.evsavari.local/${goldenId}` },
    envConfig
  );

  const elapsedMs = Date.now() - startedAt;

  if (!aiResult.ok && providerId !== BENCHMARK_PROVIDER_IDS.HEURISTIC) {
    return {
      ok: false,
      providerId,
      goldenId,
      errors: aiResult.errors || ["Provider extraction failed"],
      elapsedMs,
    };
  }

  const built = buildImportRecordFromExtraction({
    importId,
    goldenId,
    aiResult,
    providerId,
    elapsedMs,
    goldenDossier,
  });

  const report = runFullBenchmarkReport({
    importRecord: built.importRecord,
    goldenDossier,
    evidenceRecords: built.evidenceRecords,
    grounding: aiResult.grounding || null,
  });

  const cost = estimateTokenCostUsd(providerId, aiResult.model, aiResult.usage);

  return {
    ok: true,
    providerId,
    goldenId,
    goldenDisplayName: goldenDossier.displayName,
    model: built.model,
    elapsedMs,
    usage: aiResult.usage,
    costUsd: cost.totalUsd,
    attentionCount: built.attentionCount,
    reviewTimeEstimate: built.reviewTimeEstimate,
    extractionMode:
      aiResult.extractionMode ||
      aiResult.extractionMethod ||
      (providerId === BENCHMARK_PROVIDER_IDS.HEURISTIC ? "heuristic-v1" : `ai-${providerId}`),
    grounding: aiResult.grounding || null,
    report: {
      ...report,
      attentionCount: built.attentionCount,
      reviewTimeEstimate: built.reviewTimeEstimate,
      providerId,
      model: built.model,
      elapsedMs,
      extractionMode: aiResult.extractionMode,
    },
    metrics: extractBenchmarkMetrics({
      ...report,
      attentionCount: built.attentionCount,
      reviewTimeEstimate: built.reviewTimeEstimate,
    }),
    errors: aiResult.errors,
  };
}

/**
 * Aggregate results for one provider across all golden vehicles.
 */
export function aggregateLlmProviderResults(providerId, runs = [], model = null) {
  const completed = runs.filter((r) => r.ok && r.metrics);
  const skipped = runs.filter((r) => r.skipped);
  const failed = runs.filter((r) => !r.ok && !r.skipped);

  const avg = (key) => {
    const vals = completed.map((r) => r.metrics[key]).filter((n) => Number.isFinite(n));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const latencies = completed.map((r) => r.elapsedMs).filter(Number.isFinite);
  const avgLatencyMs = latencies.length ?
    Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
  : null;

  const reviewEstimates = completed.map((r) => r.reviewTimeEstimate).filter(Boolean);
  const avgReviewMid =
    reviewEstimates.length ?
      reviewEstimates.reduce((a, e) => a + (e.min + e.max) / 2, 0) / reviewEstimates.length
    : null;

  return {
    providerId,
    model: model || completed[0]?.model || null,
    ran: completed.length > 0,
    skipped: skipped.length > 0,
    skipReason: skipped[0]?.reason,
    failedCount: failed.length,
    vehicleCount: runs.length,
    completedCount: completed.length,
    metrics: {
      fieldAccuracy: avg("fieldAccuracy"),
      priceAccuracy: avg("priceAccuracy"),
      variantAccuracy: avg("variantAccuracy"),
      featureAccuracy: avg("featureAccuracy"),
      coverageScore: avg("coverageScore"),
      averageEvidenceQuality: avg("averageEvidenceQuality"),
      hallucinationRate: avg("hallucinationRate"),
    },
    gatePassRate:
      completed.length ?
        completed.filter((r) => r.metrics.qualityGatesPassed).length / completed.length
      : null,
    avgLatencyMs,
    avgReviewMinutes: avgReviewMid ? Math.round(avgReviewMid * 10) / 10 : null,
    runs: completed,
    failures: failed.map((r) => ({ goldenId: r.goldenId, errors: r.errors })),
  };
}

/**
 * Build side-by-side provider comparison table.
 */
export function buildProviderComparisonReport(providerAggregates = []) {
  const providers = providerAggregates.filter((p) => p.ran);
  const metricKeys = [
    "fieldAccuracy",
    "priceAccuracy",
    "variantAccuracy",
    "featureAccuracy",
    "coverageScore",
    "hallucinationRate",
  ];

  const comparison = {};
  for (const key of metricKeys) {
    comparison[key] = {};
    for (const p of providers) {
      comparison[key][p.providerId] = p.metrics[key];
    }
    comparison[key].heuristic =
      providerAggregates.find((x) => x.providerId === BENCHMARK_PROVIDER_IDS.HEURISTIC)?.metrics[
        key
      ] ?? null;
  }

  comparison.gatePassRate = {};
  comparison.avgLatencyMs = {};
  comparison.avgReviewMinutes = {};
  for (const p of providerAggregates) {
    comparison.gatePassRate[p.providerId] = p.gatePassRate;
    comparison.avgLatencyMs[p.providerId] = p.avgLatencyMs;
    comparison.avgReviewMinutes[p.providerId] = p.avgReviewMinutes;
  }

  return {
    generatedAt: new Date().toISOString(),
    providers: providerAggregates.map((p) => ({
      providerId: p.providerId,
      model: p.model,
      ran: p.ran,
      skipped: p.skipped,
      skipReason: p.skipReason,
      completedCount: p.completedCount,
      vehicleCount: p.vehicleCount,
    })),
    comparison,
    providerAggregates,
  };
}

export function resolveBenchmarkProviders(env = process.env, requested = null) {
  const all = [
    BENCHMARK_PROVIDER_IDS.HEURISTIC,
    BENCHMARK_PROVIDER_IDS.OPENAI,
    BENCHMARK_PROVIDER_IDS.ANTHROPIC,
  ];
  const list = requested?.length ? requested : all;
  const config = resolveAiExtractionConfig(env);
  return { providers: list, config };
}

export { BENCHMARK_PROVIDER_IDS };
