/**
 * Vite dev middleware — local /api/catalog-v3-acquire for wizard testing.
 */

export function catalogV3AcquireDevPlugin() {
  return {
    name: "catalog-v3-acquire-dev",
    configureServer(server) {
      server.middlewares.use("/api/catalog-v3-acquire", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, errors: ["POST required"] }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const { runEvidencePipelineV3 } = await import(
              "../../src/catalogAcquisition/evidencePipelineV3.js"
            );

            let pdfBuffer = null;
            if (payload.pdfBase64) {
              pdfBuffer = Buffer.from(payload.pdfBase64, "base64");
            }

            const result = await runEvidencePipelineV3({
              importId: payload.importId || "dev-import",
              oemUrl: payload.oemUrl,
              referenceUrls: payload.referenceUrls || [],
              pdfBuffer,
              pdfName: payload.pdfName,
            });

            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.ok ? 200 : 422;
            res.end(
              JSON.stringify(
                result.ok
                  ? {
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
                        variantCount: result.mergedVariants?.length,
                        diagnostics: result.diagnostics,
                        acquisitionSnapshots: result.acquisition?.snapshots,
                      },
                    }
                  : result
              )
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, errors: [err?.message] }));
          }
        });
      });

      server.middlewares.use("/api/catalog-v7-acquire", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, errors: ["POST required"] }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            await import("../lib/bootstrapEnv.mjs");
            const payload = JSON.parse(body || "{}");
            const { runEvidencePipelineV7 } = await import(
              "../../src/catalogAcquisition/evidencePipelineV7.js"
            );

            let pdfBuffer = null;
            if (payload.pdfBase64) {
              pdfBuffer = Buffer.from(payload.pdfBase64, "base64");
            }

            const result = await runEvidencePipelineV7({
              importId: payload.importId || "dev-v7-import",
              oemUrl: payload.oemUrl || payload.brochureUrl || null,
              referenceUrls: payload.referenceUrls || [],
              pdfBuffer,
              pdfName: payload.pdfName,
              pdfUrl: payload.brochureUrl || null,
              familySlug: payload.familySlug || null,
              goldenId: payload.goldenId || payload.familySlug || null,
            });

            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.ok ? 200 : 422;
            res.end(
              JSON.stringify(
                result.ok
                  ? {
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
                    }
                  : result
              )
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, errors: [err?.message] }));
          }
        });
      });

      server.middlewares.use("/api/catalog-v5-acquire", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, errors: ["POST required"] }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            await import("../lib/bootstrapEnv.mjs");
            const payload = JSON.parse(body || "{}");
            const { runEvidencePipelineV5 } = await import(
              "../../src/catalogAcquisition/evidencePipelineV5.js"
            );

            let pdfBuffer = null;
            if (payload.pdfBase64) {
              pdfBuffer = Buffer.from(payload.pdfBase64, "base64");
            }

            const result = await runEvidencePipelineV5({
              importId: payload.importId || "dev-v5-import",
              familySlug: payload.familySlug,
              oemUrl: payload.oemUrl,
              referenceUrls: payload.referenceUrls || [],
              pdfBuffer,
              pdfName: payload.pdfName,
              usePlaywright: payload.usePlaywright !== false,
              measureContentLayers: payload.measureContentLayers !== false,
            });

            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.ok ? 200 : 422;
            res.end(
              JSON.stringify(
                result.ok
                  ? {
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
                    }
                  : result
              )
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, errors: [err?.message] }));
          }
        });
      });
    },
  };
}
