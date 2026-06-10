/**
 * Vercel serverless — catalog acquisition v3 (auto-acquire + AI + evidence merge).
 */

import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
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
    const { importId, oemUrl, referenceUrls = [], pdfBase64, pdfName } = body;

    if (!importId) {
      return jsonResponse({ ok: false, errors: ["importId required"] }, 400);
    }
    if (!oemUrl && !pdfBase64) {
      return jsonResponse({ ok: false, errors: ["Provide oemUrl and/or pdfBase64"] }, 400);
    }

    let pdfBuffer = null;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, "base64");
    }

    const result = await runEvidencePipelineV3({
      importId,
      oemUrl: oemUrl || null,
      referenceUrls,
      pdfBuffer,
      pdfName,
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
        conflictFields: result.conflictFields,
        attentionFields: result.attentionFields,
        diagnostics: result.diagnostics,
        extractedVehicle: result.extractedVehicle,
        reviewedVehicle: result.reviewedVehicle,
        mergedFields: result.mergedFields,
        evidenceRecords: result.evidenceRecords,
        acquisitionSnapshots: result.acquisition?.snapshots,
      },
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, errors: [err?.message || "catalog-v3-acquire failed"] },
      500
    );
  }
}
