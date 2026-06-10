#!/usr/bin/env node
/**
 * Photo Replacement Sprint — Batch 3
 * Usage: node scripts/photo-replacement-batch3.mjs [--skip-build] [--skip-audit]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { runMediaPlaceholderAudit } from "./lib/mediaPlaceholderAudit.mjs";
import {
  formatBatchMarkdown,
  loadPhotoReplacementSeed,
  runPhotoReplacementBatch,
} from "./lib/photoReplacementSprint.mjs";

const BATCH3_SLUGS = Object.freeze([
  "hyundai-ioniq-5",
  "byd-seal",
  "kia-ev6",
  "bmw-ix1",
  "mercedes-eqa",
]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const docsDir = join(root, "docs", "media");
const skipBuild = process.argv.includes("--skip-build");
const skipAudit = process.argv.includes("--skip-audit");

console.log("\n=== Photo Replacement Sprint — Batch 3 ===\n");

const seed = loadPhotoReplacementSeed(root, "photoReplacementBatch3Seed.json");
const report = await runPhotoReplacementBatch({
  root,
  seed,
  slugs: BATCH3_SLUGS,
  batchNumber: 3,
  reportBasename: "photo-replacement-batch3",
});

let placeholderAudit = null;
if (!skipAudit) {
  console.log("\nRunning placeholder audit…");
  const audit = spawnSync("npm", ["run", "media:placeholder-audit"], {
    cwd: root,
    shell: true,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (audit.status !== 0) {
    console.warn("Placeholder audit exited with code", audit.status);
  }
  placeholderAudit = await runMediaPlaceholderAudit({ rootDir: root });
  report.placeholderAudit = placeholderAudit;
}

let buildResult = null;
if (!skipBuild) {
  console.log("\nRunning build…");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: root,
    shell: true,
    encoding: "utf8",
    stdio: "inherit",
  });
  buildResult = {
    success: build.status === 0,
    exitCode: build.status,
    command: "npm run build",
  };
  report.buildResult = buildResult;
}

report.filesModified.push(
  "scripts/lib/photoReplacementBatch3Seed.json",
  "scripts/photo-replacement-batch3.mjs",
  "package.json"
);

report.generatedAt = new Date().toISOString();
const markdown = formatBatchMarkdown(report);

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "photo-replacement-batch3.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(docsDir, "photo-replacement-batch3.md"),
  `${markdown}\n`,
  "utf8"
);

console.log("\n=== Batch 3 complete ===\n");
console.log(`Vehicles completed: ${report.summary.vehicleCount}`);
console.log(`Images replaced:    ${report.summary.imagesReplaced}`);
if (placeholderAudit) {
  console.log(
    `Placeholders left:  ${placeholderAudit.summary.placeholderImages} / ${placeholderAudit.summary.totalImages}`
  );
  console.log(`Fleet coverage:     ${placeholderAudit.summary.coveragePct}%`);
}
if (buildResult) {
  console.log(`Build:              ${buildResult.success ? "PASS" : "FAIL"}`);
}
console.log("\nWrote:");
console.log("  docs/media/photo-replacement-batch3.md");
console.log("  docs/media/photo-replacement-batch3.json\n");

if (buildResult && !buildResult.success) {
  process.exit(buildResult.exitCode || 1);
}
