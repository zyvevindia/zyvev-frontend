/**
 * Vercel serverless — catalog acquisition v5 (hardened source acquisition).
 */

import { runEvidencePipelineV5 } from "../src/catalogAcquisition/evidencePipelineV5.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, errors: ["POST required"] }, 405);
  }

  try {
    const body = await req.json();
    const {
      importId,
      familySlug,
      oemUrl,
      referenceUrls = [],
      pdfBase64,
      pdfName,
      usePlaywright = true,
      measureContentLayers = true,
    } = body;

    if (!importId) {
      return jsonResponse({ ok: false, errors: ["importId required"] }, 400);
    }
    if (!familySlug && !oemUrl && !pdfBase64) {
      return jsonResponse(
        { ok: false, errors: ["Provide familySlug, oemUrl, and/or pdfBase64"] },
        400
      );
    }

    let pdfBuffer = null;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, "base64");
    }

    const result = await runEvidencePipelineV5({
      importId,
      familySlug,
      oemUrl: oemUrl || null,
      referenceUrls,
      pdfBuffer,
      pdfName,
      usePlaywright,
      measureContentLayers,
    });

    if (!result.ok) {
      return jsonResponse(result, 422);
    }

    return jsonResponse({
      ok: true,
      pipeline: {
        status: result.status,
        confidenceScore: result.confidenceScore,
        evidenceRecordCount: result.evidenceRecords?.length,
        variantCount: result.mergedVariants?.length,
        warnings: result.warnings,
        acquisitionMetrics: result.acquisitionMetrics,
        contentComparison: result.contentComparison,
        urlValidation: result.acquisition?.urlValidation,
        pdfFound: result.acquisition?.pdfFound,
        diagnostics: result.diagnostics,
        registry: result.registry,
      },
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, errors: [err?.message || "catalog-v5-acquire failed"] },
      500
    );
  }
}
