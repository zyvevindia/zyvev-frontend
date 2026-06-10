/**
 * Catalog Import API — Supabase-first with localStorage fallback.
 * v2: multi-source evidence acquisition pipeline.
 */

import {
  createCatalogImport,
  updateCatalogImport,
  getCatalogImport,
  listCatalogImports,
  insertCatalogImportSnapshot,
  replaceEvidenceRecords,
  listEvidenceRecords,
  upsertVehicle,
  upsertVehicleVariant,
} from "../backend/index.js";
import {
  IMPORT_STATUS,
  IMPORT_SOURCE_TYPE,
  SNAPSHOT_TYPE,
  EVIDENCE_SOURCE_TYPE,
  normalizeExtractedContent,
  initializeReviewedVehicle,
  hashContent,
  buildSourceSnapshot,
  publishCatalogImport,
  runEvidencePipeline,
  buildSourceInputsFromForm,
  resolveFieldConflict,
  mergedFieldsToExtractionDraft,
  aggregateMergedConfidence,
  runFullBenchmarkReport,
  buildReviewMetricsReport,
  finalizeReviewSession,
} from "../catalogAcquisition/index.js";
import {
  localCreateImport,
  localUpdateImport,
  localGetImport,
  localListImports,
  isLocalImportId,
  localReplaceEvidenceRecords,
  localListEvidenceRecords,
} from "./catalogImportStore.js";

async function persistSnapshot(importId, snapshotType, payload, contentHash, useLocal) {
  if (useLocal || isLocalImportId(importId)) return { ok: true, skipped: true };
  return insertCatalogImportSnapshot(
    buildSourceSnapshot(importId, snapshotType, payload, contentHash)
  );
}

async function persistEvidenceRecords(importId, records, useLocal) {
  if (useLocal || isLocalImportId(importId)) {
    localReplaceEvidenceRecords(importId, records);
    return { ok: true, storage: "localStorage" };
  }
  return replaceEvidenceRecords(importId, records);
}

export async function apiCreateImportDraft({
  sourceType,
  sourceUrl,
  sourceFile,
  sourceInputs,
  createdBy,
}) {
  const input = {
    status: IMPORT_STATUS.DRAFT,
    sourceType,
    sourceUrl,
    sourceFile: sourceFile || {},
    sourceInputs: sourceInputs || {},
    createdBy,
    extractedVehicle: {},
    reviewedVehicle: {},
    evidenceSummary: {},
    diagnostics: { step: 1, engine: "multi-source-v2" },
  };

  const remote = await createCatalogImport(input);
  if (remote.ok) return { ok: true, data: remote.data, storage: "supabase" };

  const local = localCreateImport(input);
  return { ok: true, data: local, storage: "localStorage" };
}

/**
 * v2: Acquire evidence from multiple sources, merge, detect conflicts.
 * @param {string} importId
 * @param {object} form — pdfContent, oemUrl, oemContent, referenceSources[], searchContent
 */
export async function apiAcquireEvidence(importId, form = {}) {
  const useLocal = isLocalImportId(importId);
  const record = useLocal
    ? localGetImport(importId)
    : (await getCatalogImport(importId)).data;

  if (!record) return { ok: false, errors: ["Import not found"] };

  const sources = buildSourceInputsFromForm(form);
  if (!sources.length) {
    return { ok: false, errors: ["Provide at least one source with content"] };
  }

  const pipeline = await runEvidencePipeline({ importId, sources });
  if (!pipeline.ok) return pipeline;

  await persistEvidenceRecords(importId, pipeline.evidenceRecords, useLocal);

  const contentHash = await hashContent(
    JSON.stringify({ sources: sources.map((s) => s.url || s.name), count: sources.length })
  );

  const patch = {
    status: pipeline.status,
    sourceInputs: {
      pdfName: form.pdfName,
      oemUrl: form.oemUrl,
      referenceUrls: (form.referenceSources || []).map((r) => r.url).filter(Boolean),
      searchUrl: form.searchUrl,
    },
    evidenceSummary: pipeline.mergedFields,
    extractedVehicle: pipeline.extractedVehicle,
    reviewedVehicle: pipeline.reviewedVehicle,
    confidenceScore: pipeline.confidenceScore,
    diagnostics: pipeline.diagnostics,
  };

  const updated = useLocal
    ? localUpdateImport(importId, patch)
    : (await updateCatalogImport(importId, patch)).data;

  await persistSnapshot(
    importId,
    SNAPSHOT_TYPE.EXTRACTED,
    {
      evidenceRecordCount: pipeline.evidenceRecords.length,
      conflictFields: pipeline.conflictFields,
      mergedPreview: Object.fromEntries(
        Object.entries(pipeline.mergedFields).map(([k, v]) => [k, v?.value])
      ),
    },
    contentHash,
    useLocal
  );

  return {
    ok: true,
    data: updated,
    pipeline,
    storage: useLocal ? "localStorage" : "supabase",
  };
}

