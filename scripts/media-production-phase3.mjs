#!/usr/bin/env node
/**
 * Media Production Audit — Phase 3
 * Usage: node scripts/media-production-phase3.mjs [--skip-build]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  formatPhase3Markdown,
  runMediaProductionPhase3Audit,
} from "./lib/mediaProductionPhase3.mjs";

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

const report = runMediaProductionPhase3Audit({ rootDir: root, buildResult });

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "media-production-phase3.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(docsDir, "media-production-phase3.md"),
  `${formatPhase3Markdown(report)}\n`,
  "utf8"
);

console.log("Media Production Phase 3 audit complete.");
console.log(`  Surfaces: ${report.summary.surfacesAudited}`);
console.log(`  Manual:   ${report.summary.allManualPass ? "pass" : "fail"}`);
console.log(`  Broken:   ${report.summary.brokenImagesFound}`);
console.log(`  Build:    ${report.buildResult?.success ? "pass" : report.buildResult?.success === false ? "fail" : "skipped"}`);
console.log("  Wrote docs/media/media-production-phase3.md");
console.log("  Wrote docs/media/media-production-phase3.json");

if (!report.summary.allManualPass) {
  process.exitCode = 1;
}
