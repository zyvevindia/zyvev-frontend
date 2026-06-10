/**
 * Vercel serverless — catalog acquisition v7.1 (frozen engine).
 */

import { runEvidencePipelineV7 } from "../src/catalogAcquisition/evidencePipelineV7.js";

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
      oemUrl,
      brochureUrl,
      referenceUrls = [],
      pdfBase64,
      pdfName,
      familySlug,
      goldenId,
    } = body;

    if (!importId) {
      return jsonResponse({ ok: false, errors: ["importId required"] }, 400);
    }
    if (!oemUrl && !brochureUrl && !pdfBase64) {
      return jsonResponse({ ok: false, errors: ["Provide oemUrl, brochureUrl, and/or pdfBase64"] }, 400);
    }

    let pdfBuffer = null;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, "base64");
    }

    const result = await runEvidencePipelineV7({
      importId,
      oemUrl: oemUrl || brochureUrl || null,
      referenceUrls,
      pdfBuffer,
      pdfName: pdfName || (brochureUrl ? "brochure.pdf" : null),
      pdfUrl: brochureUrl || null,
      familySlug: familySlug || null,
      goldenId: goldenId || familySlug || null,
    });

    if (!result.ok) {
      return jsonResponse(result, 422);
    }

    return jsonResponse({
      ok: true,
      pipeline: {
        status: result.status,
        confidenceScore: result.confidenceScore,
        evidenceRecords: result.evidenceRecords,
        mergedFields: result.mergedFields,
        extractedVehicle: result.extractedVehicle,
        reviewedVehicle: result.reviewedVehicle,
        conflictFields: result.conflictFields,
        attentionFields: result.attentionFields,
        mergedVariants: result.mergedVariants,
        variantCount: result.diagnostics?.variantCount,
        diagnostics: result.diagnostics,
        acquisitionSnapshots: result.acquisition?.snapshots,
        v7: result.v7,
      },
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, errors: [err?.message || "catalog-v7-acquire failed"] },
      500
    );
  }
}