/**
 * v3: Automated URL fetch + PDF parse + AI extraction → evidence merge.
 * Requires serverless `/api/catalog-v3-acquire` (Vercel) or local vite dev middleware.
 */
export async function apiRunV3AutoAcquire(importId, { oemUrl, referenceUrls = [], pdfFile = null }) {
  const useLocal = isLocalImportId(importId);
  const record = useLocal
    ? localGetImport(importId)
    : (await getCatalogImport(importId)).data;

  if (!record) return { ok: false, errors: ["Import not found"] };
  if (!oemUrl && !pdfFile) {
    return { ok: false, errors: ["Provide OEM URL and/or PDF brochure"] };
  }

  let pdfBase64 = null;
  let pdfName = null;
  if (pdfFile) {
    pdfName = pdfFile.name;
    const buffer = await pdfFile.arrayBuffer();
    pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  const apiBase =
    typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${apiBase}/api/catalog-v3-acquire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId,
      oemUrl: oemUrl || null,
      referenceUrls,
      pdfBase64,
      pdfName,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      errors: body.errors || [`Acquisition API failed (${res.status})`],
      hint: "Deploy with Vercel serverless or run: node scripts/catalog-import-v3-acquire.mjs",
    };
  }

  const pipeline = body.pipeline;
  await persistEvidenceRecords(importId, pipeline.evidenceRecords || [], useLocal);

  const contentHash = await hashContent(
    JSON.stringify({ oemUrl, referenceUrls, pdfName, engine: "v3" })
  );

  const patch = {
    status: pipeline.status,
    sourceInputs: { oemUrl, referenceUrls, pdfName, engine: "v3-automated" },
    evidenceSummary: pipeline.mergedFields,
    extractedVehicle: pipeline.extractedVehicle,
    reviewedVehicle: pipeline.reviewedVehicle,
    confidenceScore: pipeline.confidenceScore,
    diagnostics: pipeline.diagnostics,
  };

  const updated = useLocal
    ? localUpdateImport(importId, patch)
    : (await updateCatalogImport(importId, patch)).data;

  await persistSnapshot(
    importId,
    SNAPSHOT_TYPE.EXTRACTED,
    {
      engine: "v3",
      evidenceRecordCount: pipeline.evidenceRecords?.length,
      variantCount: pipeline.variantCount,
      conflictFields: pipeline.conflictFields,
      attentionFields: pipeline.attentionFields,
      elapsedMs: pipeline.diagnostics?.elapsedMs,
    },
    contentHash,
    useLocal
  );

  if (pipeline.acquisitionSnapshots?.length && !useLocal) {
    await persistSnapshot(
      importId,
      SNAPSHOT_TYPE.SOURCE_RAW,
      { snapshots: pipeline.acquisitionSnapshots },
      contentHash,
      useLocal
    );
  }

  return {
    ok: true,
    data: updated,
    pipeline,
    storage: useLocal ? "localStorage" : "supabase",
  };
}

/**
 * Resolve a conflicted field with admin-selected value.
 */
