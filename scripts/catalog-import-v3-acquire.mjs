/**
 * Catalog acquisition v3 — automated URL fetch + PDF parse + AI/heuristic extraction.
 *
 * Usage:
 *   node scripts/catalog-import-v3-acquire.mjs --oem-url=https://... [--pdf=path] [--refs=url1,url2] [--import-id=uuid]
 */

import fs from "node:fs";
import path from "node:path";

import "./lib/bootstrapEnv.mjs";

import { getSupabaseAdminClient } from "../src/backend/supabase/adminClient.js";
import {
  createCatalogImport,
  updateCatalogImport,
  insertCatalogImportSnapshot,
  replaceEvidenceRecords,
} from "../src/backend/index.js";
import {
  IMPORT_STATUS,
  IMPORT_SOURCE_TYPE,
  SNAPSHOT_TYPE,
  initializeReviewedVehicle,
  hashContent,
  buildSourceSnapshot,
} from "../src/catalogAcquisition/index.js";
import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
}

async function main() {
  const oemUrl = arg("oem-url");
  const pdfPath = arg("pdf");
  const refs = (arg("refs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const importIdArg = arg("import-id");
  const createdBy = arg("by") || "cli-v3";
  const vehicle = arg("vehicle") || "unknown";

  if (!oemUrl && !pdfPath) {
    console.error(
      "Usage: node scripts/catalog-import-v3-acquire.mjs --oem-url=URL [--pdf=brochure.pdf] [--refs=url1,url2]"
    );
    process.exit(1);
  }

  let pdfBuffer = null;
  if (pdfPath) {
    const resolved = path.resolve(pdfPath);
    if (!fs.existsSync(resolved)) {
      console.error(`PDF not found: ${resolved}`);
      process.exit(1);
    }
    pdfBuffer = fs.readFileSync(resolved);
    console.log(`PDF loaded: ${resolved} (${pdfBuffer.length} bytes)`);
  }

  console.log(`\n=== Catalog Import v3 — ${vehicle} ===\n`);
  const startedAt = Date.now();

  const pipeline = await runEvidencePipelineV3({
    importId: importIdArg || "cli-v3",
    oemUrl,
    referenceUrls: refs,
    pdfBuffer,
    pdfName: pdfPath ? path.basename(pdfPath) : null,
  });

  if (!pipeline.ok) {
    console.error("Pipeline failed:", pipeline.errors?.join("; "));
    process.exit(1);
  }

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  const ev = pipeline.extractedVehicle;

  console.log(`Acquisition + extraction: ${elapsedSec}s`);
  console.log(`AI provider: ${pipeline.diagnostics.aiProvider} (configured: ${pipeline.diagnostics.aiConfigured})`);
  console.log(`Sources acquired: ${pipeline.diagnostics.sourceCount}`);
  console.log(`Evidence records: ${pipeline.diagnostics.evidenceRecordCount}`);
  console.log(`Variants: ${pipeline.diagnostics.variantCount}`);
  console.log(`Confidence: ${pipeline.confidenceScore}%`);
  console.log(`Attention fields: ${pipeline.diagnostics.attentionCount}`);
  console.log(`Conflicts: ${pipeline.diagnostics.conflictCount}`);

  if (ev?.vehicle?.brand?.value) {
    console.log(`\nVehicle: ${ev.vehicle.brand.value} ${ev.vehicle.model?.value || ""}`);
  }
  if (ev?.battery?.batteryCapacityKwh?.value) {
    console.log(`Battery: ${ev.battery.batteryCapacityKwh.value} kWh`);
  }
  if (ev?.range?.claimedRangeKm?.value) {
    console.log(`Range: ${ev.range.claimedRangeKm.value} km`);
  }

  const client = getSupabaseAdminClient();
  if (client) {
    let importId = importIdArg;
    if (!importId) {
      const created = await createCatalogImport(
        {
          status: IMPORT_STATUS.DRAFT,
          sourceType: IMPORT_SOURCE_TYPE.OEM_URL,
          sourceUrl: oemUrl,
          createdBy,
          sourceInputs: { oemUrl, refs, pdfPath, engine: "v3" },
        },
        client
      );
      if (!created.ok) throw new Error(created.error?.message);
      importId = created.data.id;
    }

    const contentHash = await hashContent(JSON.stringify({ oemUrl, refs, vehicle }));
    await replaceEvidenceRecords(importId, pipeline.evidenceRecords, client);
    await updateCatalogImport(
      importId,
      {
        status: pipeline.status,
        extractedVehicle: pipeline.extractedVehicle,
        reviewedVehicle: pipeline.reviewedVehicle,
        evidenceSummary: pipeline.mergedFields,
        confidenceScore: pipeline.confidenceScore,
        diagnostics: pipeline.diagnostics,
      },
      client
    );
    await insertCatalogImportSnapshot(
      buildSourceSnapshot(importId, SNAPSHOT_TYPE.EXTRACTED, {
        vehicle,
        diagnostics: pipeline.diagnostics,
      }, contentHash),
      client
    );
    console.log(`\nImport ${importId} ready for review → /admin/catalog/import`);
  } else {
    console.log("\nSupabase not configured — JSON summary only");
    console.log(JSON.stringify({
      confidenceScore: pipeline.confidenceScore,
      attentionFields: pipeline.attentionFields,
      brand: ev?.vehicle?.brand?.value,
      model: ev?.vehicle?.model?.value,
      variants: pipeline.mergedVariants?.map((v) => v.variantName),
    }, null, 2));
  }

  console.log(`\nEstimated review time: ${pipeline.diagnostics.attentionCount <= 3 ? "2–4 min" : pipeline.diagnostics.attentionCount <= 8 ? "4–8 min" : "8–15 min"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
