#!/usr/bin/env node
/**
 * Media Production Audit — Phase 2
 * Usage: node scripts/media-production-phase2.mjs [--skip-build]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  formatPhase2Markdown,
  runMediaProductionPhase2Audit,
} from "./lib/mediaProductionPhase2.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const docsDir = join(root, "docs", "media");
const skipBuild = process.argv.includes("--skip-build");

let buildResult = null;
if (!skipBuild) {
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
}

const report = runMediaProductionPhase2Audit({ rootDir: root, buildResult });

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "media-production-phase2.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(docsDir, "media-production-phase2.md"),
  `${formatPhase2Markdown(report)}\n`,
  "utf8"
);

console.log("Media Production Phase 2 audit complete.");
console.log(`  Surfaces: ${report.summary.surfacesAudited}`);
console.log(`  Golden:   ${report.summary.vehiclesVerified}`);
console.log(`  Manual:   ${report.summary.allManualPass ? "pass" : "fail"}`);
console.log(`  Broken:   ${report.summary.brokenGalleryImagesFound}`);
console.log(`  Build:    ${report.buildResult?.success ? "pass" : report.buildResult?.success === false ? "fail" : "skipped"}`);
console.log("  Wrote docs/media/media-production-phase2.md");
console.log("  Wrote docs/media/media-production-phase2.json");

if (!report.summary.allGoldenPass) {
  process.exitCode = 1;
}