export async function apiResolveFieldConflict(importId, fieldName, selectedValue) {
  const useLocal = isLocalImportId(importId);
  const record = useLocal
    ? localGetImport(importId)
    : (await getCatalogImport(importId)).data;

  if (!record) return { ok: false, errors: ["Import not found"] };

  const mergedFields = resolveFieldConflict(
    record.evidenceSummary || record.extractedVehicle?.evidence || {},
    fieldName,
    selectedValue
  );

  const extractedVehicle = mergedFieldsToExtractionDraft(
    mergedFields,
    {
      importId,
      resolvedField: fieldName,
    },
    record.extractedVehicle?.variants || record.reviewedVehicle?.variants || []
  );
  const confidenceScore = aggregateMergedConfidence(mergedFields);

  const patch = {
    evidenceSummary: mergedFields,
    extractedVehicle,
    confidenceScore,
  };

  const updated = useLocal
    ? localUpdateImport(importId, patch)
    : (await updateCatalogImport(importId, patch)).data;

  return { ok: true, data: updated };
}

export async function apiGetEvidenceRecords(importId) {
  const useLocal = isLocalImportId(importId);
  if (useLocal) {
    return { ok: true, data: localListEvidenceRecords(importId), storage: "localStorage" };
  }
  const r = await listEvidenceRecords(importId);
  return r.ok
    ? { ok: true, data: r.data, storage: "supabase" }
    : { ok: false, errors: [r.error?.message || "Failed to load evidence"] };
}

/** v1 single-source path — preserved for backward compatibility. */
export async function apiExtractAndNormalize(importId, rawContent, context = {}) {
  const useLocal = isLocalImportId(importId);
  const record = useLocal
    ? localGetImport(importId)
    : (await getCatalogImport(importId)).data;

  if (!record) return { ok: false, errors: ["Import not found"] };

  const contentHash = await hashContent(rawContent || "");
  const normalized = normalizeExtractedContent(rawContent || "", {
    ...context,
    sourceType: record.sourceType,
  });

  const patch = {
    status: IMPORT_STATUS.REVIEW_REQUIRED,
    rawContent,
    rawContentHash: contentHash,
    extractedVehicle: normalized.extractedVehicle,
    reviewedVehicle: initializeReviewedVehicle(normalized.extractedVehicle),
    confidenceScore: normalized.confidenceScore,
    diagnostics: {
      step: 3,
      engine: "single-source-v1",
      plainTextLength: normalized.candidates?.plainTextLength,
      extractor: normalized.extractedVehicle?.meta?.extractor,
    },
  };

  const updated = useLocal
    ? localUpdateImport(importId, patch)
    : (await updateCatalogImport(importId, patch)).data;

  await persistSnapshot(
    importId,
    SNAPSHOT_TYPE.SOURCE_RAW,
    { rawContentPreview: String(rawContent).slice(0, 2000) },
    contentHash,
    useLocal
  );
  await persistSnapshot(
    importId,
    SNAPSHOT_TYPE.EXTRACTED,
    normalized.extractedVehicle,
    contentHash,
    useLocal
  );

  return { ok: true, data: updated, normalized };
}

export async function apiUpdateReviewedVehicle(importId, reviewedVehicle) {
  const useLocal = isLocalImportId(importId);
  const patch = { reviewedVehicle, status: IMPORT_STATUS.REVIEW_REQUIRED };

  if (useLocal) {
    return { ok: true, data: localUpdateImport(importId, patch) };
  }
  const r = await updateCatalogImport(importId, patch);
  return r.ok ? { ok: true, data: r.data } : { ok: false, errors: [r.error?.message] };
}

export async function apiApproveImport(importId, approvedBy) {
  const useLocal = isLocalImportId(importId);
  const patch = {
    status: IMPORT_STATUS.APPROVED,
    approvedBy,
    approvedAt: new Date().toISOString(),
  };

  if (useLocal) {
    return { ok: true, data: localUpdateImport(importId, patch) };
  }
  const r = await updateCatalogImport(importId, patch);
  if (r.ok) {
    await persistSnapshot(
      importId,
      SNAPSHOT_TYPE.REVIEWED,
      r.data.reviewedVehicle,
      r.data.rawContentHash,
      false
    );
  }
  return r.ok ? { ok: true, data: r.data } : { ok: false, errors: [r.error?.message] };
}

