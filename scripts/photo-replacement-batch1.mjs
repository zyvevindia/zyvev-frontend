#!/usr/bin/env node
/**
 * Photo Replacement Sprint — Batch 1
 * Usage: node scripts/photo-replacement-batch1.mjs [--skip-build] [--skip-audit]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { runMediaPlaceholderAudit } from "./lib/mediaPlaceholderAudit.mjs";
import {
  formatBatch1Markdown,
  loadBatch1Seed,
  runPhotoReplacementBatch1,
} from "./lib/photoReplacementBatch1.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const docsDir = join(root, "docs", "media");
const skipBuild = process.argv.includes("--skip-build");
const skipAudit = process.argv.includes("--skip-audit");

console.log("\n=== Photo Replacement Sprint — Batch 1 ===\n");

const seed = loadBatch1Seed(root);
const report = await runPhotoReplacementBatch1({ root, seed });

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

report.generatedAt = new Date().toISOString();
const markdown = formatBatch1Markdown(report);

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "photo-replacement-batch1.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(docsDir, "photo-replacement-batch1.md"),
  `${markdown}\n`,
  "utf8"
);

console.log("\n=== Batch 1 complete ===\n");
console.log(`Vehicles completed: ${report.summary.vehicleCount}`);
console.log(`Images replaced:    ${report.summary.imagesReplaced}`);
if (placeholderAudit) {
  console.log(
    `Placeholders left:  ${placeholderAudit.summary.placeholderImages} / ${placeholderAudit.summary.totalImages}`
  );
}
if (buildResult) {
  console.log(`Build:              ${buildResult.success ? "PASS" : "FAIL"}`);
}
console.log("\nWrote:");
console.log("  docs/media/photo-replacement-batch1.md");
console.log("  docs/media/photo-replacement-batch1.json\n");

if (buildResult && !buildResult.success) {
  process.exit(buildResult.exitCode || 1);
}
