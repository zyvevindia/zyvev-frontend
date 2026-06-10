/**
 * Catalog acquisition v5 — hardened source acquisition CLI.
 *
 * Usage:
 *   node scripts/catalog-import-v5-acquire.mjs --family=tata-curvv-ev
 *   node scripts/catalog-import-v5-acquire.mjs --family=tata-nexon-ev --no-playwright
 */

import fs from "node:fs";
import path from "node:path";

import "./lib/bootstrapEnv.mjs";

import { runEvidencePipelineV5 } from "../src/catalogAcquisition/evidencePipelineV5.js";
import { listRegistryEntries } from "../src/catalogAcquisition/sourceRegistry/registryLoader.js";

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
}

const family = arg("family");
const noPlaywright = process.argv.includes("--no-playwright");
const outDir = arg("out") || "docs/catalog/acquisition-quality";

async function main() {
  const entries = family
    ? listRegistryEntries().filter((e) => e.familySlug === family || e.id === family)
    : listRegistryEntries();

  if (!entries.length) {
    console.error("No registry entries matched. Use --family=tata-curvv-ev");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const results = [];

  console.log("\n=== Catalog Import v5 — Source Acquisition ===\n");

  for (const entry of entries) {
    console.log(`--- ${entry.brand} ${entry.model} ---`);
    const startedAt = Date.now();
    const pipeline = await runEvidencePipelineV5({
      importId: `v5-cli-${entry.id}`,
      familySlug: entry.familySlug,
      usePlaywright: !noPlaywright,
    });
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    if (!pipeline.ok) {
      console.log(`  FAIL (${elapsed}s): ${(pipeline.errors || []).join("; ")}`);
      results.push({ entry, ok: false, errors: pipeline.errors, warnings: pipeline.warnings });
      continue;
    }

    const m = pipeline.acquisitionMetrics;
    console.log(
      `  OK (${elapsed}s) · URL ${pipeline.acquisition?.urlValidation?.status} · PDF ${pipeline.acquisition?.pdfFound ? "yes" : "no"} · evidence ${m.evidenceRecordCount} · score ${m.acquisitionScore}`
    );
    if (pipeline.warnings?.length) {
      for (const w of pipeline.warnings) console.log(`  WARN: ${w.message}`);
    }

    results.push({
      entry,
      ok: true,
      oemUrl: entry.officialUrl,
      finalUrl: pipeline.acquisition?.urlValidation?.finalUrl,
      urlStatus: pipeline.acquisition?.urlValidation?.status,
      pdfFound: pipeline.acquisition?.pdfFound,
      evidenceCount: m.evidenceRecordCount,
      acquisitionScore: m.acquisitionScore,
      acquisitionFailure: m.acquisitionFailure,
      rawHtmlSize: m.rawHtmlSize,
      renderedTextSize: m.renderedTextSize,
      contentComparison: pipeline.contentComparison,
      warnings: pipeline.warnings,
    });
  }

  const outFile = path.join(outDir, "latest.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
  );
  console.log(`\nWrote ${outFile}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