export async function apiRejectImport(importId, approvedBy) {
  const useLocal = isLocalImportId(importId);
  const patch = { status: IMPORT_STATUS.REJECTED, approvedBy };

  if (useLocal) {
    return { ok: true, data: localUpdateImport(importId, patch) };
  }
  const r = await updateCatalogImport(importId, patch);
  return r.ok ? { ok: true, data: r.data } : { ok: false, errors: [r.error?.message] };
}

export async function apiPublishImport(importId, { goldenDossier = null, reviewSession = null } = {}) {
  const useLocal = isLocalImportId(importId);
  const record = useLocal
    ? localGetImport(importId)
    : (await getCatalogImport(importId)).data;

  if (!record) return { ok: false, errors: ["Import not found"] };

  const evidenceResult = await apiGetEvidenceRecords(importId);
  const evidenceRecords = evidenceResult.ok ? evidenceResult.data || [] : [];

  const result = await publishCatalogImport(
    record,
    {
      upsertVehicle,
      upsertVehicleVariant,
    },
    { evidenceRecords, goldenDossier }
  );

  if (!result.ok) return result;

  const benchmarkReport = runFullBenchmarkReport({
    importRecord: record,
    goldenDossier,
    evidenceRecords,
    reviewSession: reviewSession ? finalizeReviewSession(reviewSession) : null,
  });
  const reviewMetrics = reviewSession
    ? buildReviewMetricsReport(
        finalizeReviewSession(reviewSession),
        record.extractedVehicle,
        record.reviewedVehicle
      )
    : null;

  const patch = {
    status: IMPORT_STATUS.PUBLISHED,
    publishedAt: result.publishedAt,
    publishResult: result,
    diagnostics: {
      ...(record.diagnostics || {}),
      benchmarkReport,
      reviewMetrics,
    },
  };

  const updated = useLocal
    ? localUpdateImport(importId, patch)
    : (await updateCatalogImport(importId, patch)).data;

  if (!useLocal) {
    await persistSnapshot(
      importId,
      SNAPSHOT_TYPE.PUBLISHED,
      result,
      record.rawContentHash,
      false
    );
  }

  return { ok: true, data: updated, publish: result };
}

export async function apiListImports(opts = {}) {
  const remote = await listCatalogImports(opts);
  if (remote.ok && remote.data?.length) {
    return { ok: true, data: remote.data, storage: "supabase" };
  }
  return {
    ok: true,
    data: localListImports(opts),
    storage: "localStorage",
  };
}

export async function apiGetImport(id) {
  if (isLocalImportId(id)) {
    const data = localGetImport(id);
    return data ? { ok: true, data } : { ok: false, errors: ["Not found"] };
  }
  const r = await getCatalogImport(id);
  return r.ok && r.data
    ? { ok: true, data: r.data }
    : { ok: false, errors: [r.error?.message || "Not found"] };
}

export async function apiFetchSourceContent(sourceType, sourceUrl, fileText) {
  if (sourceType === IMPORT_SOURCE_TYPE.PDF_BROCHURE) {
    return { ok: true, content: fileText || "", method: "pdf_text" };
  }

  if (!sourceUrl) {
    return { ok: false, errors: ["Source URL required"] };
  }

  try {
    const res = await fetch(sourceUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return { ok: true, content: html, method: "url_fetch" };
  } catch (err) {
    return {
      ok: false,
      errors: [
        err?.message ||
          "URL fetch failed (CORS). Paste raw HTML/text below or run server extraction script.",
      ],
      corsBlocked: true,
    };
  }
}

export { IMPORT_SOURCE_TYPE, IMPORT_STATUS, EVIDENCE_SOURCE_TYPE };
