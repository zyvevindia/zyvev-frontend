/**
 * Media integrity verification — npm run media:verify
 *
 * Manifest audit + optional Cloudinary HEAD/GET probe.
 * Outputs: console table, JSON + CSV under reports/
 */

import "./lib/bootstrapEnv.mjs";

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  auditProductionFamilies,
  buildMediaIntegrityReport,
  collectCoreManifestMediaUrls,
  collectManifestMediaUrls,
  probeBrokenImages,
} from "../src/utils/mediaAudit.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const reportsDir = join(root, "reports");

const args = process.argv.slice(2);
const skipProbe = args.includes("--no-probe");
const jsonOnly = args.includes("--json-only");

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(path, rows, columns) {
  const header = columns.map((c) => csvEscape(c.key)).join(",");
  const body = rows
    .map((row) => columns.map((c) => csvEscape(row[c.key])).join(","))
    .join("\n");
  writeFileSync(path, `${header}\n${body}\n`, "utf8");
}

async function main() {
  console.log("\n=== EVSavari media integrity verify ===\n");

  let brokenProbeResults = [];
  if (!skipProbe) {
    const urls = collectManifestMediaUrls();
    const coreUrls = collectCoreManifestMediaUrls();
    console.log(
      `Probing ${urls.length} manifest Cloudinary URLs (${coreUrls.length} production-critical)…`
    );
    brokenProbeResults = await probeBrokenImages(urls);
    if (brokenProbeResults.length) {
      console.log(`Broken/unreachable: ${brokenProbeResults.length}`);
    } else {
      console.log("All probed URLs responded OK.");
    }
  } else {
    console.log("Skipping network probe (--no-probe).");
  }

  const report = buildMediaIntegrityReport({ brokenProbeResults });

  const tableRows = report.manifestRows.map((row) => ({
    family: row.familySlug,
    complete: row.complete ? "yes" : "no",
    missing: row.missing.join("; ") || "—",
  }));
  console.table(tableRows);

  console.log("\nSummary:");
  console.log(`  Tier-1 manifest coverage: ${report.tier1CoveragePct}%`);
  console.log(`  Manifest role completeness: ${report.avgCompletenessPercent}%`);
  console.log(`  Fallback usage (synthetic): ${report.fallbackUsagePct}%`);
  console.log(`  Compare ready: ${report.compareReadyPct}%`);
  console.log(`  Gallery complete: ${report.galleryCompletePct}%`);
  console.log(`  Broken assets (probed): ${report.brokenAssetCount}`);
  console.log(
    `  Broken production-critical (hero/listing/compare): ${report.brokenCoreAssetCount}`
  );
  console.log(`  Missing manifest families: ${report.missingManifestFamilies.join(", ") || "none"}`);

  if (report.topMissing.length) {
    console.log("\nTop manifest gaps:");
    for (const row of report.topMissing) {
      console.log(`  ${row.familySlug}: ${row.missing.join(", ")}`);
    }
  }

  if (report.brokenAssets.length) {
    console.log("\nBroken URLs (sample):");
    for (const url of report.brokenAssets.slice(0, 12)) {
      console.log(`  ${url}`);
    }
  }

  mkdirSync(reportsDir, { recursive: true });
  const stamp = report.generatedAt.slice(0, 10);
  const jsonPath = join(reportsDir, `media-integrity-${stamp}.json`);
  const csvPath = join(reportsDir, `media-integrity-${stamp}.csv`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const csvRows = [
    ...report.manifestRows.map((r) => ({
      type: "manifest",
      familySlug: r.familySlug,
      status: r.complete ? "complete" : "gap",
      detail: r.missing.join("; "),
      url: "",
    })),
    ...brokenProbeResults.map((r) => ({
      type: "broken",
      familySlug: "",
      status: String(r.status || r.error || "fail"),
      detail: "unreachable",
      url: r.url,
    })),
  ];

  writeCsv(csvPath, csvRows, [
    { key: "type" },
    { key: "familySlug" },
    { key: "status" },
    { key: "detail" },
    { key: "url" },
  ]);

  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${csvPath}\n`);

  if (
    !jsonOnly &&
    (report.brokenCoreAssetCount > 0 ||
      report.missingManifestFamilies.length > 0)
  ) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
