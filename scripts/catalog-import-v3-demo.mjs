/**
 * v3 onboarding demo — Tata Nexon EV, Tata Curvv EV, Mahindra BE 6.
 * Uses OEM URLs (network required). PDF optional via --pdf=path.
 *
 * Usage: node scripts/catalog-import-v3-demo.mjs [--pdf-nexon=path] [--pdf-curvv=path] [--pdf-be6=path]
 */

import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";
import fs from "node:fs";
import path from "node:path";

const DEMO_VEHICLES = [
  {
    id: "tata-nexon-ev",
    name: "Tata Nexon EV",
    oemUrl: "https://www.tatamotors.com/nexon/ev",
    referenceUrls: ["https://www.cardekho.com/tata/nexon-ev"],
  },
  {
    id: "tata-curvv-ev",
    name: "Tata Curvv EV",
    oemUrl: "https://www.tatamotors.com/curvv/ev",
    referenceUrls: ["https://www.cardekho.com/tata/curvv-ev"],
  },
  {
    id: "mahindra-be-6",
    name: "Mahindra BE 6",
    oemUrl: "https://www.mahindra.com/be6",
    referenceUrls: ["https://www.cardekho.com/mahindra/be-6"],
  },
];

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
}

function loadPdfArg(key) {
  const p = arg(key);
  if (!p) return null;
  const resolved = path.resolve(p);
  return fs.existsSync(resolved) ? fs.readFileSync(resolved) : null;
}

console.log("\n=== Catalog Import v3 Demo ===\n");

const results = [];

for (const vehicle of DEMO_VEHICLES) {
  const pdfKey = `pdf-${vehicle.id.replace(/-/g, "")}`;
  const altPdfKey = `pdf-${vehicle.id.split("-").slice(0, 2).join("")}`;
  let pdfBuffer =
    loadPdfArg(pdfKey) ||
    loadPdfArg(altPdfKey) ||
    loadPdfArg(`pdf-${vehicle.id}`);

  console.log(`\n--- ${vehicle.name} ---`);
  const startedAt = Date.now();

  const pipeline = await runEvidencePipelineV3({
    importId: `demo-${vehicle.id}`,
    oemUrl: vehicle.oemUrl,
    referenceUrls: vehicle.referenceUrls,
    pdfBuffer,
    pdfName: pdfBuffer ? `${vehicle.id}.pdf` : null,
  });

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (!pipeline.ok) {
    console.log(`  FAIL (${elapsedSec}s): ${pipeline.errors?.join("; ")}`);
    results.push({ vehicle: vehicle.name, ok: false, elapsedSec, errors: pipeline.errors });
    continue;
  }

  const ev = pipeline.extractedVehicle;
  const reviewEst =
    pipeline.diagnostics.attentionCount <= 3
      ? "2–4 min"
      : pipeline.diagnostics.attentionCount <= 8
        ? "4–8 min"
        : "8–15 min";

  console.log(`  OK (${elapsedSec}s)`);
  console.log(`  Provider: ${pipeline.diagnostics.aiProvider}`);
  console.log(`  Records: ${pipeline.diagnostics.evidenceRecordCount} · Variants: ${pipeline.diagnostics.variantCount}`);
  console.log(`  Confidence: ${pipeline.confidenceScore}% · Attention: ${pipeline.diagnostics.attentionCount} · Conflicts: ${pipeline.diagnostics.conflictCount}`);
  console.log(`  Brand: ${ev?.vehicle?.brand?.value || "—"} · Model: ${ev?.vehicle?.model?.value || "—"}`);
  console.log(`  Battery: ${ev?.battery?.batteryCapacityKwh?.value || "—"} kWh · Range: ${ev?.range?.claimedRangeKm?.value || "—"} km`);
  console.log(`  Est. review: ${reviewEst}`);

  results.push({
    vehicle: vehicle.name,
    ok: true,
    elapsedSec,
    confidenceScore: pipeline.confidenceScore,
    attentionCount: pipeline.diagnostics.attentionCount,
    reviewEst,
    brand: ev?.vehicle?.brand?.value,
    model: ev?.vehicle?.model?.value,
  });
}

console.log("\n=== Summary ===\n");
console.table(results);

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} vehicles acquired successfully.\n`);

if (passed < results.length) {
  process.exitCode = 1;
}
